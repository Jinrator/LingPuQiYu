/**
 * 生音科技 - 后端服务
 *
 * 启动方式：
 *   cd server
 *   npm install
 *   npm run dev
 */

import { createHmac, randomUUID, timingSafeEqual } from 'node:crypto';
import cors from 'cors';
import dotenv from 'dotenv';
import express, { type Request, type Response } from 'express';
import { createClient } from '@supabase/supabase-js';

type LoginMethod = 'phone' | 'wechat' | 'qq';

interface AuthUser {
  id: string;
  phone: string;
  username?: string;
  avatar?: string;
  courseType?: string;
  loginMethod: LoginMethod;
  createdAt: number;
}

interface AppUserRow {
  id: string;
  phone: string;
  username: string | null;
  avatar_url: string | null;
  course_type: string | null;
  login_method: string;
  created_at: string;
  updated_at: string;
}

interface AuthTokenPayload {
  uid: string;
  phone: string;
  iat: number;
  exp: number;
}

interface SmsResult {
  success: boolean;
  message?: string;
}

interface TestCodeRecord {
  code: string;
  expires: number;
}

interface ServerConfig {
  accessKeyId: string;
  accessKeySecret: string;
  signName: string;
  templateCode: string;
  schemeName: string;
  supabaseUrl: string;
  supabaseServiceRoleKey: string;
  authTokenSecret: string;
  allowTestSms: boolean;
  port: number;
}

type AliyunModuleNamespace = Record<string, any>;

interface AliyunSmsClientContext {
  Dypnsapi: AliyunModuleNamespace;
  client: any;
}

dotenv.config({ path: '.env.local' });

const app = express();
app.use(cors());
app.use(express.json());

const APP_USERS_TABLE = 'app_users';
const TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000;

const CONFIG: ServerConfig = {
  accessKeyId: process.env.ALIYUN_ACCESS_KEY_ID || '',
  accessKeySecret: process.env.ALIYUN_ACCESS_KEY_SECRET || '',
  signName: process.env.SMS_SIGN_NAME || '',
  templateCode: process.env.SMS_TEMPLATE_CODE || '',
  schemeName: process.env.SMS_SCHEME_NAME || '',
  supabaseUrl: process.env.SUPABASE_URL || '',
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  authTokenSecret: process.env.AUTH_TOKEN_SECRET || '',
  allowTestSms: process.env.ALLOW_TEST_SMS === 'true',
  port: Number(process.env.PORT || 3001),
};

const useAliyun = Boolean(CONFIG.accessKeyId && CONFIG.accessKeySecret);

if (!useAliyun) {
  console.log(`[SMS] ${CONFIG.allowTestSms ? '测试模式已开启' : '短信服务未配置，测试模式未开启'}`);
}

const supabase =
  CONFIG.supabaseUrl && CONFIG.supabaseServiceRoleKey
    ? createClient(CONFIG.supabaseUrl, CONFIG.supabaseServiceRoleKey, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      })
    : null;

if (supabase) {
  console.log('[Supabase] 管理客户端初始化成功');
} else {
  console.log('[Supabase] 未配置服务端数据库连接，登录接口将返回配置错误');
}

const testCodeStore = new Map<string, TestCodeRecord>();

function getSupabaseAdmin(): any {
  if (!supabase) {
    throw new Error('Supabase 未配置，请在服务端提供 SUPABASE_URL 和 SUPABASE_SERVICE_ROLE_KEY');
  }
  return supabase;
}

function ensureAuthTokenSecret(): void {
  if (!CONFIG.authTokenSecret) {
    throw new Error('缺少 AUTH_TOKEN_SECRET');
  }
}

function normalizeLoginMethod(value: string | null | undefined): LoginMethod {
  if (value === 'wechat' || value === 'qq' || value === 'phone') {
    return value;
  }
  return 'phone';
}

function generateUserId(): string {
  return `user_${randomUUID().replace(/-/g, '')}`;
}

function generateTestCode(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function encodeBase64Url(value: string): string {
  return Buffer.from(value).toString('base64url');
}

function decodeBase64Url(value: string): string {
  return Buffer.from(value, 'base64url').toString('utf8');
}

function signAuthToken(payload: AuthTokenPayload): string {
  ensureAuthTokenSecret();
  const header = encodeBase64Url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body = encodeBase64Url(JSON.stringify(payload));
  const signature = createHmac('sha256', CONFIG.authTokenSecret)
    .update(`${header}.${body}`)
    .digest('base64url');

  return `${header}.${body}.${signature}`;
}

function verifyAuthToken(token: string | null | undefined): AuthTokenPayload | null {
  const [header, body, signature] = (token || '').split('.');
  if (!header || !body || !signature) {
    return null;
  }

  const expected = createHmac('sha256', CONFIG.authTokenSecret)
    .update(`${header}.${body}`)
    .digest('base64url');

  if (
    expected.length !== signature.length ||
    !timingSafeEqual(Buffer.from(expected), Buffer.from(signature))
  ) {
    return null;
  }

  try {
    const payload = JSON.parse(decodeBase64Url(body)) as Partial<AuthTokenPayload>;
    if (
      typeof payload.uid !== 'string' ||
      typeof payload.phone !== 'string' ||
      typeof payload.iat !== 'number' ||
      typeof payload.exp !== 'number'
    ) {
      return null;
    }
    if (Date.now() > payload.exp) {
      return null;
    }
    return payload as AuthTokenPayload;
  } catch {
    return null;
  }
}

function buildSessionToken(user: Pick<AuthUser, 'id' | 'phone'>): string {
  const now = Date.now();
  return signAuthToken({
    uid: user.id,
    phone: user.phone,
    iat: now,
    exp: now + TOKEN_TTL_MS,
  });
}

function mapUserRow(row: AppUserRow): AuthUser {
  return {
    id: row.id,
    phone: row.phone,
    username: row.username || undefined,
    avatar: row.avatar_url || undefined,
    courseType: row.course_type || undefined,
    loginMethod: normalizeLoginMethod(row.login_method),
    createdAt: row.created_at ? new Date(row.created_at).getTime() : Date.now(),
  };
}

function getBearerToken(req: Request): string | null {
  const header = req.headers.authorization || '';
  if (!header.startsWith('Bearer ')) {
    return null;
  }
  return header.slice('Bearer '.length).trim();
}

function readStringField(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

async function createAliyunSmsClient(): Promise<AliyunSmsClientContext | null> {
  if (!useAliyun) {
    return null;
  }

  const DypnsapiModule = (await import('@alicloud/dypnsapi20170525')) as unknown as AliyunModuleNamespace;
  const OpenApiModule = (await import('@alicloud/openapi-client')) as unknown as AliyunModuleNamespace;
  const DypnsapiClient = DypnsapiModule.default?.default || DypnsapiModule.default;
  const config = new OpenApiModule.Config({
    accessKeyId: CONFIG.accessKeyId,
    accessKeySecret: CONFIG.accessKeySecret,
  });
  config.endpoint = 'dypnsapi.aliyuncs.com';

  return {
    Dypnsapi: DypnsapiModule,
    client: new DypnsapiClient(config),
  };
}

async function findUserRowByPhone(phone: string): Promise<AppUserRow | null> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from(APP_USERS_TABLE)
    .select('*')
    .eq('phone', phone)
    .maybeSingle();

  if (error) {
    throw error;
  }
  return (data as AppUserRow | null) || null;
}

async function findUserByPhone(phone: string): Promise<AuthUser | null> {
  const row = await findUserRowByPhone(phone);
  return row ? mapUserRow(row) : null;
}

async function findUserById(id: string): Promise<AuthUser | null> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from(APP_USERS_TABLE)
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) {
    throw error;
  }
  return data ? mapUserRow(data as AppUserRow) : null;
}

async function createUserProfile(input: {
  phone: string;
  username?: string;
  courseType?: string;
}): Promise<AuthUser> {
  const supabase = getSupabaseAdmin();
  const now = new Date().toISOString();
  const payload = {
    id: generateUserId(),
    phone: input.phone,
    username: input.username || null,
    avatar_url: null,
    course_type: input.courseType || null,
    login_method: 'phone',
    created_at: now,
    updated_at: now,
  } satisfies AppUserRow;

  const { data, error } = await supabase
    .from(APP_USERS_TABLE)
    .insert(payload)
    .select()
    .single();

  if (error) {
    throw error;
  }
  return mapUserRow(data as AppUserRow);
}

async function updateUserProfile(
  existingRow: Pick<AppUserRow, 'id'>,
  input: { username?: string; courseType?: string },
): Promise<AuthUser> {
  const supabase = getSupabaseAdmin();
  const updates: Partial<Pick<AppUserRow, 'username' | 'course_type' | 'updated_at'>> = {
    updated_at: new Date().toISOString(),
  };

  if (input.username !== undefined) {
    updates.username = input.username || null;
  }
  if (input.courseType !== undefined) {
    updates.course_type = input.courseType || null;
  }

  const { data, error } = await supabase
    .from(APP_USERS_TABLE)
    .update(updates)
    .eq('id', existingRow.id)
    .select()
    .single();

  if (error) {
    throw error;
  }
  return mapUserRow(data as AppUserRow);
}

async function verifyPhoneCode(phone: string, code: string): Promise<SmsResult> {
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

  if (!CONFIG.allowTestSms) {
    return { success: false, message: '短信服务未配置' };
  }

  const stored = testCodeStore.get(phone);
  if (!stored) {
    return { success: false, message: '请先获取验证码' };
  }
  if (Date.now() > stored.expires) {
    testCodeStore.delete(phone);
    return { success: false, message: '验证码已过期' };
  }
  if (stored.code !== code) {
    return { success: false, message: '验证码错误' };
  }

  testCodeStore.delete(phone);
  return { success: true };
}

app.post('/api/sms/send', async (req: Request, res: Response) => {
  const phone = readStringField((req.body ?? {})['phone']);

  if (!phone || !/^1\d{10}$/.test(phone)) {
    res.json({ success: false, message: '手机号格式不正确' });
    return;
  }

  const aliyunContext = await createAliyunSmsClient();
  if (aliyunContext) {
    try {
      const { Dypnsapi, client } = aliyunContext;
      const sendReq = new Dypnsapi.SendSmsVerifyCodeRequest({
        phoneNumber: phone,
        countryCode: '86',
        codeLength: 6,
        validTime: 300,
        interval: 60,
        codeType: 1,
        signName: CONFIG.signName || undefined,
        templateCode: CONFIG.templateCode || undefined,
        schemeName: CONFIG.schemeName || undefined,
        templateParam: JSON.stringify({ code: '##code##', min: '5' }),
      });

      const result = await client.sendSmsVerifyCode(sendReq);
      const body = (result.body || {}) as { code?: string; message?: string };

      if (body.code === 'OK') {
        res.json({ success: true, message: '验证码已发送' });
        return;
      }

      let userMsg = body.message || '发送失败';
      if (body.code === 'biz.FREQUENCY' || body.message?.includes('frequency')) {
        userMsg = '发送太频繁，请稍后再试';
      } else if (body.code === 'InternalError') {
        userMsg = '服务暂时不可用，请稍后重试';
      } else if (body.code === 'isv.BUSINESS_LIMIT_CONTROL') {
        userMsg = '今日发送次数已达上限，请明天再试';
      }

      res.json({ success: false, message: userMsg });
      return;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'unknown error';
      console.error('[SMS] 发送异常:', message);
      res.json({ success: false, message: '短信发送失败，请稍后重试' });
      return;
    }
  }

  if (!CONFIG.allowTestSms) {
    res.status(503).json({ success: false, message: '短信服务未配置' });
    return;
  }

  const code = generateTestCode();
  testCodeStore.set(phone, { code, expires: Date.now() + 5 * 60 * 1000 });
  console.log(`[SMS] 测试验证码 -> ${phone}: ${code}`);
  res.json({ success: true, message: '验证码已发送（测试环境）' });
});

app.post('/api/sms/verify', async (req: Request, res: Response) => {
  const phone = readStringField((req.body ?? {})['phone']);
  const code = readStringField((req.body ?? {})['code']);

  if (!phone || !code) {
    res.json({ success: false, message: '参数不完整' });
    return;
  }

  const result = await verifyPhoneCode(phone, code);
  res.json(result);
});

app.post('/api/auth/login', async (req: Request, res: Response) => {
  const phone = readStringField((req.body ?? {})['phone']);
  const code = readStringField((req.body ?? {})['code']);

  if (!phone || !code) {
    res.status(400).json({ success: false, message: '参数不完整' });
    return;
  }

  try {
    const verification = await verifyPhoneCode(phone, code);
    if (!verification.success) {
      res.status(400).json(verification);
      return;
    }

    const user = await findUserByPhone(phone);
    if (!user) {
      res.status(404).json({
        success: false,
        code: 'USER_NOT_FOUND',
        message: '该手机号尚未注册，请先注册',
      });
      return;
    }

    const token = buildSessionToken(user);
    res.json({ success: true, user, token });
  } catch (error) {
    const message = error instanceof Error ? error.message : '登录失败，请稍后重试';
    console.error('[Auth] 登录失败:', message);
    res.status(500).json({ success: false, message });
  }
});

app.post('/api/auth/check-phone', async (req: Request, res: Response) => {
  const phone = readStringField((req.body ?? {})['phone']);

  if (!phone) {
    res.status(400).json({ success: false, message: '参数不完整' });
    return;
  }

  try {
    const user = await findUserByPhone(phone);
    res.json({ success: true, exists: Boolean(user) });
  } catch (error) {
    const message = error instanceof Error ? error.message : '检查手机号失败';
    console.error('[Auth] 检查手机号失败:', message);
    res.status(500).json({ success: false, message });
  }
});

app.post('/api/auth/register', async (req: Request, res: Response) => {
  const phone = readStringField((req.body ?? {})['phone']);
  const code = readStringField((req.body ?? {})['code']);
  const username = readStringField((req.body ?? {})['username']) || undefined;
  const courseType = readStringField((req.body ?? {})['courseType']) || undefined;

  if (!phone || !code) {
    res.status(400).json({ success: false, message: '参数不完整' });
    return;
  }

  try {
    const verification = await verifyPhoneCode(phone, code);
    if (!verification.success) {
      res.status(400).json(verification);
      return;
    }

    const existingRow = await findUserRowByPhone(phone);
    const user = existingRow
      ? await updateUserProfile(existingRow, { username, courseType })
      : await createUserProfile({ phone, username, courseType });

    const token = buildSessionToken(user);
    res.json({ success: true, user, token });
  } catch (error) {
    const message = error instanceof Error ? error.message : '注册失败，请稍后重试';
    console.error('[Auth] 注册失败:', message);
    res.status(500).json({ success: false, message });
  }
});

app.get('/api/auth/me', async (req: Request, res: Response) => {
  try {
    const token = getBearerToken(req);
    if (!token) {
      res.status(401).json({ success: false, message: '缺少登录凭证' });
      return;
    }

    const payload = verifyAuthToken(token);
    if (!payload?.uid || !payload?.phone) {
      res.status(401).json({ success: false, message: '登录状态已失效' });
      return;
    }

    const user = await findUserById(payload.uid);
    if (!user || user.phone !== payload.phone) {
      res.status(401).json({ success: false, message: '用户不存在或已失效' });
      return;
    }

    res.json({ success: true, user });
  } catch (error) {
    const message = error instanceof Error ? error.message : '获取用户失败';
    console.error('[Auth] 获取当前用户失败:', message);
    res.status(500).json({ success: false, message });
  }
});

app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    mode: useAliyun ? 'aliyun-sms-auth' : 'test',
    smsTestMode: CONFIG.allowTestSms,
    database: supabase ? 'supabase-ready' : 'supabase-missing',
  });
});

app.listen(CONFIG.port, () => {
  console.log(`[Server] 运行在 http://localhost:${CONFIG.port}`);
  console.log(`[Server] 模式: ${useAliyun ? '阿里云短信认证服务' : '测试模式（控制台打印验证码）'}`);
});
