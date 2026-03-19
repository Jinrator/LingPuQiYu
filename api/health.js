// Vercel Serverless Function - 健康检查
export default function handler(req, res) {
  const useAliyun = !!(process.env.ALIYUN_ACCESS_KEY_ID && process.env.ALIYUN_ACCESS_KEY_SECRET);
  const hasSupabase = !!(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
  const allowTestSms = process.env.ALLOW_TEST_SMS === 'true';
  res.json({
    status: 'ok',
    mode: useAliyun ? 'aliyun-sms-auth' : 'test',
    smsTestMode: allowTestSms,
    database: hasSupabase ? 'supabase-ready' : 'supabase-missing',
  });
}
