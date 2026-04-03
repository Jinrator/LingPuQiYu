import type { VercelRequest, VercelResponse } from '@vercel/node';
import { issueTokenPair } from '../_lib/auth.js';
import { setCorsHeaders } from '../_lib/cors.js';
import { assertRateLimits, getClientIp, RateLimitError } from '../_lib/rate-limit.js';
import { verifyPhoneCode } from '../_lib/sms.js';
import { createUserProfile, findUserRowByPhone, updateUserProfile } from '../_lib/users.js';
import { MAX_USERNAME_LENGTH, MAX_COURSE_TYPE_LENGTH, sanitizeString } from '../_lib/validate.js';

function readBody(req: VercelRequest): {
  phone: string;
  code: string;
  username?: string;
  courseType?: string;
} {
  const body = (req.body ?? {}) as {
    phone?: unknown;
    code?: unknown;
    username?: unknown;
    courseType?: unknown;
  };

  return {
    phone: typeof body.phone === 'string' ? body.phone.trim() : '',
    code: typeof body.code === 'string' ? body.code.trim() : '',
    username: typeof body.username === 'string' ? sanitizeString(body.username, MAX_USERNAME_LENGTH) : undefined,
    courseType: typeof body.courseType === 'string' ? sanitizeString(body.courseType, MAX_COURSE_TYPE_LENGTH) : undefined,
  };
}

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (setCorsHeaders(req, res)) return;

  if (req.method !== 'POST') {
    res.status(405).json({ success: false, message: 'Method not allowed' });
    return;
  }

  const { phone, code, username, courseType } = readBody(req);
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
        scope: 'auth:register:ip',
        identifier: ip,
        limit: 8,
        windowMs: 10 * 60 * 1000,
        blockMs: 10 * 60 * 1000,
        message: '注册尝试过于频繁，请稍后再试',
      },
      {
        scope: 'auth:register:phone',
        identifier: phone,
        limit: 5,
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

    const existingRow = await findUserRowByPhone(phone);
    const user = existingRow
      ? await updateUserProfile(existingRow, { username, courseType })
      : await createUserProfile({ phone, username, courseType });

    const { accessToken, refreshToken } = await issueTokenPair(user);
    res.json({ success: true, user, token: accessToken, refreshToken });
  } catch (error) {
    if (error instanceof RateLimitError) {
      res.status(error.status).json({ success: false, message: error.message });
      return;
    }

    console.error('[Auth] 注册失败:', error);
    res.status(500).json({ success: false, message: '注册失败' });
  }
}
