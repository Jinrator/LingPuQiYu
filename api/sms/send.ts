import type { VercelRequest, VercelResponse } from '@vercel/node';
import { sendPhoneCode } from '../_lib/sms.js';

const rateLimitStore = new Map<string, number>();

function getRequestIp(req: VercelRequest): string {
  const forwarded = req.headers['x-forwarded-for'];
  const candidate = Array.isArray(forwarded) ? forwarded[0] : forwarded;
  return candidate?.split(',')[0]?.trim() || req.socket?.remoteAddress || 'unknown';
}

function readPhone(req: VercelRequest): string {
  const body = (req.body ?? {}) as { phone?: unknown };
  return typeof body.phone === 'string' ? body.phone.trim() : '';
}

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (req.method !== 'POST') {
    res.status(405).json({ success: false, message: 'Method not allowed' });
    return;
  }

  const ip = getRequestIp(req);
  const now = Date.now();
  const lastRequestAt = rateLimitStore.get(ip);
  if (lastRequestAt && now - lastRequestAt < 60_000) {
    res.status(429).json({ success: false, message: '请求太频繁，请稍后再试' });
    return;
  }
  rateLimitStore.set(ip, now);

  const phone = readPhone(req);
  if (!phone || !/^1\d{10}$/.test(phone)) {
    res.status(400).json({ success: false, message: '手机号格式不正确' });
    return;
  }

  const result = await sendPhoneCode(phone);
  if (!result.success && result.status) {
    res.status(result.status).json(result);
    return;
  }

  res.json(result);
}
