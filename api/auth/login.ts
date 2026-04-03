import type { VercelRequest, VercelResponse } from '@vercel/node';
import { issueTokenPair } from '../_lib/auth.js';
import { setCorsHeaders } from '../_lib/cors.js';
import { assertRateLimits, getClientIp, RateLimitError } from '../_lib/rate-limit.js';
import { verifyPhoneCode } from '../_lib/sms.js';
import { findUserByPhone } from '../_lib/users.js';

function readBody(req: VercelRequest): { phone: string; code: string } {
  const body = (req.body ?? {}) as { phone?: unknown; code?: unknown };
  return {
    phone: typeof body.phone === 'string' ? body.phone.trim() : '',
    code: typeof body.code === 'string' ? body.code.trim() : '',
  };
}

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (setCorsHeaders(req, res)) return;

  if (req.method !== 'POST') {
    res.status(405).json({ success: false, message: 'Method not allowed' });
    return;
  }

  const { phone, code } = readBody(req);
  if (!phone || !code) {
    res.status(400).json({ success: false, message: '参数不完整' });
    return;
  }
  if (!/^1\d{10}$/.test(phone)) {
    res.status(400).json({ success: false, message: '手机号格式不正确' });
    return;
  }

  try {
    const ip = getClientIp(req);
    assertRateLimits([
      {
        scope: 'auth:login:ip',
        identifier: ip,
        limit: 10,
        windowMs: 10 * 60 * 1000,
        blockMs: 10 * 60 * 1000,
        message: '登录尝试过于频繁，请稍后再试',
      },
      {
        scope: 'auth:login:phone',
        identifier: phone,
        limit: 6,
        windowMs: 10 * 60 * 1000,
        blockMs: 10 * 60 * 1000,
        message: '该手机号尝试次数过多，请稍后再试',
      },
    ]);

    const verification = await verifyPhoneCode(phone, code);
    if (!verification.success) {
      res.status(400).json(verification);
      return;
    }

    const user = await findUserByPhone(phone);
    if (!user) {
      res.status(404).json({
        success: false,
        code: 'USER_NOT_FOUND',
        message: '该手机号尚未注册，请先注册',
      });
      return;
    }

    const { accessToken, refreshToken } = await issueTokenPair(user);
    res.json({ success: true, user, token: accessToken, refreshToken });
  } catch (error) {
    if (error instanceof RateLimitError) {
      res.status(error.status).json({ success: false, message: error.message });
      return;
    }

    console.error('[Auth] 登录失败:', error);
    res.status(500).json({ success: false, message: '登录失败' });
  }
}
