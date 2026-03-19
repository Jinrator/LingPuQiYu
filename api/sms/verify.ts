import type { VercelRequest, VercelResponse } from '@vercel/node';
import { verifyPhoneCode } from '../_lib/sms.js';

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

  const result = await verifyPhoneCode(phone, code);
  res.json(result);
}
