import type { VercelRequest, VercelResponse } from '@vercel/node';
import { issueTokenPair } from '../_lib/auth.js';
import { setCorsHeaders } from '../_lib/cors.js';
import { assertRateLimits, getClientIp, RateLimitError } from '../_lib/rate-limit.js';
import { verifyPhoneCode } from '../_lib/sms.js';
import { findUserByPhone, findUserRowByPhone, findUserRowByUsername } from '../_lib/users.js';
import { verifyPassword } from '../_lib/password.js';
import type { AppUserRow, AuthUser } from '../_lib/types.js';

type LoginMode = 'sms' | 'password';

function readBody(req: VercelRequest): {
  account: string;
  phone: string;
  code: string;
  password: string;
  mode: LoginMode;
} {
  const body = (req.body ?? {}) as {
    account?: unknown;
    phone?: unknown;
    code?: unknown;
    password?: unknown;
    mode?: unknown;
  };
  const account = typeof body.account === 'string' ? body.account.trim() : '';
  const phone = typeof body.phone === 'string' ? body.phone.trim() : '';
  return {
    account,
    phone: phone || account,
    code: typeof body.code === 'string' ? body.code.trim() : '',
    password: typeof body.password === 'string' ? body.password : '',
    mode: body.mode === 'sms' ? 'sms' : 'password',
  };
}

function isPhoneNumber(value: string): boolean {
  return /^1\d{10}$/.test(value);
}

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (setCorsHeaders(req, res)) return;

  if (req.method !== 'POST') {
    res.status(405).json({ success: false, message: 'Method not allowed' });
    return;
  }

  const { account, phone, code, password, mode } = readBody(req);

  try {
    const ip = getClientIp(req);
    assertRateLimits([
      {
        scope: 'auth:login:ip',
        identifier: ip,
        limit: 20,
        windowMs: 10 * 60 * 1000,
        blockMs: 5 * 60 * 1000,
        message: '登录尝试过于频繁，请 5 分钟后再试',
      },
    ]);

    if (mode === 'password') {
      // 密码登录：account 可以是手机号或 username
      const identifier = account || phone;
      if (!identifier) {
        res.status(400).json({ success: false, message: '请输入手机号或用户名' });
        return;
      }
      if (!password) {
        res.status(400).json({ success: false, message: '请输入密码' });
        return;
      }

      assertRateLimits([{
        scope: 'auth:login:account',
        identifier,
        limit: 12,
        windowMs: 10 * 60 * 1000,
        blockMs: 3 * 60 * 1000,
        message: '该账号尝试次数过多，请 3 分钟后再试',
      }]);

      // 根据格式判断是手机号还是 username
      let row: AppUserRow | null = null;
      if (isPhoneNumber(identifier)) {
        row = await findUserRowByPhone(identifier);
      } else {
        row = await findUserRowByUsername(identifier.toLowerCase());
      }

      if (!row) {
        res.status(404).json({
          success: false,
          code: 'USER_NOT_FOUND',
          message: '账号不存在，请先注册',
        });
        return;
      }

      if (!row.password_hash) {
        res.status(400).json({
          success: false,
          code: 'NO_PASSWORD',
          message: '该账号未设置密码，请使用验证码登录',
        });
        return;
      }

      if (!verifyPassword(password, row.password_hash)) {
        res.status(401).json({ success: false, message: '密码错误' });
        return;
      }

      const user = await findUserByPhone(row.phone);
      if (!user) {
        res.status(500).json({ success: false, message: '用户数据异常' });
        return;
      }

      const { accessToken, refreshToken } = await issueTokenPair(user);
      res.json({ success: true, user, token: accessToken, refreshToken });
    } else {
      // SMS 验证码登录
      if (!phone || !isPhoneNumber(phone)) {
        res.status(400).json({ success: false, message: '手机号格式不正确' });
        return;
      }
      if (!code) {
        res.status(400).json({ success: false, message: '请输入验证码' });
        return;
      }

      assertRateLimits([{
        scope: 'auth:login:phone',
        identifier: phone,
        limit: 12,
        windowMs: 10 * 60 * 1000,
        blockMs: 3 * 60 * 1000,
        message: '该手机号尝试次数过多，请 3 分钟后再试',
      }]);

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
    }
  } catch (error) {
    if (error instanceof RateLimitError) {
      res.status(error.status).json({ success: false, message: error.message });
      return;
    }

    console.error('[Auth] 登录失败:', error);
    res.status(500).json({ success: false, message: '登录失败' });
  }
}
