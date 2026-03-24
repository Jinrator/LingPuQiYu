import type { VercelRequest, VercelResponse } from '@vercel/node';
import { assertRateLimits, getClientIp, RateLimitError } from '../_lib/rate-limit.js';
import { sendPhoneCode } from '../_lib/sms.js';

function readPhone(req: VercelRequest): string {
  const body = (req.body ?? {}) as { phone?: unknown };
  return typeof body.phone === 'string' ? body.phone.trim() : '';
}

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (req.method !== 'POST') {
    res.status(405).json({ success: false, message: 'Method not allowed' });
    return;
  }

  const phone = readPhone(req);
  if (!phone || !/^1\d{10}$/.test(phone)) {
    res.status(400).json({ success: false, message: '手机号格式不正确' });
    return;
  }

  try {
    const ip = getClientIp(req);
    assertRateLimits([
      {
        scope: 'sms:send:ip',
        identifier: ip,
        limit: 5,
        windowMs: 10 * 60 * 1000,
        blockMs: 10 * 60 * 1000,
        message: '请求太频繁，请稍后再试',
      },
      {
        scope: 'sms:send:phone:minute',
        identifier: phone,
        limit: 1,
        windowMs: 60 * 1000,
        blockMs: 60 * 1000,
        message: '发送太频繁，请稍后再试',
      },
      {
        scope: 'sms:send:phone:day',
        identifier: phone,
        limit: 10,
        windowMs: 24 * 60 * 60 * 1000,
        message: '今日发送次数已达上限',
      },
    ]);

    const result = await sendPhoneCode(phone);
    if (!result.success && result.status) {
      res.status(result.status).json(result);
      return;
    }

    res.json(result);
  } catch (error) {
    if (error instanceof RateLimitError) {
      res.status(error.status).json({ success: false, message: error.message });
      return;
    }

    console.error('[SMS] 发送失败:', error instanceof Error ? error.message : 'unknown error');
    res.status(500).json({ success: false, message: '短信发送失败，请稍后重试' });
  }
}
