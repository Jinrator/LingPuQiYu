import type { VercelRequest, VercelResponse } from '@vercel/node';
import {
  AuthError,
  verifyRefreshToken,
  revokeRefreshToken,
  issueTokenPair,
} from '../_lib/auth.js';
import { setCorsHeaders } from '../_lib/cors.js';
import { assertRateLimits, getClientIp, RateLimitError } from '../_lib/rate-limit.js';
import { findUserById } from '../_lib/users.js';

function readBody(req: VercelRequest): string {
  const body = (req.body ?? {}) as { refreshToken?: unknown };
  return typeof body.refreshToken === 'string' ? body.refreshToken.trim() : '';
}

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (setCorsHeaders(req, res)) return;

  if (req.method !== 'POST') {
    res.status(405).json({ success: false, message: 'Method not allowed' });
    return;
  }

  const refreshToken = readBody(req);
  if (!refreshToken) {
    res.status(400).json({ success: false, message: '缺少 refreshToken' });
    return;
  }

  try {
    const ip = getClientIp(req);
    assertRateLimits([
      {
        scope: 'auth:refresh:ip',
        identifier: ip,
        limit: 30,
        windowMs: 60 * 1000,
        message: '刷新请求过于频繁',
      },
    ]);

    // 验证旧 refresh token
    const row = await verifyRefreshToken(refreshToken);

    // 吊销旧 token（rotation：每次刷新都换新的）
    await revokeRefreshToken(refreshToken);

    // 查用户
    const user = await findUserById(row.user_id);
    if (!user) {
      throw new AuthError('用户不存在');
    }

    // 签发新的 token 对
    const pair = await issueTokenPair(user);
    res.json({
      success: true,
      token: pair.accessToken,
      refreshToken: pair.refreshToken,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      res.status(error.status).json({ success: false, message: error.message });
      return;
    }
    if (error instanceof RateLimitError) {
      res.status(error.status).json({ success: false, message: error.message });
      return;
    }

    console.error('[Auth] 刷新 token 失败:', error);
    res.status(500).json({ success: false, message: '刷新失败' });
  }
}
