import type { VercelRequest, VercelResponse } from '@vercel/node';
import { setCorsHeaders } from '../_lib/cors.js';
import { assertRateLimits, getClientIp, RateLimitError } from '../_lib/rate-limit.js';
import { isUsernameTaken, findUserRowByPhone } from '../_lib/users.js';
import { validateUsername } from '../_lib/validate.js';

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (setCorsHeaders(req, res)) return;

  if (req.method !== 'POST') {
    res.status(405).json({ success: false, message: 'Method not allowed' });
    return;
  }

  const body = (req.body ?? {}) as { username?: unknown; phone?: unknown };
  const username = typeof body.username === 'string' ? body.username.trim().toLowerCase() : undefined;
  const phone = typeof body.phone === 'string' ? body.phone.trim() : undefined;

  if (!username && !phone) {
    res.status(400).json({ success: false, message: '请提供用户名或手机号' });
    return;
  }

  try {
    const ip = getClientIp(req);
    assertRateLimits([{
      scope: 'auth:check:ip',
      identifier: ip,
      limit: 30,
      windowMs: 60 * 1000,
      blockMs: 60 * 1000,
      message: '查询过于频繁，请稍后再试',
    }]);

    const result: { usernameAvailable?: boolean; usernameMessage?: string; phoneAvailable?: boolean; phoneMessage?: string } = {};

    if (username) {
      const fmt = validateUsername(username);
      if (!fmt.valid) {
        result.usernameAvailable = false;
        result.usernameMessage = fmt.message;
      } else {
        const taken = await isUsernameTaken(username);
        result.usernameAvailable = !taken;
        if (taken) result.usernameMessage = '该用户名已被使用';
      }
    }

    if (phone) {
      if (!/^1\d{10}$/.test(phone)) {
        result.phoneAvailable = false;
        result.phoneMessage = '手机号格式不正确';
      } else {
        const row = await findUserRowByPhone(phone);
        result.phoneAvailable = !row;
        if (row) result.phoneMessage = '该手机号已注册';
      }
    }

    res.json({ success: true, ...result });
  } catch (error) {
    if (error instanceof RateLimitError) {
      res.status(error.status).json({ success: false, message: error.message });
      return;
    }
    console.error('[Auth] check-availability 失败:', error);
    res.status(500).json({ success: false, message: '查询失败' });
  }
}
