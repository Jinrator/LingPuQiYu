import type { VercelRequest, VercelResponse } from '@vercel/node';
import { AuthError, requireAuth } from '../_lib/auth.js';
import { assertRateLimits, getClientIp, RateLimitError } from '../_lib/rate-limit.js';

interface ChatMessage {
  role: string;
  content: string;
}

const SYSTEM_PROMPT = `
角色设定
你是小老师，一位既专业又温暖的音乐启蒙导师。你喜欢用生动的比喻和日常生活中的例子来解释乐理，总是带着鼓励的语气。

对话风格
语气亲切自然，像朋友聊天，偶尔用“呀”、“呢”等语气词
每次解释都配一个生活化的比喻或小故事
解释完后，总会说“我们来试试看？”或“猜猜怎么着？”
用一些简单的emoji点缀 🎵✨🎹，但不要太多

核心教学逻辑（每次回答都按这个顺序）
1. 先共情，再解答（如果问题有趣或深刻，先夸奖一句）
2. 解释三步法
- 一句话说清核心（不要超过20个字）
- 举个好懂的例子（用歌曲、声音、日常现象举例）
- 给个亲身体验（“你可以现在试试...”）
3. 提出一个“顺其自然”的后续问题
不要用机械格式，而是像聊天一样自然带出：
“对了，说到这个... / 我突然想到... / 你可能也会好奇...”
然后提出一个具体、可操作的问题。
记得分段落。生动有趣的同时简洁明了。

重要原则
一定要给“马上能试”的小练习
后续问题要像聊天自然带出
不要用“第一、第二”这种讲课语气
不要问“你明白了吗？”
不要一次讲超过两个概念
`.trim();

function getDashScopeConfig() {
  return {
    apiKey: (process.env.DASHSCOPE_API_KEY || '').trim(),
    baseUrl: (
      process.env.DASHSCOPE_BASE_URL ||
      'https://dashscope.aliyuncs.com/compatible-mode/v1'
    ).trim(),
    model: (process.env.DEFAULT_MODEL || 'qwen-plus').trim(),
  };
}

function readMessages(req: VercelRequest): ChatMessage[] {
  const body = (req.body ?? {}) as { messages?: unknown };
  if (!Array.isArray(body.messages)) {
    return [];
  }

  return body.messages.flatMap((item) => {
    if (!item || typeof item !== 'object') {
      return [];
    }

    const record = item as { role?: unknown; content?: unknown };
    if (typeof record.role !== 'string' || typeof record.content !== 'string') {
      return [];
    }

    return [{ role: record.role, content: record.content }];
  });
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
): Promise<void> {
  if (req.method === 'GET') {
    res.json({ ok: true, message: 'AI chat endpoint is running.' });
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ success: false, message: 'Method not allowed' });
    return;
  }

  try {
    const auth = await requireAuth(req);
    const ip = getClientIp(req);
    assertRateLimits([
      {
        scope: 'ai:chat:user',
        identifier: auth.user.id,
        limit: 20,
        windowMs: 60 * 1000,
        blockMs: 60 * 1000,
        message: 'AI 请求过于频繁，请稍后再试',
      },
      {
        scope: 'ai:chat:ip',
        identifier: ip,
        limit: 40,
        windowMs: 60 * 1000,
        blockMs: 60 * 1000,
        message: 'AI 请求过于频繁，请稍后再试',
      },
    ]);

    const messages = readMessages(req);
    const filteredMessages = messages.filter(
      (message) => message.role === 'user' || message.role === 'assistant',
    );

    const { apiKey, baseUrl, model } = getDashScopeConfig();
    if (!apiKey) {
      res.status(500).json({ success: false, message: 'AI 服务暂未配置' });
      return;
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 120_000);

    try {
      const upstream = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            ...filteredMessages,
          ],
          temperature: 0.7,
          stream: false,
        }),
        signal: controller.signal,
      });

      if (!upstream.ok) {
        const text = await upstream.text();
        console.error('[AI] Upstream error:', upstream.status, text.slice(0, 500));
        res.status(502).json({ success: false, message: 'AI 服务暂时不可用，请稍后再试' });
        return;
      }

      const data = (await upstream.json()) as {
        choices?: Array<{ message?: { content?: string } }>;
      };

      const reply =
        data.choices?.[0]?.message?.content || '抱歉，我暂时没有生成有效回复。';

      res.json({
        reply,
        meta: {
          model,
          provider: 'qwen',
        },
      });
    } finally {
      clearTimeout(timeout);
    }
  } catch (error) {
    if (error instanceof AuthError) {
      res.status(error.status).json({ success: false, message: error.message });
      return;
    }
    if (error instanceof RateLimitError) {
      res.status(error.status).json({ success: false, message: error.message });
      return;
    }

    const isAbort = error instanceof Error && error.name === 'AbortError';
    console.error('[AI] 调用失败:', error instanceof Error ? error.message : 'unknown error');
    res.status(isAbort ? 504 : 500).json({
      success: false,
      message: isAbort ? 'AI 服务响应超时，请稍后再试' : 'AI 服务暂时不可用，请稍后再试',
    });
  }
}
