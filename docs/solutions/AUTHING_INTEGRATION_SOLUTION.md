# Authing 手机号验证码登录集成方案

> **状态：🚫 已弃用** — 项目已迁移到自有后端鉴权（Vercel Serverless + Supabase + 阿里云短信认证服务），不再使用 Authing SDK。相关代码（`authingService.ts`、`useAuthing.ts`）已从代码库中移除。

> 替代方案见：[SMS_AUTH_SERVICE_MIGRATION](./SMS_AUTH_SERVICE_MIGRATION.md)、[BACKEND_SECURITY_SOLUTION](./BACKEND_SECURITY_SOLUTION.md)

## 1. 问题描述

### 业务需求

在 React + TypeScript + Vite 项目中集成 Authing v5 SDK，实现手机号验证码登录功能。

### 目标功能

- 手机号验证码发送与登录
- 微信扫码登录 / QQ 一键登录
- Token 自动管理与用户状态持久化
- 并发请求保护

### 技术栈（当时）

- React 18 + TypeScript + Vite
- @authing/web v5.1.21

## 2. 集成过程中遇到的问题

在集成过程中遇到了 6 个核心问题：

### 问题 1：URL 格式错误

```
POST https://ytaxkxcx9g00-demo.authing.cnundefined/ net::ERR_CONNECTION_CLOSED
```

原因：Authing SDK 配置缺少必要参数，`domain` 字段格式不正确。

### 问题 2：并发认证流程冲突

```
Error: 另一个认证流程正在进行中，请不要同时发起多个认证
```

原因：React Strict Mode 在开发环境下双重调用 `useEffect`，多个 `getCurrentUser()` 同时执行。

### 问题 3：Token 认证方法配置错误

```
statusCode: 499
message: '应用 token_endpoint_auth_method 配置不为 none...'
```

原因：Authing 应用默认要求 `client_secret`，前端 SPA 不能存储密钥。需在控制台将换取 token 身份验证方式设为 `none`。

### 问题 4：API 参数格式错误

```
statusCode: 400
message: 'Parameter passCodePayload must include email or phone when connection is PASSCODE.'
```

原因：Authing v3 API 要求使用 `phone` 字段而不是 `phoneNumber`。

### 问题 5：用户访问权限限制

```
statusCode: 403, apiCode: 1576
message: '无权限登录此应用，请联系管理员'
```

原因：应用启用了访问控制，需配置为"允许所有用户访问"。

### 问题 6：验证码错误提示不准确

Authing 对"验证码错误"和"验证码过期"使用相同的错误码 `2001`，自定义错误提示可能与实际情况不符。

## 3. 弃用原因

Authing 方案在实际使用中暴露了以下问题，最终决定迁移到自有后端鉴权：

1. **SDK 不稳定**：Authing Web SDK 在不同浏览器中行为不一致，并发保护机制与 React Strict Mode 冲突
2. **控制台配置繁琐**：需要在 Authing 控制台手动配置多项参数（token_endpoint_auth_method、访问控制、回调 URL 等），容易遗漏
3. **第三方依赖风险**：核心认证流程依赖外部服务，增加了故障点和延迟
4. **灵活性不足**：无法自定义验证码生命周期、限流策略、错误提示等细节
5. **成本考量**：Authing 按用户数收费，自建方案更经济

## 4. 当前替代方案

项目已完全迁移到以下架构：

```
前端 (React)
  → authService.ts（统一请求封装 + Token 自动刷新）
  → AuthContext.tsx（全局认证状态）

后端 (Vercel Serverless Functions)
  → 自签 JWT（HMAC-SHA256）
  → Refresh Token（数据库存储 + rotation）
  → 阿里云短信认证服务（dypnsapi）发送/校验验证码
  → Supabase 做数据库

安全措施
  → 滑动窗口限流、CORS 白名单、输入校验、密码哈希（scrypt）
```

相关文档：
- [BACKEND_SECURITY_SOLUTION](./BACKEND_SECURITY_SOLUTION.md) — 后端安全防护全貌
- [SMS_AUTH_SERVICE_MIGRATION](./SMS_AUTH_SERVICE_MIGRATION.md) — 短信服务迁移细节
- [ROUTING_AND_LOGOUT_FIX](./ROUTING_AND_LOGOUT_FIX.md) — AuthContext 单一数据源改造

## 5. 历史 Authing 控制台配置（存档）

以下配置仅作历史记录，当前项目不再使用：

- 应用类型：标准 Web 应用 (OIDC)
- 换取 token 身份验证方式：`none`
- 返回类型：`code`
- 登录/登出回调 URL：`http://localhost:5173`
- 允许注册：开启，注册方式为手机号
- 访问控制：允许所有用户访问

环境变量（已移除）：
```env
VITE_AUTHING_APP_ID=（已删除）
VITE_AUTHING_APP_HOST=（已删除）
```

已删除的文件：
- `src/services/authingService.ts`
- `src/hooks/useAuthing.ts`

---

**最后更新**：2026-02-02
**修复人员**：Andy, Claude Sonnet 4.5
**问题严重程度**：高（核心功能）
**修复状态**：🚫 已弃用，替代方案已上线
