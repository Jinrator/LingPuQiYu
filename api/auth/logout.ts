import type { VercelRequest, VercelResponse } from '@vercel/node';
import { revokeRefreshToken, revokeAllUserTokens, requireAuth, AuthError } from '../_lib/auth.js';
import { setCorsHeaders } from '../_lib/cors.js';

function readBody(req: VercelRequest): { refreshToken: string; all: boolean } {
  const body = (req.body ?? {}) as { refreshToken?: unknown; all?: unknown };
  return {
    refreshToken: typeof body.refreshToken === 'string' ? body.refreshToken.trim() : '',
    all: body.all === true,
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
    const { refreshToken, all } = readBody(req);

    if (all) {
      // 吊销该用户所有 refresh token（踢掉所有设备）
      await revokeAllUserTokens(auth.user.id);
    } else if (refreshToken) {
      // 只吊销当前设备的 refresh token
      await revokeRefreshToken(refreshToken);
    }

    res.json({ success: true });
  } catch (error) {
    if (error instanceof AuthError) {
      res.status(error.status).json({ success: false, message: error.message });
      return;
    }

    console.error('[Auth] 登出失败:', error);
    res.status(500).json({ success: false, message: '登出失败' });
  }
}
