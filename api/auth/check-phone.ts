import type { VercelRequest, VercelResponse } from '@vercel/node';
import { findUserByPhone } from '../_lib/users.js';

function readPhone(req: VercelRequest): string {
  const body = (req.body ?? {}) as { phone?: unknown };
  return typeof body.phone === 'string' ? body.phone.trim() : '';
}

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (req.method !== 'POST') {
    res.status(405).json({ success: false, message: 'Method not allowed' });
    return;
  }

  const phone = readPhone(req);
  if (!phone) {
    res.status(400).json({ success: false, message: '参数不完整' });
    return;
  }

  try {
    const user = await findUserByPhone(phone);
    res.json({ success: true, exists: Boolean(user) });
  } catch (error) {
    const message = error instanceof Error ? error.message : '检查手机号失败';
    console.error('[Auth] 检查手机号失败:', message);
    res.status(500).json({ success: false, message });
  }
}
