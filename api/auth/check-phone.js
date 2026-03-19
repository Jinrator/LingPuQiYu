import { findUserByPhone } from '../_lib/users.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  const { phone } = req.body || {};
  if (!phone) {
    return res.status(400).json({ success: false, message: '参数不完整' });
  }

  try {
    const user = await findUserByPhone(phone);
    return res.json({ success: true, exists: !!user });
  } catch (err) {
    console.error('[Auth] 检查手机号失败:', err.message);
    return res.status(500).json({ success: false, message: err.message || '检查手机号失败' });
  }
}
