import type { SmsSendResult, SmsVerificationResult } from './types.js';

type AliyunModuleNamespace = Record<string, any>;

interface AliyunSmsClientContext {
  Dypnsapi: AliyunModuleNamespace;
  client: any;
}

function getAliyunConfig() {
  const accessKeyId = process.env.ALIYUN_ACCESS_KEY_ID;
  const accessKeySecret = process.env.ALIYUN_ACCESS_KEY_SECRET;
  const signName = process.env.SMS_SIGN_NAME;
  const templateCode = process.env.SMS_TEMPLATE_CODE;
  const schemeName = process.env.SMS_SCHEME_NAME;
  return { accessKeyId, accessKeySecret, signName, templateCode, schemeName };
}

function isProductionEnvironment(): boolean {
  const runtime = process.env.VERCEL_ENV || process.env.NODE_ENV;
  if (!runtime) {
    throw new Error('缺少 VERCEL_ENV 或 NODE_ENV 环境变量');
  }
  return runtime.toLowerCase() === 'production';
}

export function isAliyunSmsEnabled(): boolean {
  const { accessKeyId, accessKeySecret } = getAliyunConfig();
  return Boolean(accessKeyId && accessKeySecret);
}

export function isTestSmsEnabled(): boolean {
  return process.env.ALLOW_TEST_SMS === 'true' && !isProductionEnvironment();
}

async function createAliyunSmsClient(): Promise<AliyunSmsClientContext> {
  const { accessKeyId, accessKeySecret } = getAliyunConfig();
  if (!accessKeyId || !accessKeySecret) {
    throw new Error('阿里云短信未配置：缺少 ALIYUN_ACCESS_KEY_ID 或 ALIYUN_ACCESS_KEY_SECRET');
  }

  const DypnsapiModule = (await import('@alicloud/dypnsapi20170525')) as unknown as AliyunModuleNamespace;
  const OpenApiModule = (await import('@alicloud/openapi-client')) as unknown as AliyunModuleNamespace;
  const DypnsapiClient = DypnsapiModule.default?.default || DypnsapiModule.default;
  const config = new OpenApiModule.Config({ accessKeyId, accessKeySecret });
  config.endpoint = 'dypnsapi.aliyuncs.com';

  return { Dypnsapi: DypnsapiModule, client: new DypnsapiClient(config) };
}

// ── 发送验证码 ──

async function sendViaAliyun(phone: string): Promise<SmsSendResult> {
  const { Dypnsapi, client } = await createAliyunSmsClient();
  const { signName, templateCode, schemeName } = getAliyunConfig();

  const sendReq = new Dypnsapi.SendSmsVerifyCodeRequest({
    phoneNumber: phone,
    countryCode: '86',
    codeLength: 6,
    validTime: 300,
    interval: 60,
    codeType: 1,
    signName,
    templateCode,
    schemeName,
    templateParam: JSON.stringify({ code: '##code##', min: '5' }),
  });

  const result = await client.sendSmsVerifyCode(sendReq);
  const body = result.body as { code?: string; message?: string };

  if (body.code === 'OK') {
    return { success: true, message: '验证码已发送' };
  }

  const errorMap: Record<string, string> = {
    'biz.FREQUENCY': '发送太频繁，请稍后再试',
    'InternalError': '服务暂时不可用，请稍后重试',
    'isv.BUSINESS_LIMIT_CONTROL': '今日发送次数已达上限',
  };

  return { success: false, message: errorMap[body.code!] ?? body.message ?? '发送失败' };
}

function sendViaTestCode(phone: string): SmsSendResult {
  const code = process.env.TEST_SMS_CODE?.trim();
  if (!code) {
    throw new Error('测试模式已开启但缺少 TEST_SMS_CODE');
  }
  console.log(`[SMS] 测试验证码已发送 -> ${phone.slice(0, 3)}****${phone.slice(-4)}`);
  return { success: true, message: '验证码已发送（测试环境）' };
}

export async function sendPhoneCode(phone: string): Promise<SmsSendResult> {
  if (isAliyunSmsEnabled()) {
    return sendViaAliyun(phone);
  }
  if (isTestSmsEnabled()) {
    return sendViaTestCode(phone);
  }
  throw new Error('短信服务未配置：既无阿里云密钥，也未开启测试模式');
}

// ── 校验验证码 ──

async function verifyViaAliyun(phone: string, code: string): Promise<SmsVerificationResult> {
  const { Dypnsapi, client } = await createAliyunSmsClient();

  const checkReq = new Dypnsapi.CheckSmsVerifyCodeRequest({
    phoneNumber: phone,
    countryCode: 'cn',
    verifyCode: code,
  });

  const result = await client.checkSmsVerifyCode(checkReq);
  const body = result.body as {
    code?: string;
    message?: string;
    model?: { verifyResult?: string };
  };

  if (body.code === 'OK' && body.model?.verifyResult === 'PASS') {
    return { success: true };
  }

  const message = body.message?.includes('expired')
    ? '验证码已过期，请重新获取'
    : '验证码错误';

  return { success: false, message };
}

function verifyViaTestCode(code: string): SmsVerificationResult {
  const testCode = process.env.TEST_SMS_CODE?.trim();
  if (!testCode) {
    throw new Error('测试模式已开启但缺少 TEST_SMS_CODE');
  }
  if (code !== testCode) {
    return { success: false, message: '验证码错误' };
  }
  return { success: true };
}

export async function verifyPhoneCode(phone: string, code: string): Promise<SmsVerificationResult> {
  if (isAliyunSmsEnabled()) {
    return verifyViaAliyun(phone, code);
  }
  if (isTestSmsEnabled()) {
    return verifyViaTestCode(code);
  }
  throw new Error('短信服务未配置：既无阿里云密钥，也未开启测试模式');
}
