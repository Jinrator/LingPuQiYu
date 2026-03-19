import type { VercelRequest, VercelResponse } from '@vercel/node';
import { signAuthToken } from '../_lib/auth.js';
import { verifyPhoneCode } from '../_lib/sms.js';
import { createUserProfile, findUserRowByPhone, updateUserProfile } from '../_lib/users.js';

function readBody(req: VercelRequest): {
  phone: string;
  code: string;
  username?: string;
  courseType?: string;
} {
  const body = (req.body ?? {}) as {
    phone?: unknown;
    code?: unknown;
    username?: unknown;
    courseType?: unknown;
  };

  return {
    phone: typeof body.phone === 'string' ? body.phone.trim() : '',
    code: typeof body.code === 'string' ? body.code.trim() : '',
    username: typeof body.username === 'string' ? body.username.trim() : undefined,
    courseType: typeof body.courseType === 'string' ? body.courseType.trim() : undefined,
  };
}

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (req.method !== 'POST') {
    res.status(405).json({ success: false, message: 'Method not allowed' });
    return;
  }

  const { phone, code, username, courseType } = readBody(req);
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

    const existingRow = await findUserRowByPhone(phone);
    const user = existingRow
      ? await updateUserProfile(existingRow, { username, courseType })
      : await createUserProfile({ phone, username, courseType });

    const token = signAuthToken(user);
    res.json({ success: true, user, token });
  } catch (error) {
    const message = error instanceof Error ? error.message : '注册失败，请稍后重试';
    console.error('[Auth] 注册失败:', message);
    res.status(500).json({ success: false, message });
  }
}
