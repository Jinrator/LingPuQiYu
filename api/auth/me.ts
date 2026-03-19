import type { VercelRequest, VercelResponse } from '@vercel/node';
import { readBearerToken, verifyAuthToken } from '../_lib/auth.js';
import { findUserById } from '../_lib/users.js';

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (req.method !== 'GET') {
    res.status(405).json({ success: false, message: 'Method not allowed' });
    return;
  }

  try {
    const token = readBearerToken(req);
    if (!token) {
      res.status(401).json({ success: false, message: '缺少登录凭证' });
      return;
    }

    const payload = verifyAuthToken(token);
    if (!payload?.uid || !payload?.phone) {
      res.status(401).json({ success: false, message: '登录状态已失效' });
      return;
    }

    const user = await findUserById(payload.uid);
    if (!user || user.phone !== payload.phone) {
      res.status(401).json({ success: false, message: '用户不存在或已失效' });
      return;
    }

    res.json({ success: true, user });
  } catch (error) {
    const message = error instanceof Error ? error.message : '获取用户失败';
    console.error('[Auth] 获取当前用户失败:', message);
    res.status(500).json({ success: false, message });
  }
}
