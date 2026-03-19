import type { VercelRequest, VercelResponse } from '@vercel/node';
import { signAuthToken } from '../_lib/auth.js';
import { verifyPhoneCode } from '../_lib/sms.js';
import { findUserByPhone } from '../_lib/users.js';

function readBody(req: VercelRequest): { phone: string; code: string } {
  const body = (req.body ?? {}) as { phone?: unknown; code?: unknown };
  return {
    phone: typeof body.phone === 'string' ? body.phone.trim() : '',
    code: typeof body.code === 'string' ? body.code.trim() : '',
  };
}

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (req.method !== 'POST') {
    res.status(405).json({ success: false, message: 'Method not allowed' });
    return;
  }

  const { phone, code } = readBody(req);
  if (!phone || !code) {
    res.status(400).json({ success: false, message: '参数不完整' });
    return;
  }

  try {
    const verification = await verifyPhoneCode(phone, code);
    if (!verification.success) {
      res.status(400).json(verification);
      return;
    }

    const user = await findUserByPhone(phone);
    if (!user) {
      res.status(404).json({
        success: false,
        code: 'USER_NOT_FOUND',
        message: '该手机号尚未注册，请先注册',
      });
      return;
    }

    const token = signAuthToken(user);
    res.json({ success: true, user, token });
  } catch (error) {
    const message = error instanceof Error ? error.message : '登录失败，请稍后重试';
    console.error('[Auth] 登录失败:', message);
    res.status(500).json({ success: false, message });
  }
}
