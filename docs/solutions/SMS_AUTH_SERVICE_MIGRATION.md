# 阿里云短信认证服务接入方案

## 1. 问题描述

### 用户现象
项目后端使用阿里云"短信服务"（dysmsapi）发送验证码，但个人开发者账号无法通过签名审核：

- **签名审核失败**：短信服务要求企业资质才能申请签名，个人账号提示"不支持个人资质的签名实名制报备"
- **始终处于测试模式**：由于签名/模板无法通过审核，服务端一直走测试模式，验证码只打印在控制台
- **环境变量未加载**：`server/index.js` 缺少 `dotenv` 依赖，`.env.local` 配置未被读取

### 业务影响
- 用户无法收到真实短信验证码，无法完成注册/登录
- 开发环境只能使用控制台打印的测试验证码

---

## 2. 根本原因分析

### 问题 1：产品选型错误
阿里云有两个不同的短信产品：

| 对比项 | 短信服务（dysmsapi） | 短信认证服务（dypnsapi） |
|--------|---------------------|------------------------|
| 资质要求 | 必须企业资质 | 支持个人实名认证 |
| 签名/模板 | 需自行申请审核 | 平台提供预置签名和模板 |
| SDK 包名 | `@alicloud/dysmsapi20170525` | `@alicloud/dypnsapi20170525` |
| API 端点 | `dysmsapi.aliyuncs.com` | `dypnsapi.aliyuncs.com` |
| 验证码管理 | 开发者自行生成和校验 | 平台管理全生命周期 |

原代码使用的是"短信服务"，个人账号无法使用。

### 问题 2：dotenv 未配置
`server/index.js` 没有引入 `dotenv`，导致 `.env.local` 中的环境变量未被加载到 `process.env`，所有配置项为空，自动降级为测试模式。

### 问题 3：前端错误提示缺失
- `getVCode` 函数缺少 try-catch，网络错误时静默失败
- 注册页面没有错误提示框，发送失败用户无感知

---

## 3. 解决方案

### 3.1 安装 dotenv 并加载环境变量

```bash
cd server
npm install dotenv
```

`server/index.js` 顶部添加：
```javascript
require('dotenv').config({ path: '.env.local' });
```

### 3.2 迁移到短信认证服务 SDK

卸载旧 SDK，安装新 SDK：
```bash
cd server
npm uninstall @alicloud/dysmsapi20170525
npm install @alicloud/dypnsapi20170525
```

### 3.3 后端核心代码改动

**客户端初始化**（从 dysmsapi 改为 dypnsapi）：
```javascript
const Dypnsapi = require('@alicloud/dypnsapi20170525');
const OpenApi = require('@alicloud/openapi-client');

const config = new OpenApi.Config({
  accessKeyId: CONFIG.accessKeyId,
  accessKeySecret: CONFIG.accessKeySecret,
});
config.endpoint = 'dypnsapi.aliyuncs.com';
pnsClient = new Dypnsapi.default(config);
```

**发送验证码**（SendSmsVerifyCode）：
```javascript
const sendReq = new Dypnsapi.SendSmsVerifyCodeRequest({
  phoneNumber: phone,
  countryCode: '86',
  codeLength: 6,
  validTime: 300,
  interval: 60,
  codeType: 1,
  signName: CONFIG.signName,
  templateCode: CONFIG.templateCode,
  schemeName: CONFIG.schemeName || undefined,
  templateParam: JSON.stringify({ code: '##code##', min: '5' }),
});
const result = await pnsClient.sendSmsVerifyCode(sendReq);
```

关键点：`templateParam` 中 `##code##` 是系统占位符，阿里云会自动替换为真实验证码。

**校验验证码**（CheckSmsVerifyCode）：
```javascript
const checkReq = new Dypnsapi.CheckSmsVerifyCodeRequest({
  phoneNumber: phone,
  countryCode: '86',
  verifyCode: code,
});
const result = await pnsClient.checkSmsVerifyCode(checkReq);
```

验证码的生成、存储、校验全部由阿里云管理，后端不再需要 `codeStore`。

### 3.4 环境变量配置

`server/.env.local`：
```env
ALIYUN_ACCESS_KEY_ID=你的AccessKeyID
ALIYUN_ACCESS_KEY_SECRET=你的AccessKeySecret
SMS_SIGN_NAME=速通互联验证码        # 号码认证服务控制台中的预置签名
SMS_TEMPLATE_CODE=100001            # 号码认证服务控制台中的预置模板CODE
SMS_SCHEME_NAME=                    # 方案名称（可选）
```

签名和模板CODE需要在 [号码认证服务控制台](https://dypns.console.aliyun.com) → 短信认证 → 方案管理 中创建方案后获取。

### 3.5 后端错误码中文映射

将阿里云英文错误码转为用户友好提示：
```javascript
if (body.code === 'biz.FREQUENCY') userMsg = '发送太频繁，请稍后再试';
if (body.code === 'InternalError') userMsg = '服务暂时不可用，请稍后重试';
if (body.code === 'isv.BUSINESS_LIMIT_CONTROL') userMsg = '今日发送次数已达上限，请明天再试';
```

### 3.6 前端错误提示完善

- `getVCode` 添加 try-catch 捕获网络异常
- 注册页面添加错误提示框（与登录页一致的红色提示）

---

## 4. 涉及文件

| 文件 | 改动说明 |
|------|---------|
| `server/index.js` | 迁移到 dypnsapi SDK，添加 dotenv，错误码中文映射 |
| `server/.env.local` | 更新为短信认证服务配置项 |
| `server/package.json` | 替换 SDK 依赖 |
| `src/components/layout/AuthPage.tsx` | getVCode 添加 try-catch，注册页添加错误提示框 |

---

## 5. 阿里云控制台配置步骤

1. 登录 [号码认证服务控制台](https://dypns.console.aliyun.com)
2. 开通"短信认证"功能
3. 进入 短信认证 → 方案管理 → 创建方案
4. 接入端选择 **H5**
5. 选择预置签名和预置模板
6. 创建完成后，将签名名称和模板CODE填入 `server/.env.local`
7. 可在控制台的 API 调试工具中先行测试验证
