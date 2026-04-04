import type { VercelRequest, VercelResponse } from '@vercel/node';
import { issueTokenPair } from '../_lib/auth.js';
import { setCorsHeaders } from '../_lib/cors.js';
import { assertRateLimits, getClientIp, RateLimitError } from '../_lib/rate-limit.js';
import { verifyPhoneCode } from '../_lib/sms.js';
import { createUserProfile, findUserRowByPhone, isUsernameTaken } from '../_lib/users.js';
import { MAX_DISPLAY_NAME_LENGTH, MAX_COURSE_TYPE_LENGTH, sanitizeString, validatePassword, validateUsername } from '../_lib/validate.js';
import { hashPassword } from '../_lib/password.js';

function readBody(req: VercelRequest): {
  phone: string;
  code: string;
  username?: string;
  displayName?: string;
  courseType?: string;
  password?: string;
} {
  const body = (req.body ?? {}) as {
    phone?: unknown;
    code?: unknown;
    username?: unknown;
    displayName?: unknown;
    courseType?: unknown;
    password?: unknown;
  };

  return {
    phone: typeof body.phone === 'string' ? body.phone.trim() : '',
    code: typeof body.code === 'string' ? body.code.trim() : '',
    username: typeof body.username === 'string' ? body.username.trim().toLowerCase() : undefined,
    displayName: typeof body.displayName === 'string' ? sanitizeString(body.displayName, MAX_DISPLAY_NAME_LENGTH) : undefined,
    courseType: typeof body.courseType === 'string' ? sanitizeString(body.courseType, MAX_COURSE_TYPE_LENGTH) : undefined,
    password: typeof body.password === 'string' ? body.password : undefined,
  };
}

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (setCorsHeaders(req, res)) return;

  if (req.method !== 'POST') {
    res.status(405).json({ success: false, message: 'Method not allowed' });
    return;
  }

  const { phone, code, username, displayName, courseType, password } = readBody(req);
  if (!phone || !code) {
    res.status(400).json({ success: false, message: '参数不完整' });
    return;
  }
  if (!/^1\d{10}$/.test(phone)) {
    res.status(400).json({ success: false, message: '手机号格式不正确' });
    return;
  }

  // username 必填且校验格式
  if (!username) {
    res.status(400).json({ success: false, message: '请设置用户名' });
    return;
  }
  const unCheck = validateUsername(username);
  if (!unCheck.valid) {
    res.status(400).json({ success: false, message: unCheck.message });
    return;
  }

  // displayName 必填
  if (!displayName) {
    res.status(400).json({ success: false, message: '请填写昵称' });
    return;
  }

  // 密码可选，但如果提供了就要校验
  if (password !== undefined) {
    const pwCheck = validatePassword(password);
    if (!pwCheck.valid) {
      res.status(400).json({ success: false, message: pwCheck.message });
      return;
    }
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

    // 查重 phone
    const existingRow = await findUserRowByPhone(phone);
    if (existingRow) {
      res.status(409).json({ success: false, code: 'PHONE_TAKEN', message: '该手机号已注册' });
      return;
    }

    // 查重 username
    if (await isUsernameTaken(username)) {
      res.status(409).json({ success: false, code: 'USERNAME_TAKEN', message: '该用户名已被使用' });
      return;
    }

    const passwordHash = password ? hashPassword(password) : undefined;

    const user = await createUserProfile({ phone, username, displayName, courseType, passwordHash });

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
