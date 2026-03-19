// Vercel Serverless Function - 校验短信验证码
// 对应原 server/index.js POST /api/sms/verify

import { verifyPhoneCode } from '../_lib/sms.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  const { phone, code } = req.body;

  if (!phone || !code) {
    return res.status(400).json({ success: false, message: '参数不完整' });
  }

  const result = await verifyPhoneCode(phone, code);
  return res.json(result);
}
