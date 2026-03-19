import type { VercelRequest, VercelResponse } from '@vercel/node';
import { isAliyunSmsEnabled, isTestSmsEnabled } from './_lib/sms.js';

export default function handler(_req: VercelRequest, res: VercelResponse): void {
  const hasSupabase = Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
  res.json({
    status: 'ok',
    mode: isAliyunSmsEnabled() ? 'aliyun-sms-auth' : 'test',
    smsTestMode: isTestSmsEnabled(),
    database: hasSupabase ? 'supabase-ready' : 'supabase-missing',
  });
}
