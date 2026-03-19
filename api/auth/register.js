import { signAuthToken } from '../_lib/auth.js';
import { verifyPhoneCode } from '../_lib/sms.js';
import { createUserProfile, findUserRowByPhone, updateUserProfile } from '../_lib/users.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  const { phone, code, username, courseType } = req.body || {};
  if (!phone || !code) {
    return res.status(400).json({ success: false, message: '参数不完整' });
  }

  try {
    const verification = await verifyPhoneCode(phone, code);
    if (!verification.success) {
      return res.status(400).json(verification);
    }

    const existingRow = await findUserRowByPhone(phone);
    const user = existingRow
      ? await updateUserProfile(existingRow, { username, courseType })
      : await createUserProfile({ phone, username, courseType });

    const token = signAuthToken(user);
    return res.json({ success: true, user, token });
  } catch (err) {
    console.error('[Auth] 注册失败:', err.message);
    return res.status(500).json({ success: false, message: err.message || '注册失败，请稍后重试' });
  }
}
