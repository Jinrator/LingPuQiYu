import type { SmsSendResult, SmsVerificationResult } from './types.js';

type AliyunModuleNamespace = Record<string, any>;

interface AliyunSmsClientContext {
  Dypnsapi: AliyunModuleNamespace;
  client: any;
}

function getAliyunConfig() {
  return {
    accessKeyId: process.env.ALIYUN_ACCESS_KEY_ID || '',
    accessKeySecret: process.env.ALIYUN_ACCESS_KEY_SECRET || '',
    signName: process.env.SMS_SIGN_NAME || '',
    templateCode: process.env.SMS_TEMPLATE_CODE || '',
    schemeName: process.env.SMS_SCHEME_NAME || '',
  };
}

function isProductionEnvironment(): boolean {
  const runtime = (process.env.VERCEL_ENV || process.env.NODE_ENV || 'development').toLowerCase();
  return runtime === 'production';
}

function getTestSmsCode(): string {
  return (process.env.TEST_SMS_CODE || '').trim();
}

export function isAliyunSmsEnabled(): boolean {
  const { accessKeyId, accessKeySecret } = getAliyunConfig();
  return Boolean(accessKeyId && accessKeySecret);
}

export function isTestSmsEnabled(): boolean {
  return process.env.ALLOW_TEST_SMS === 'true' && !isProductionEnvironment();
}

async function createAliyunSmsClient(): Promise<AliyunSmsClientContext | null> {
  const { accessKeyId, accessKeySecret } = getAliyunConfig();
  if (!accessKeyId || !accessKeySecret) {
    return null;
  }

  const DypnsapiModule = (await import('@alicloud/dypnsapi20170525')) as unknown as AliyunModuleNamespace;
  const OpenApiModule = (await import('@alicloud/openapi-client')) as unknown as AliyunModuleNamespace;
  const DypnsapiClient = DypnsapiModule.default?.default || DypnsapiModule.default;
  const config = new OpenApiModule.Config({ accessKeyId, accessKeySecret });
  config.endpoint = 'dypnsapi.aliyuncs.com';

  return {
    Dypnsapi: DypnsapiModule,
    client: new DypnsapiClient(config),
  };
}

export async function sendPhoneCode(phone: string): Promise<SmsSendResult> {
  const aliyunContext = await createAliyunSmsClient();
  if (aliyunContext) {
    try {
      const { Dypnsapi, client } = aliyunContext;
      const { signName, templateCode, schemeName } = getAliyunConfig();
      const sendReq = new Dypnsapi.SendSmsVerifyCodeRequest({
        phoneNumber: phone,
        countryCode: '86',
        codeLength: 6,
        validTime: 300,
        interval: 60,
        codeType: 1,
        signName: signName || undefined,
        templateCode: templateCode || undefined,
        schemeName: schemeName || undefined,
        templateParam: JSON.stringify({ code: '##code##', min: '5' }),
      });

      const result = await client.sendSmsVerifyCode(sendReq);
      const body = (result.body || {}) as { code?: string; message?: string };

      if (body.code === 'OK') {
        return { success: true, message: '验证码已发送' };
      }

      let userMsg = body.message || '发送失败';
      if (body.code === 'biz.FREQUENCY') {
        userMsg = '发送太频繁，请稍后再试';
      } else if (body.code === 'InternalError') {
        userMsg = '服务暂时不可用，请稍后重试';
      } else if (body.code === 'isv.BUSINESS_LIMIT_CONTROL') {
        userMsg = '今日发送次数已达上限';
      }

      return { success: false, message: userMsg };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'unknown error';
      console.error('[SMS] 发送异常:', message);
      return { success: false, status: 500, message: '短信发送失败，请稍后重试' };
    }
  }

  if (!isTestSmsEnabled()) {
    return { success: false, status: 503, message: '短信服务未配置' };
  }

  const testCode = getTestSmsCode();
  if (!testCode) {
    return { success: false, status: 503, message: '测试验证码未配置' };
  }

  console.log(`[SMS] 测试验证码 -> ${phone}: ${testCode}`);
  return { success: true, message: '验证码已发送（测试环境）' };
}

export async function verifyPhoneCode(
  phone: string,
  code: string,
): Promise<SmsVerificationResult> {
  const aliyunContext = await createAliyunSmsClient();
  if (aliyunContext) {
    try {
      const { Dypnsapi, client } = aliyunContext;
      const checkReq = new Dypnsapi.CheckSmsVerifyCodeRequest({
        phoneNumber: phone,
        countryCode: '86',
        verifyCode: code,
      });

      const result = await client.checkSmsVerifyCode(checkReq);
      const body = (result.body || {}) as {
        code?: string;
        message?: string;
        model?: { verifyResult?: string };
      };

      if (body.code === 'OK' && body.model?.verifyResult === 'PASS') {
        return { success: true };
      }

      let userMsg = '验证码错误';
      if (body.message?.includes('expired')) {
        userMsg = '验证码已过期，请重新获取';
      }

      return { success: false, message: userMsg };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'unknown error';
      console.error('[SMS] 校验异常:', message);
      return { success: false, message: '校验失败，请稍后重试' };
    }
  }

  if (!isTestSmsEnabled()) {
    return { success: false, message: '短信服务未配置' };
  }

  const testCode = getTestSmsCode();
  if (!testCode) {
    return { success: false, message: '短信服务未配置' };
  }

  if (code === testCode) {
    return { success: true };
  }

  return { success: false, message: '验证码错误' };
}
