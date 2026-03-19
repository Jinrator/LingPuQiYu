/**
 * 生音科技 - 后端服务
 *
 * 启动方式：
 *   cd server
 *   npm install
 *   node index.js
 */

require('dotenv').config({ path: '.env.local' });

const express = require('express');
const cors = require('cors');
const { createHmac, randomUUID, timingSafeEqual } = require('crypto');

const app = express();
app.use(cors());
app.use(express.json());

const APP_USERS_TABLE = 'app_users';
const TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000;

const CONFIG = {
  accessKeyId: process.env.ALIYUN_ACCESS_KEY_ID || '',
  accessKeySecret: process.env.ALIYUN_ACCESS_KEY_SECRET || '',
  signName: process.env.SMS_SIGN_NAME || '',
  templateCode: process.env.SMS_TEMPLATE_CODE || '',
  schemeName: process.env.SMS_SCHEME_NAME || '',
  supabaseUrl: process.env.SUPABASE_URL || '',
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  authTokenSecret: process.env.AUTH_TOKEN_SECRET || '',
  allowTestSms: process.env.ALLOW_TEST_SMS === 'true',
  port: process.env.PORT || 3001,
};

const useAliyun = !!(CONFIG.accessKeyId && CONFIG.accessKeySecret);

let pnsClient = null;
if (useAliyun) {
  try {
    const Dypnsapi = require('@alicloud/dypnsapi20170525');
    const OpenApi = require('@alicloud/openapi-client');

    const config = new OpenApi.Config({
      accessKeyId: CONFIG.accessKeyId,
      accessKeySecret: CONFIG.accessKeySecret,
    });
    config.endpoint = 'dypnsapi.aliyuncs.com';
    pnsClient = new Dypnsapi.default(config);
    console.log('[SMS] 阿里云短信认证客户端初始化成功');
  } catch (err) {
    console.error('[SMS] 阿里云 SDK 初始化失败:', err.message);
  }
}

if (!useAliyun) {
  console.log(`[SMS] ${CONFIG.allowTestSms ? '测试模式已开启' : '短信服务未配置，测试模式未开启'}`);
}

let supabase = null;
if (CONFIG.supabaseUrl && CONFIG.supabaseServiceRoleKey) {
  try {
    const { createClient } = require('@supabase/supabase-js');
    supabase = createClient(CONFIG.supabaseUrl, CONFIG.supabaseServiceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
    console.log('[Supabase] 管理客户端初始化成功');
  } catch (err) {
    console.error('[Supabase] 初始化失败:', err.message);
  }
}

if (!supabase) {
  console.log('[Supabase] 未配置服务端数据库连接，登录接口将返回配置错误');
}

const testCodeStore = new Map();

function generateTestCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function ensureSupabaseReady() {
  if (!supabase) {
    throw new Error('Supabase 未配置，请在服务端提供 SUPABASE_URL 和 SUPABASE_SERVICE_ROLE_KEY');
  }
  if (!CONFIG.authTokenSecret) {
    throw new Error('缺少 AUTH_TOKEN_SECRET');
  }
}

function generateUserId() {
  return `user_${randomUUID().replace(/-/g, '')}`;
}

function encodeBase64Url(value) {
  return Buffer.from(value).toString('base64url');
}

function decodeBase64Url(value) {
  return Buffer.from(value, 'base64url').toString('utf8');
}

function signAuthToken(payload) {
  const header = encodeBase64Url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body = encodeBase64Url(JSON.stringify(payload));
  const signature = createHmac('sha256', CONFIG.authTokenSecret)
    .update(`${header}.${body}`)
    .digest('base64url');

  return `${header}.${body}.${signature}`;
}

function verifyAuthToken(token) {
  const [header, body, signature] = (token || '').split('.');
  if (!header || !body || !signature) return null;

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
    const payload = JSON.parse(decodeBase64Url(body));
    if (payload.exp && Date.now() > payload.exp) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}

function buildSessionToken(user) {
  const now = Date.now();
  return signAuthToken({
    uid: user.id,
    phone: user.phone,
    iat: now,
    exp: now + TOKEN_TTL_MS,
  });
}

function mapUserRow(row) {
  return {
    id: row.id,
    phone: row.phone,
    username: row.username || undefined,
    avatar: row.avatar_url || undefined,
    courseType: row.course_type || undefined,
    loginMethod: row.login_method || 'phone',
    createdAt: row.created_at ? new Date(row.created_at).getTime() : Date.now(),
  };
}

async function findUserRowByPhone(phone) {
  ensureSupabaseReady();
  const { data, error } = await supabase
    .from(APP_USERS_TABLE)
    .select('*')
    .eq('phone', phone)
    .maybeSingle();

  if (error) throw error;
  return data || null;
}

async function findUserByPhone(phone) {
  const row = await findUserRowByPhone(phone);
  return row ? mapUserRow(row) : null;
}

async function findUserById(id) {
  ensureSupabaseReady();
  const { data, error } = await supabase
    .from(APP_USERS_TABLE)
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) throw error;
  return data ? mapUserRow(data) : null;
}

async function createUserProfile({ phone, username, courseType }) {
  ensureSupabaseReady();
  const now = new Date().toISOString();
  const payload = {
    id: generateUserId(),
    phone,
    username: username || null,
    avatar_url: null,
    course_type: courseType || null,
    login_method: 'phone',
    created_at: now,
    updated_at: now,
  };

  const { data, error } = await supabase
    .from(APP_USERS_TABLE)
    .insert(payload)
    .select()
    .single();

  if (error) throw error;
  return mapUserRow(data);
}

async function updateUserProfile(existingRow, { username, courseType }) {
  ensureSupabaseReady();
  const updates = {
    updated_at: new Date().toISOString(),
  };

  if (username !== undefined) updates.username = username || null;
  if (courseType !== undefined) updates.course_type = courseType || null;

  const { data, error } = await supabase
    .from(APP_USERS_TABLE)
    .update(updates)
    .eq('id', existingRow.id)
    .select()
    .single();

  if (error) throw error;
  return mapUserRow(data);
}

async function verifyPhoneCode(phone, code) {
  if (useAliyun && pnsClient) {
    try {
      const Dypnsapi = require('@alicloud/dypnsapi20170525');
      const checkReq = new Dypnsapi.CheckSmsVerifyCodeRequest({
        phoneNumber: phone,
        countryCode: '86',
        verifyCode: code,
      });
      const result = await pnsClient.checkSmsVerifyCode(checkReq);
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

  if (!CONFIG.allowTestSms) {
    return { success: false, message: '短信服务未配置' };
  }

  const stored = testCodeStore.get(phone);
  if (!stored) return { success: false, message: '请先获取验证码' };
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

function getBearerToken(req) {
  const header = req.headers.authorization || '';
  if (!header.startsWith('Bearer ')) return null;
  return header.slice('Bearer '.length).trim();
}

app.post('/api/sms/send', async (req, res) => {
  const { phone } = req.body;

  if (!phone || !/^1\d{10}$/.test(phone)) {
    return res.json({ success: false, message: '手机号格式不正确' });
  }

  if (useAliyun && pnsClient) {
    try {
      const Dypnsapi = require('@alicloud/dypnsapi20170525');
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

      const result = await pnsClient.sendSmsVerifyCode(sendReq);
      const body = result.body || {};

      if (body.code === 'OK') {
        return res.json({ success: true, message: '验证码已发送' });
      }

      let userMsg = body.message || '发送失败';
      if (body.code === 'biz.FREQUENCY' || (body.message && body.message.includes('frequency'))) {
        userMsg = '发送太频繁，请稍后再试';
      } else if (body.code === 'InternalError') {
        userMsg = '服务暂时不可用，请稍后重试';
      } else if (body.code === 'isv.BUSINESS_LIMIT_CONTROL') {
        userMsg = '今日发送次数已达上限，请明天再试';
      }

      return res.json({ success: false, message: userMsg });
    } catch (err) {
      console.error('[SMS] 发送异常:', err.message);
      return res.json({ success: false, message: '短信发送失败，请稍后重试' });
    }
  }

  if (!CONFIG.allowTestSms) {
    return res.status(503).json({ success: false, message: '短信服务未配置' });
  }

  const code = generateTestCode();
  testCodeStore.set(phone, { code, expires: Date.now() + 5 * 60 * 1000 });
  console.log(`[SMS] 测试验证码 -> ${phone}: ${code}`);
  return res.json({ success: true, message: '验证码已发送（测试环境）' });
});

app.post('/api/sms/verify', async (req, res) => {
  const { phone, code } = req.body;

  if (!phone || !code) {
    return res.json({ success: false, message: '参数不完整' });
  }

  const result = await verifyPhoneCode(phone, code);
  return res.json(result);
});

app.post('/api/auth/login', async (req, res) => {
  const { phone, code } = req.body || {};

  if (!phone || !code) {
    return res.status(400).json({ success: false, message: '参数不完整' });
  }

  try {
    ensureSupabaseReady();
    const verification = await verifyPhoneCode(phone, code);
    if (!verification.success) {
      return res.status(400).json(verification);
    }

    const user = await findUserByPhone(phone);
    if (!user) {
      return res.status(404).json({
        success: false,
        code: 'USER_NOT_FOUND',
        message: '该手机号尚未注册，请先注册',
      });
    }

    const token = buildSessionToken(user);
    return res.json({ success: true, user, token });
  } catch (err) {
    console.error('[Auth] 登录失败:', err.message);
    return res.status(500).json({ success: false, message: err.message || '登录失败，请稍后重试' });
  }
});

app.post('/api/auth/register', async (req, res) => {
  const { phone, code, username, courseType } = req.body || {};

  if (!phone || !code) {
    return res.status(400).json({ success: false, message: '参数不完整' });
  }

  try {
    ensureSupabaseReady();
    const verification = await verifyPhoneCode(phone, code);
    if (!verification.success) {
      return res.status(400).json(verification);
    }

    const existingRow = await findUserRowByPhone(phone);
    const user = existingRow
      ? await updateUserProfile(existingRow, { username, courseType })
      : await createUserProfile({ phone, username, courseType });

    const token = buildSessionToken(user);
    return res.json({ success: true, user, token });
  } catch (err) {
    console.error('[Auth] 注册失败:', err.message);
    return res.status(500).json({ success: false, message: err.message || '注册失败，请稍后重试' });
  }
});

app.get('/api/auth/me', async (req, res) => {
  try {
    ensureSupabaseReady();
    const token = getBearerToken(req);
    if (!token) {
      return res.status(401).json({ success: false, message: '缺少登录凭证' });
    }

    const payload = verifyAuthToken(token);
    if (!payload?.uid || !payload?.phone) {
      return res.status(401).json({ success: false, message: '登录状态已失效' });
    }

    const user = await findUserById(payload.uid);
    if (!user || user.phone !== payload.phone) {
      return res.status(401).json({ success: false, message: '用户不存在或已失效' });
    }

    return res.json({ success: true, user });
  } catch (err) {
    console.error('[Auth] 获取当前用户失败:', err.message);
    return res.status(500).json({ success: false, message: err.message || '获取用户失败' });
  }
});

app.get('/api/health', (req, res) => {
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
