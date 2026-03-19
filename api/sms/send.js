// Vercel Serverless Function - 发送短信验证码
// 对应原 server/index.js POST /api/sms/send

const rateLimitStore = new Map(); // 简单内存限流（同实例内有效）

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  // 基础 IP 限流：同 IP 60 秒内只能请求一次
  const ip = req.headers['x-forwarded-for']?.split(',')[0] || req.socket?.remoteAddress || 'unknown';
  const now = Date.now();
  const lastRequest = rateLimitStore.get(ip);
  if (lastRequest && now - lastRequest < 60_000) {
    return res.status(429).json({ success: false, message: '请求太频繁，请稍后再试' });
  }
  rateLimitStore.set(ip, now);

  const { phone } = req.body;

  if (!phone || !/^1\d{10}$/.test(phone)) {
    return res.status(400).json({ success: false, message: '手机号格式不正确' });
  }

  const accessKeyId = process.env.ALIYUN_ACCESS_KEY_ID;
  const accessKeySecret = process.env.ALIYUN_ACCESS_KEY_SECRET;
  const useAliyun = !!(accessKeyId && accessKeySecret);
  const allowTestSms = process.env.ALLOW_TEST_SMS === 'true';

  if (useAliyun) {
    try {
      const Dypnsapi = await import('@alicloud/dypnsapi20170525');
      const OpenApi = await import('@alicloud/openapi-client');

      const config = new OpenApi.default.Config({ accessKeyId, accessKeySecret });
      config.endpoint = 'dypnsapi.aliyuncs.com';
      const client = new Dypnsapi.default(config);

      const sendReq = new Dypnsapi.SendSmsVerifyCodeRequest({
        phoneNumber: phone,
        countryCode: '86',
        codeLength: 6,
        validTime: 300,
        interval: 60,
        codeType: 1,
        signName: process.env.SMS_SIGN_NAME || undefined,
        templateCode: process.env.SMS_TEMPLATE_CODE || undefined,
        schemeName: process.env.SMS_SCHEME_NAME || undefined,
        templateParam: JSON.stringify({ code: '##code##', min: '5' }),
      });

      const result = await client.sendSmsVerifyCode(sendReq);
      const body = result.body || {};

      if (body.code === 'OK') {
        return res.json({ success: true, message: '验证码已发送' });
      }

      let userMsg = body.message || '发送失败';
      if (body.code === 'biz.FREQUENCY') userMsg = '发送太频繁，请稍后再试';
      else if (body.code === 'InternalError') userMsg = '服务暂时不可用，请稍后重试';
      else if (body.code === 'isv.BUSINESS_LIMIT_CONTROL') userMsg = '今日发送次数已达上限';

      return res.json({ success: false, message: userMsg });
    } catch (err) {
      console.error('[SMS] 发送异常:', err.message);
      return res.status(500).json({ success: false, message: '短信发送失败，请稍后重试' });
    }
  } else {
    if (!allowTestSms) {
      return res.status(503).json({ success: false, message: '短信服务未配置' });
    }

    // Serverless 无状态，测试环境统一使用固定码，便于和 verify 端保持一致
    const testCode = process.env.TEST_SMS_CODE || '888888';
    console.log(`[SMS] 测试验证码 -> ${phone}: ${testCode}`);
    return res.json({ success: true, message: '验证码已发送（测试环境）' });
  }
}
