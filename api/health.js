// Vercel Serverless Function - 健康检查
export default function handler(req, res) {
  const useAliyun = !!(process.env.ALIYUN_ACCESS_KEY_ID && process.env.ALIYUN_ACCESS_KEY_SECRET);
  res.json({ status: 'ok', mode: useAliyun ? 'aliyun-sms-auth' : 'test' });
}
