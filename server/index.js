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

const app = express();
app.use(cors());
app.use(express.json());

const CONFIG = {
  accessKeyId: process.env.ALIYUN_ACCESS_KEY_ID || '',
  accessKeySecret: process.env.ALIYUN_ACCESS_KEY_SECRET || '',
  signName: process.env.SMS_SIGN_NAME || '',
  templateCode: process.env.SMS_TEMPLATE_CODE || '',
  schemeName: process.env.SMS_SCHEME_NAME || '',
  port: process.env.PORT || 3001,
};

// 是否使用阿里云（配置了 AccessKey 就走真实模式）
const useAliyun = !!(CONFIG.accessKeyId && CONFIG.accessKeySecret);

// ---------- 阿里云短信认证客户端（dypnsapi） ----------

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
  console.log('[SMS] 测试模式 - 未配置阿里云 AccessKey，验证码将打印在控制台');
}


// ---------- 测试模式用的内存存储 ----------

const testCodeStore = new Map();

function generateTestCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

// ---------- 接口：发送验证码 ----------

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
        validTime: 300,       // 验证码有效期 5 分钟（秒）
        interval: 60,         // 发送间隔 60 秒
        codeType: 1,          // 1=纯数字
        signName: CONFIG.signName || undefined,
        templateCode: CONFIG.templateCode || undefined,
        schemeName: CONFIG.schemeName || undefined,
        templateParam: JSON.stringify({ code: '##code##', min: '5' }),  // ##code## 由系统自动替换为验证码
      });
      console.log('[SMS] 请求参数:', JSON.stringify({
        signName: CONFIG.signName,
        templateCode: CONFIG.templateCode,
        schemeName: CONFIG.schemeName,
        phoneNumber: phone,
      }));
      const result = await pnsClient.sendSmsVerifyCode(sendReq);
      const body = result.body || {};

      if (body.code === 'OK') {
        console.log('[SMS] 验证码已发送到', phone);
        return res.json({ success: true, message: '验证码已发送' });
      }
      console.log('[SMS] 发送失败:', body.code, body.message);
      // 将阿里云错误码转为用户友好提示
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
  } else {
    // 测试模式
    const code = generateTestCode();
    testCodeStore.set(phone, { code, expires: Date.now() + 5 * 60 * 1000 });
    console.log(`[SMS] 测试验证码 -> ${phone}: ${code}`);
    return res.json({ success: true, message: '验证码已发送' });
  }
});

// ---------- 接口：校验验证码 ----------

app.post('/api/sms/verify', async (req, res) => {
  const { phone, code } = req.body;

  if (!phone || !code) {
    return res.json({ success: false, message: '参数不完整' });
  }

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
        console.log('[SMS] 验证成功', phone);
        return res.json({ success: true });
      }
      console.log('[SMS] 验证失败:', body.code, body.message);
      let userMsg = '验证码错误';
      if (body.message && body.message.includes('expired')) {
        userMsg = '验证码已过期，请重新获取';
      }
      return res.json({ success: false, message: userMsg });
    } catch (err) {
      console.error('[SMS] 校验异常:', err.message);
      return res.json({ success: false, message: '校验失败，请稍后重试' });
    }
  } else {
    // 测试模式
    const stored = testCodeStore.get(phone);
    if (!stored) return res.json({ success: false, message: '请先获取验证码' });
    if (Date.now() > stored.expires) {
      testCodeStore.delete(phone);
      return res.json({ success: false, message: '验证码已过期' });
    }
    if (stored.code !== code) {
      return res.json({ success: false, message: '验证码错误' });
    }
    testCodeStore.delete(phone);
    return res.json({ success: true });
  }
});

// ---------- 健康检查 ----------

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', mode: useAliyun ? 'aliyun-sms-auth' : 'test' });
});

// ---------- 启动 ----------

app.listen(CONFIG.port, () => {
  console.log(`[Server] 运行在 http://localhost:${CONFIG.port}`);
  console.log(`[Server] 模式: ${useAliyun ? '阿里云短信认证服务' : '测试模式（控制台打印验证码）'}`);
});
