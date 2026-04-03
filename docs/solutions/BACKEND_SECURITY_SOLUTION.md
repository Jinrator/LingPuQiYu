# 后端安全防护方案

> **状态：✅ 已启用** — 所有安全措施均已在生产代码中实施。

## 1. 问题描述

项目后端（Vercel Serverless Functions）需要全面的安全防护体系。本文档记录所有已实施的安全措施，涵盖认证鉴权、输入校验、速率限制、CORS 策略、双 Token 机制等。

## 2. 基础安全防护

### 2.1 HMAC-SHA256 签名 + timingSafeEqual 防时序攻击

JWT 签名使用 `node:crypto` 的 `createHmac('sha256', secret)` 生成，验签时使用 `timingSafeEqual` 做恒定时间比较，防止攻击者通过响应时间差异逐字节猜测签名。

```typescript
// api/_lib/auth.ts
if (
  expected.length !== signature.length ||
  !timingSafeEqual(Buffer.from(expected), Buffer.from(signature))
) {
  return null;
}
```

### 2.2 JWT Payload 严格类型校验

验证 token 时逐字段校验 payload 类型，防止篡改后的 payload 绕过业务逻辑：

```typescript
// api/_lib/auth.ts
if (
  typeof payload.uid !== 'string' ||
  typeof payload.phone !== 'string' ||
  typeof payload.iat !== 'number' ||
  typeof payload.exp !== 'number'
) {
  return null;
}
```

### 2.3 手机号格式校验

所有涉及手机号的端点（login、register、sms/send）统一使用正则 `/^1\d{10}$/` 校验格式，拒绝非法输入进入业务逻辑。

### 2.4 多维度速率限制

对关键端点做 IP + 业务标识的双维度限流：

| 端点 | 维度 | 限制 |
|------|------|------|
| `sms/send` | 每 IP | 5 次/10 分钟 |
| `sms/send` | 每手机号/分钟 | 1 次/分钟 |
| `sms/send` | 每手机号/天 | 10 次/天 |
| `auth/login` | 每 IP | 10 次/10 分钟 |
| `auth/login` | 每手机号 | 6 次/10 分钟 |
| `auth/register` | 每 IP | 8 次/10 分钟 |
| `auth/register` | 每手机号 | 5 次/10 分钟 |
| `ai/chat` | 每用户 | 20 次/分钟 |
| `ai/chat` | 每 IP | 40 次/分钟 |
| `profile/update` | 每用户 | 10 次/分钟 |
| `profile/update` | 每 IP | 30 次/分钟 |
| `auth/refresh` | 每 IP | 30 次/分钟 |

超限后触发 `blockMs` 封禁期，返回 429 状态码。

### 2.5 滑动窗口限流算法

`api/_lib/rate-limit.ts` 使用滑动窗口（而非固定窗口），每次请求记录时间戳，过期的自动清除。`assertRateLimit` 的 `identifier` 为空时直接 throw，防止 `getClientIp` 返回空字符串时绕过限制。

### 2.6 请求体类型安全解析

所有端点的 `readBody` 函数对每个字段做 `typeof` 检查后再 `.trim()`，不信任 `req.body` 的类型：

```typescript
phone: typeof body.phone === 'string' ? body.phone.trim() : '',
code: typeof body.code === 'string' ? body.code.trim() : '',
```

### 2.7 HTTP 方法白名单

每个端点开头都检查 `req.method`，非预期方法返回 405。

### 2.8 Bearer Token 提取

`readBearerToken` 严格检查 `Authorization` 头的 `Bearer ` 前缀，不接受其他格式。

### 2.9 鉴权中间件二次校验

`requireAuth` 不仅验签 token，还查数据库确认用户存在且 `phone` 一致，防止用户被删除后旧 token 仍可用。

### 2.10 Supabase Service Role Key 服务端隔离

前端不直接访问 Supabase，所有数据库操作通过后端 API 中转，`SUPABASE_SERVICE_ROLE_KEY` 仅存在于服务端环境变量。

### 2.11 测试短信环境隔离

`isTestSmsEnabled()` 要求 `ALLOW_TEST_SMS=true` 且 `VERCEL_ENV/NODE_ENV` 不为 `production`，双重条件防止测试验证码在生产环境生效。

### 2.12 错误信息不泄露内部细节

所有端点的 catch 块返回给前端的 message 都是用户友好的中文提示（如"登录失败"），不暴露内部错误堆栈或数据库信息。

## 3. 环境变量严格校验

所有必需环境变量缺失时直接 throw，不再用空字符串兜底：

| 文件 | 变量 | 行为 |
|------|------|------|
| `api/_lib/auth.ts` | `AUTH_TOKEN_SECRET` | 缺失即 throw `'缺少 AUTH_TOKEN_SECRET'` |
| `api/_lib/sms.ts` | `ALIYUN_ACCESS_KEY_*` | 缺失时 `createAliyunSmsClient` 直接 throw |
| `api/_lib/sms.ts` | `VERCEL_ENV` / `NODE_ENV` | 缺失即 throw `'缺少 VERCEL_ENV 或 NODE_ENV 环境变量'` |
| `api/_lib/sms.ts` | `TEST_SMS_CODE` | 测试模式开启但缺验证码直接 throw |
| `api/_lib/supabase.ts` | `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` | 缺失即 throw |
| `api/ai/chat.ts` | `DASHSCOPE_API_KEY` | 缺失即 throw `'缺少 DASHSCOPE_API_KEY 环境变量'` |
| `api/_lib/cors.ts` | `ALLOWED_ORIGINS` | 生产环境未配置即 throw `'生产环境必须配置 ALLOWED_ORIGINS'` |

## 4. CORS 白名单与安全响应头

### CORS（`api/_lib/cors.ts`）

所有端点统一调用 `setCorsHeaders()`：

- 读取 `ALLOWED_ORIGINS` 环境变量（逗号分隔）
- 开发环境未配置时放行所有来源
- 生产环境未配置直接 throw，强制要求填写
- 处理 OPTIONS preflight，返回 204
- 同时设置 `X-Content-Type-Options: nosniff` 和 `X-Frame-Options: DENY`

### 安全响应头（`vercel.json`）

全局添加以下响应头：

```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "X-Frame-Options", "value": "DENY" },
        { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" },
        { "key": "Permissions-Policy", "value": "camera=(), microphone=(self), geolocation=()" },
        { "key": "Strict-Transport-Security", "value": "max-age=63072000; includeSubDomains; preload" }
      ]
    }
  ]
}
```

## 5. 输入校验与长度限制

`api/_lib/validate.ts` 定义统一的输入约束：

| 字段 | 限制 | 应用位置 |
|------|------|----------|
| `username` | 最多 30 字符（`sanitizeString` 截断） | register、profile/update |
| `courseType` | 最多 50 字符 | register、profile/update |
| `avatarUrl` | 最多 500 字符 + `isValidUrl` 校验协议为 `http:` 或 `https:` | profile/update |
| 聊天消息 | 每条最多 2000 字符，最多 50 条 | ai/chat |
| `password` | 8–72 字符（`validatePassword`） | register、profile/password |

## 6. 密码安全

`api/_lib/password.ts` 使用 `scryptSync` + 随机 salt 做密码哈希，验证时用 `timingSafeEqual` 恒定时间比较：

```typescript
// 哈希：16 字节随机 salt + scrypt 派生 64 字节 key
export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex');
  const hash = scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

// 验证：恒定时间比较
export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(':');
  if (!salt || !hash) return false;
  const derived = scryptSync(password, salt, 64);
  return timingSafeEqual(Buffer.from(hash, 'hex'), derived);
}
```

登录端点支持 `mode: 'sms' | 'password'` 双模式，密码登录时校验 `password_hash` 字段。

## 7. 双 Token 机制（Refresh Token + Token 吊销）

### 架构

```
登录/注册
  → 后端签发 access token（15 分钟）+ refresh token（30 天）
  → 前端存 localStorage（shenyin_auth）

普通请求
  → 带 access token
  → 过期收到 401 → 自动用 refresh token 换新 token 对 → 重试原请求

退出登录
  → POST /api/auth/logout → 吊销 refresh token
  → 传 all: true → 吊销该用户所有设备的 refresh token
```

### Access Token

- 有效期 15 分钟（`ACCESS_TOKEN_TTL_MS = 15 * 60 * 1000`）
- HMAC-SHA256 签名，密钥为 `AUTH_TOKEN_SECRET`
- 无状态验证，不查数据库

### Refresh Token

- 有效期 30 天（`REFRESH_TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000`）
- `randomBytes(32).toString('base64url')` 生成随机字符串
- 数据库只存哈希值（`HMAC-SHA256(token, secret)`），原文不落库
- 每次刷新做 rotation：旧 token 标记 `revoked`，签发新 token
- 支持按用户批量吊销（`revokeAllUserTokens`）

### 数据库表

```sql
create table if not exists public.refresh_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id text not null references public.app_users(id) on delete cascade,
  token_hash text not null unique,
  expires_at timestamptz not null,
  revoked boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists refresh_tokens_hash_idx
  on public.refresh_tokens (token_hash) where not revoked;
create index if not exists refresh_tokens_user_idx
  on public.refresh_tokens (user_id) where not revoked;
```

### 端点

| 端点 | 方法 | 说明 |
|------|------|------|
| `/api/auth/refresh` | POST | 用 refresh token 换新 token 对（rotation） |
| `/api/auth/logout` | POST | 吊销单个 refresh token，或传 `all: true` 吊销该用户所有 token |

### 前端自动刷新（`src/services/authService.ts`）

`request()` 函数收到 401 时自动调用 `refreshTokenOnce()`，用 `refreshPromise` 单例防止并发刷新。刷新成功后用新 token 重试原请求，失败则清除 session。

```typescript
// 防止并发刷新
function refreshTokenOnce(): Promise<boolean> {
  if (!refreshPromise) {
    refreshPromise = tryRefreshToken().finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}
```

## 8. SMS 日志脱敏

```typescript
// 只打脱敏手机号，不打验证码
console.log(`[SMS] 测试验证码已发送 -> ${phone.slice(0, 3)}****${phone.slice(-4)}`);
```

## 9. 其他安全改造

| 位置 | 改动 |
|------|------|
| `api/_lib/users.ts` `mapUserRow` | `created_at` 为空时 throw 而非用 `Date.now()` 填充 |
| `api/_lib/users.ts` | `username ?? undefined` 使用 nullish coalescing，空字符串不被转 undefined |
| `api/_lib/supabase.ts` | 删除 `getUsersTableName()` 函数，改为导出常量 `APP_USERS_TABLE` |
| `api/_lib/supabase.ts` | `supabaseAdmin` 类型为 `SupabaseClient | null`，非 `any` |
| `api/ai/chat.ts` | AI 回复为空时返回 502 `'AI 未返回有效回复'`，不伪造兜底文案 |
| `api/_lib/sms.ts` | 重构为双路径（阿里云/测试模式），不满足任一条件直接 throw |

## 10. 测试验证

### 环境变量缺失检测

删除 `.env.local` 中的 `AUTH_TOKEN_SECRET`，启动 `vercel dev`，调用任意需要鉴权的接口，应返回 500 并在日志中看到 `缺少 AUTH_TOKEN_SECRET`。

### Token 过期与自动刷新

1. 登录获取 token 对
2. 等待 15 分钟（或临时将 `ACCESS_TOKEN_TTL_MS` 改为 10 秒）
3. 调用 `/api/auth/me`，前端应自动刷新并成功返回用户信息
4. 检查 localStorage 中的 token 已更新

### Token 吊销

```bash
# 登出当前设备
curl -X POST /api/auth/logout \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{"refreshToken":"<refresh_token>"}'

# 登出所有设备
curl -X POST /api/auth/logout \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{"all":true}'

# 验证：用旧 refresh token 刷新应返回 401
curl -X POST /api/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{"refreshToken":"<revoked_token>"}'
```

### CORS 验证

```bash
# 生产环境未配置 ALLOWED_ORIGINS 应返回 500
ALLOWED_ORIGINS= VERCEL_ENV=production curl /api/health

# 配置后，非白名单域名的请求不带 Access-Control-Allow-Origin 头
```

## 11. 涉及文件

| 文件 | 职责 |
|------|------|
| `api/_lib/auth.ts` | JWT 签发/验签、Refresh Token CRUD、鉴权中间件 |
| `api/_lib/cors.ts` | CORS 白名单 + 安全响应头 |
| `api/_lib/rate-limit.ts` | 滑动窗口限流 |
| `api/_lib/sms.ts` | 阿里云短信 / 测试模式 |
| `api/_lib/supabase.ts` | Supabase 客户端 |
| `api/_lib/users.ts` | 用户 CRUD |
| `api/_lib/validate.ts` | 输入校验 |
| `api/_lib/password.ts` | 密码哈希（scrypt + salt） |
| `api/_lib/types.ts` | 类型定义 |
| `api/auth/*.ts` | 认证端点（login / register / me / refresh / logout） |
| `api/profile/update.ts` | 用户资料更新 |
| `api/profile/password.ts` | 密码设置/修改 |
| `api/ai/chat.ts` | AI 对话 |
| `api/sms/send.ts` | 发送验证码 |
| `vercel.json` | 安全响应头配置 |
| `src/services/authService.ts` | 前端 Token 自动刷新 |

---

**修复日期**：2026-02-01
**修复人员**：Andy, Claude Sonnet 4.5
**问题严重程度**：高（安全基础设施）
**修复状态**：✅ 已完成并验证
