import type { VercelRequest, VercelResponse } from '@vercel/node';
import { setCorsHeaders } from './_lib/cors.js';

export default function handler(req: VercelRequest, res: VercelResponse): void {
  if (setCorsHeaders(req, res)) return;
  res.json({ status: 'ok' });
}
