import type { VercelRequest, VercelResponse } from '@vercel/node';
import { AuthError, requireAuth } from '../_lib/auth.js';
import { setCorsHeaders } from '../_lib/cors.js';
import { assertRateLimits, getClientIp, RateLimitError } from '../_lib/rate-limit.js';
import { findUserRowById, updateUserPasswordHash } from '../_lib/users.js';
import { hashPassword, verifyPassword } from '../_lib/password.js';
import { validatePassword } from '../_lib/validate.js';

function readBody(req: VercelRequest): {
  oldPassword: string;
  newPassword: string;
} {
  const body = (req.body ?? {}) as {
    oldPassword?: unknown;
    newPassword?: unknown;
  };
  return {
    oldPassword: typeof body.oldPassword === 'string' ? body.oldPassword : '',
    newPassword: typeof body.newPassword === 'string' ? body.newPassword : '',
  };
}

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (setCorsHeaders(req, res)) return;

  if (req.method !== 'POST') {
    res.status(405).json({ success: false, message: 'Method not allowed' });
    return;
  }

  try {
    const auth = await requireAuth(req);
    const ip = getClientIp(req);

    assertRateLimits([
      {
        scope: 'profile:password:user',
        identifier: auth.user.id,
        limit: 5,
        windowMs: 10 * 60 * 1000,
        message: '操作太频繁，请稍后再试',
      },
      {
        scope: 'profile:password:ip',
        identifier: ip,
        limit: 10,
        windowMs: 10 * 60 * 1000,
        message: '操作太频繁，请稍后再试',
      },
    ]);

    const { oldPassword, newPassword } = readBody(req);

    if (!newPassword) {
      res.status(400).json({ success: false, message: '请输入新密码' });
      return;
    }

    const pwCheck = validatePassword(newPassword);
    if (!pwCheck.valid) {
      res.status(400).json({ success: false, message: pwCheck.message });
      return;
    }

    const row = await findUserRowById(auth.user.id);
    if (!row) {
      res.status(404).json({ success: false, message: '用户不存在' });
      return;
    }

    // 如果已有密码，需要验证旧密码
    if (row.password_hash) {
      if (!oldPassword) {
        res.status(400).json({ success: false, message: '请输入当前密码' });
        return;
      }
      if (!verifyPassword(oldPassword, row.password_hash)) {
        res.status(401).json({ success: false, message: '当前密码错误' });
        return;
      }
    }

    await updateUserPasswordHash(auth.user.id, hashPassword(newPassword));
    res.json({ success: true, message: '密码设置成功' });
  } catch (error) {
    if (error instanceof AuthError) {
      res.status(error.status).json({ success: false, message: error.message });
      return;
    }
    if (error instanceof RateLimitError) {
      res.status(error.status).json({ success: false, message: error.message });
      return;
    }

    console.error('[Profile] 密码更新失败:', error);
    res.status(500).json({ success: false, message: '操作失败' });
  }
}
