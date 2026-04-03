# 阿里云短信认证服务接入方案

> **状态：✅ 已启用** — 后端已使用阿里云号码认证服务（dypnsapi）发送和校验验证码，代码位于 `api/_lib/sms.ts`。

## 1. 问题描述

### 用户现象

- 阿里云"短信服务"（dysmsapi）要求企业资质才能申请签名，个人账号审核不通过
- 服务端一直走测试模式，验证码只打印在控制台，用户无法收到真实短信

### 业务影响

- 用户无法收到真实短信验证码，无法完成注册/登录
- 开发环境只能使用固定测试验证码

## 2. 根本原因分析

### 产品选型错误

阿里云有两个不同的短信产品：

| 对比项 | 短信服务（dysmsapi） | 短信认证服务（dypnsapi） |
|--------|---------------------|------------------------|
| 资质要求 | 必须企业资质 | 支持个人实名认证 |
| 签名/模板 | 需自行申请审核 | 平台提供预置签名和模板 |
| SDK 包名 | `@alicloud/dysmsapi20170525` | `@alicloud/dypnsapi20170525` |
| API 端点 | `dysmsapi.aliyuncs.com` | `dypnsapi.aliyuncs.com` |
| 验证码管理 | 开发者自行生成和校验 | 平台管理全生命周期 |

原代码使用的是"短信服务"，个人账号无法使用。

## 3. 解决方案

### 3.1 SDK 替换

```bash
npm uninstall @alicloud/dysmsapi20170525
npm install @alicloud/dypnsapi20170525
```

当前 `package.json` 中的依赖：
```json
"@alicloud/dypnsapi20170525": "^2.0.0",
"@alicloud/openapi-client": "^0.4.12"
```

### 3.2 后端实现（`api/_lib/sms.ts`）

代码采用双路径架构：优先走阿里云，无密钥时降级到测试模式，两者都不满足直接 throw。

**客户端初始化**：

```typescript
async function createAliyunSmsClient(): Promise<AliyunSmsClientContext> {
  const { accessKeyId, accessKeySecret } = getAliyunConfig();
  if (!accessKeyId || !accessKeySecret) {
    throw new Error('阿里云短信未配置：缺少 ALIYUN_ACCESS_KEY_ID 或 ALIYUN_ACCESS_KEY_SECRET');
  }

  const DypnsapiModule = await import('@alicloud/dypnsapi20170525');
  const OpenApiModule = await import('@alicloud/openapi-client');
  const config = new OpenApiModule.Config({ accessKeyId, accessKeySecret });
  config.endpoint = 'dypnsapi.aliyuncs.com';

  return { Dypnsapi: DypnsapiModule, client: new DypnsapiClient(config) };
}
```

**发送验证码**（`SendSmsVerifyCode`）：

```typescript
const sendReq = new Dypnsapi.SendSmsVerifyCodeRequest({
  phoneNumber: phone,
  countryCode: '86',
  codeLength: 6,
  validTime: 300,    // 5 分钟有效
  interval: 60,      // 60 秒发送间隔
  codeType: 1,
  signName,
  templateCode,
  schemeName,
  templateParam: JSON.stringify({ code: '##code##', min: '5' }),
});
```

`##code##` 是系统占位符，阿里云会自动替换为真实验证码。

**校验验证码**（`CheckSmsVerifyCode`）：

```typescript
const checkReq = new Dypnsapi.CheckSmsVerifyCodeRequest({
  phoneNumber: phone,
  countryCode: '86',
  verifyCode: code,
});
```

验证码的生成、存储、校验全部由阿里云管理，后端不需要自建 `codeStore`。

**路由逻辑**：

```typescript
export async function sendPhoneCode(phone: string): Promise<SmsSendResult> {
  if (isAliyunSmsEnabled()) return sendViaAliyun(phone);
  if (isTestSmsEnabled())   return sendViaTestCode(phone);
  throw new Error('短信服务未配置：既无阿里云密钥，也未开启测试模式');
}

export async function verifyPhoneCode(phone: string, code: string): Promise<SmsVerificationResult> {
  if (isAliyunSmsEnabled()) return verifyViaAliyun(phone, code);
  if (isTestSmsEnabled())   return verifyViaTestCode(code);
  throw new Error('短信服务未配置：既无阿里云密钥，也未开启测试模式');
}
```

### 3.3 测试模式

测试模式需同时满足两个条件：
- `ALLOW_TEST_SMS=true`
- `VERCEL_ENV` 或 `NODE_ENV` 不为 `production`

测试模式下使用 `TEST_SMS_CODE` 环境变量作为固定验证码，日志脱敏输出：

```typescript
console.log(`[SMS] 测试验证码已发送 -> ${phone.slice(0, 3)}****${phone.slice(-4)}`);
```

### 3.4 错误码中文映射

```typescript
const errorMap: Record<string, string> = {
  'biz.FREQUENCY': '发送太频繁，请稍后再试',
  'InternalError': '服务暂时不可用，请稍后重试',
  'isv.BUSINESS_LIMIT_CONTROL': '今日发送次数已达上限',
};
```

### 3.5 环境变量

```env
ALIYUN_ACCESS_KEY_ID=你的AccessKeyID
ALIYUN_ACCESS_KEY_SECRET=你的AccessKeySecret
SMS_SIGN_NAME=              # 号码认证服务控制台中的预置签名
SMS_TEMPLATE_CODE=          # 号码认证服务控制台中的预置模板CODE
SMS_SCHEME_NAME=            # 方案名称（可选）

# 仅开发/预览环境
ALLOW_TEST_SMS=true
TEST_SMS_CODE=123456
```

### 3.6 阿里云控制台配置步骤

1. 登录 [号码认证服务控制台](https://dypns.console.aliyun.com)
2. 开通"短信认证"功能
3. 进入 短信认证 → 方案管理 → 创建方案
4. 接入端选择 H5
5. 选择预置签名和预置模板
6. 创建完成后，将签名名称和模板 CODE 填入环境变量

## 4. 涉及文件

| 文件 | 说明 |
|------|------|
| `api/_lib/sms.ts` | 短信发送/校验核心逻辑（dypnsapi） |
| `api/sms/send.ts` | 发送验证码端点（含三级限流） |
| `api/auth/login.ts` | 登录端点（调用 `verifyPhoneCode`） |
| `api/auth/register.ts` | 注册端点（调用 `verifyPhoneCode`） |
| `package.json` | `@alicloud/dypnsapi20170525` 依赖 |

---

**修复日期**：2026-02-10
**修复人员**：Andy, Claude Sonnet 4.5
**问题严重程度**：高（核心功能）
**修复状态**：✅ 已完成并验证
