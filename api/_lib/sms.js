export async function verifyPhoneCode(phone, code) {
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

      const checkReq = new Dypnsapi.CheckSmsVerifyCodeRequest({
        phoneNumber: phone,
        countryCode: '86',
        verifyCode: code,
      });

      const result = await client.checkSmsVerifyCode(checkReq);
      const body = result.body || {};

      if (body.code === 'OK' && body.model?.verifyResult === 'PASS') {
        return { success: true };
      }

      let userMsg = '验证码错误';
      if (body.message && body.message.includes('expired')) {
        userMsg = '验证码已过期，请重新获取';
      }

      return { success: false, message: userMsg };
    } catch (err) {
      console.error('[SMS] 校验异常:', err.message);
      return { success: false, message: '校验失败，请稍后重试' };
    }
  }

  if (!allowTestSms) {
    return { success: false, message: '短信服务未配置' };
  }

  const testCode = process.env.TEST_SMS_CODE || '888888';
  if (code === testCode) {
    return { success: true };
  }

  return { success: false, message: '验证码错误' };
}
