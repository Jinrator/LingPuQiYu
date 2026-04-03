import type { VercelRequest, VercelResponse } from '@vercel/node';
import { AuthError, requireAuth } from '../_lib/auth.js';
import { setCorsHeaders } from '../_lib/cors.js';

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (setCorsHeaders(req, res)) return;

  if (req.method !== 'GET') {
    res.status(405).json({ success: false, message: 'Method not allowed' });
    return;
  }

  try {
    const auth = await requireAuth(req);
    res.json({ success: true, user: auth.user });
  } catch (error) {
    if (error instanceof AuthError) {
      res.status(error.status).json({ success: false, message: error.message });
      return;
    }

    console.error('[Auth] 获取当前用户失败:', error);
    res.status(500).json({ success: false, message: '获取用户失败' });
  }
}
