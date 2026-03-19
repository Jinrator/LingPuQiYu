import { signAuthToken } from '../_lib/auth.js';
import { verifyPhoneCode } from '../_lib/sms.js';
import { createUserProfile, findUserByPhone } from '../_lib/users.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  const { phone, code } = req.body || {};
  if (!phone || !code) {
    return res.status(400).json({ success: false, message: '参数不完整' });
  }

  try {
    const verification = await verifyPhoneCode(phone, code);
    if (!verification.success) {
      return res.status(400).json(verification);
    }

    let user = await findUserByPhone(phone);
    if (!user) {
      user = await createUserProfile({ phone });
    }

    const token = signAuthToken(user);
    return res.json({ success: true, user, token });
  } catch (err) {
    console.error('[Auth] 登录失败:', err.message);
    return res.status(500).json({ success: false, message: err.message || '登录失败，请稍后重试' });
  }
}
