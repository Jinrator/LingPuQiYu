import { readBearerToken, verifyAuthToken } from '../_lib/auth.js';
import { findUserById } from '../_lib/users.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    const token = readBearerToken(req);
    if (!token) {
      return res.status(401).json({ success: false, message: '缺少登录凭证' });
    }

    const payload = verifyAuthToken(token);
    if (!payload?.uid || !payload?.phone) {
      return res.status(401).json({ success: false, message: '登录状态已失效' });
    }

    const user = await findUserById(payload.uid);
    if (!user || user.phone !== payload.phone) {
      return res.status(401).json({ success: false, message: '用户不存在或已失效' });
    }

    return res.json({ success: true, user });
  } catch (err) {
    console.error('[Auth] 获取当前用户失败:', err.message);
    return res.status(500).json({ success: false, message: err.message || '获取用户失败' });
  }
}
