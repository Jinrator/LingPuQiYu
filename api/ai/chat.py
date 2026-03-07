import os
import httpx
from typing import Any, Dict, List, Optional

try:
    from dotenv import load_dotenv
    load_dotenv(".env.local", override=False)
except ImportError:
    pass  # Vercel 环境无需 dotenv，直接用平台注入的环境变量

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

app = FastAPI()

DASHSCOPE_API_KEY = os.getenv("DASHSCOPE_API_KEY", "").strip()
DASHSCOPE_BASE_URL = os.getenv(
    "DASHSCOPE_BASE_URL",
    "https://dashscope.aliyuncs.com/compatible-mode/v1"
).strip()
DEFAULT_MODEL = os.getenv("DEFAULT_MODEL", "qwen-plus").strip()



class Message(BaseModel):
    role: str
    content: str


class AIChatIn(BaseModel):
    messages: List[Message]
    context: Optional[Dict[str, Any]] = None


@app.get("/api/ai/chat")
async def health_check():
    return {"ok": True, "message": "AI chat endpoint is running."}


@app.post("/api/ai/chat")
async def ai_chat(body: AIChatIn):
    if not DASHSCOPE_API_KEY:
        raise HTTPException(status_code=500, detail="Missing DASHSCOPE_API_KEY")

    filtered_messages = []
    for m in body.messages:
        if m.role == "system":
            continue
        if m.role not in ("user", "assistant"):
            continue
        filtered_messages.append({
            "role": m.role,
            "content": m.content
        })
    SYSTEM_PROMPT = r"""
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
- 给个亲身体验（“你可以现在试试…”）
3. 提出一个“顺其自然”的后续问题
不要用机械格式，而是像聊天一样自然带出：
“对了，说到这个… / 我突然想到… / 你可能也会好奇…”
然后提出一个具体、可操作的问题。

重要原则
✅ 一定要用比喻，但比喻要贴切
✅ 一定要给“马上能试”的小练习
✅ 后续问题要像聊天自然带出
❌ 不要用“第一、第二”这种讲课语气
❌ 不要问“你明白了吗？”
❌ 不要一次讲超过两个概念
"""

    final_messages = [
        {"role": "system", "content": SYSTEM_PROMPT},
        *filtered_messages
    ]

    payload = {
        "model": DEFAULT_MODEL,
        "messages": final_messages,
        "temperature": 0.7,
        "stream": False
    }

    headers = {
        "Authorization": f"Bearer {DASHSCOPE_API_KEY}",
        "Content-Type": "application/json"
    }

    url = f"{DASHSCOPE_BASE_URL}/chat/completions"

    try:
        async with httpx.AsyncClient(timeout=120) as client:
            resp = await client.post(url, headers=headers, json=payload)

        if resp.status_code != 200:
            raise HTTPException(
                status_code=502,
                detail=f"Upstream error: {resp.status_code} {resp.text[:500]}"
            )

        data = resp.json()

        reply = (
            (data.get("choices") or [{}])[0]
            .get("message", {})
            .get("content", "")
        )

        if not reply:
            reply = "抱歉，我暂时没有生成有效回复。"

        return {
            "reply": reply,
            "meta": {
                "model": DEFAULT_MODEL,
                "provider": "qwen"
            }
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Server error: {str(e)}")
