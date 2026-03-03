// Vercel Serverless Function - 校验短信验证码
// 对应原 server/index.js POST /api/sms/verify

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  const { phone, code } = req.body;

  if (!phone || !code) {
    return res.status(400).json({ success: false, message: '参数不完整' });
  }

  const accessKeyId = process.env.ALIYUN_ACCESS_KEY_ID;
  const accessKeySecret = process.env.ALIYUN_ACCESS_KEY_SECRET;
  const useAliyun = !!(accessKeyId && accessKeySecret);

  if (useAliyun) {
    try {
      const Dypnsapi = await import('@alicloud/dypnsapi20170525');
      const OpenApi = await import('@alicloud/openapi-client');

      const config = new OpenApi.default.Config({ accessKeyId, accessKeySecret });
      config.endpoint = 'dypnsapi.aliyuncs.com';
      const client = new Dypnsapi.default(config);

      const checkReq = new Dypnsapi.CheckSmsVerifyCodeRequest({
        phoneNumber: phone,
        countryCode: '86',
        verifyCode: code,
      });

      const result = await client.checkSmsVerifyCode(checkReq);
      const body = result.body || {};

      if (body.code === 'OK' && body.model?.verifyResult === 'PASS') {
        return res.json({ success: true });
      }

      let userMsg = '验证码错误';
      if (body.message && body.message.includes('expired')) userMsg = '验证码已过期，请重新获取';

      return res.json({ success: false, message: userMsg });
    } catch (err) {
      console.error('[SMS] 校验异常:', err.message);
      return res.status(500).json({ success: false, message: '校验失败，请稍后重试' });
    }
  } else {
    // 测试模式 - Serverless 无状态，测试模式下直接接受固定码 888888
    const TEST_CODE = process.env.TEST_SMS_CODE || '888888';
    if (code === TEST_CODE) {
      return res.json({ success: true });
    }
    return res.json({ success: false, message: '验证码错误' });
  }
}
