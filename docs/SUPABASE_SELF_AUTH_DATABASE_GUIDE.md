# Supabase 数据库接入指南

本项目当前采用的是：

- 自有后端负责短信验证码鉴权
- Supabase 只负责存储用户资料
- 前端不直接写 Supabase

## 已经完成的代码改造

- 前端 `authService` 已改为调用后端接口：
  - `POST /api/auth/check-phone`
  - `POST /api/auth/login`
  - `POST /api/auth/register`
  - `GET /api/auth/me`
- 本地开发后端 `server/index.ts` 已接入 Supabase 用户资料读写
- Vercel Serverless `api/auth/*` 已接入 Supabase 用户资料读写
- 登录态恢复改为通过后端校验 token，而不是只信任本地 `localStorage`
- 资料页和导航头像已切到真实登录用户数据
- AI 接口仍保留为 Python：`api/ai/chat.py`

## 你需要完成的事情

### 1. 从 Supabase 后台拿到 Service Role Key

你现在手里给的是 `Publishable key`，它适合前端公开使用，不适合当前这个“服务端写数据库”的方案。

你还需要去 Supabase 控制台拿：

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

路径一般在：

- Project Settings
- Data API / API Keys

## 2. 创建 `app_users` 表

在 Supabase SQL Editor 执行下面这段：

```sql
create table if not exists public.app_users (
  id text primary key,
  phone text not null unique,
  username text,
  avatar_url text,
  course_type text,
  login_method text not null default 'phone',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists app_users_phone_idx on public.app_users (phone);
```

说明：

- 这里没有依赖 `auth.users`
- 因为你走的是自有后端鉴权，不是 Supabase Auth

## 3. 配置本地环境变量

前端根目录 `.env.local`：

```env
VITE_API_BASE=http://localhost:3001
VITE_SUPABASE_URL=https://ektwlvveofwegrkwksxo.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_tVG_L20eqyBcHSowgGE42g_WlDwwI3q
```

说明：

- 这两个 `VITE_SUPABASE_*` 当前不是必须的
- 我保留它们是为了以后如果你要接 Supabase Storage 或前端只读能力时更方便

服务端 `server/.env.local`：

```env
PORT=3001

ALIYUN_ACCESS_KEY_ID=
ALIYUN_ACCESS_KEY_SECRET=
SMS_SIGN_NAME=
SMS_TEMPLATE_CODE=
SMS_SCHEME_NAME=

SUPABASE_URL=https://ektwlvveofwegrkwksxo.supabase.co
SUPABASE_SERVICE_ROLE_KEY=这里填你从后台拿到的 service role key
AUTH_TOKEN_SECRET=这里填一个足够长的随机字符串
TEST_SMS_CODE=888888
ALLOW_TEST_SMS=true
```

`AUTH_TOKEN_SECRET` 可以先临时用这种风格：

```txt
lingpuqiyu_local_dev_replace_me_2026_very_long_random_secret
```

## 4. 配置 Vercel 环境变量

如果你是部署到 Vercel，还要在项目环境变量里补：

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `AUTH_TOKEN_SECRET`
- `ALIYUN_ACCESS_KEY_ID`
- `ALIYUN_ACCESS_KEY_SECRET`
- `SMS_SIGN_NAME`
- `SMS_TEMPLATE_CODE`
- `SMS_SCHEME_NAME`
- `TEST_SMS_CODE`（仅测试环境可选）
- `ALLOW_TEST_SMS`

注意：

- `Production` 不要开启 `ALLOW_TEST_SMS=true`
- 这个开关只应该用于本地开发或临时预览联调

## 5. 安装依赖

根目录执行：

```bash
npm install
```

服务端目录执行：

```bash
cd server
npm install
```

如果还没装 `@supabase/supabase-js`，执行：

```bash
npm install @supabase/supabase-js
cd server && npm install @supabase/supabase-js
```

## 6. 本地启动

先启动后端：

```bash
cd server
npm run dev
```

再启动前端：

```bash
npm run dev
```

## 7. 验证流程

### 健康检查

浏览器打开：

```txt
http://localhost:3001/api/health
```

你应该看到类似：

```json
{
  "status": "ok",
  "mode": "test",
  "database": "supabase-ready"
}
```

### 登录验证

本地测试模式：

- 先获取验证码
- 如果你本地跑的是 `server/index.ts`，验证码会打印在终端
- 如果你走的是 serverless 测试模式，默认验证码是 `888888`

成功后，Supabase 的 `public.app_users` 表里应该出现一条记录。

## 8. 常见问题

### `Supabase 未配置`

说明服务端缺少：

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

### `登录状态已失效`

说明：

- `AUTH_TOKEN_SECRET` 变了
- 或者本地旧 token 还在

处理方式：

- 清掉浏览器 `localStorage`
- 重新登录

### `数据库里没写入`

优先检查：

- `public.app_users` 表是否已创建
- `SUPABASE_SERVICE_ROLE_KEY` 是否填写正确
- 服务端日志里是否有 Supabase 报错

## 当前接口约定

### `POST /api/auth/check-phone`

请求体：

```json
{
  "phone": "13800138000"
}
```

说明：

- 登录页点击“获取验证码”时会先调这个接口
- 如果手机号未注册，前端会直接切到注册页
- 已注册用户才继续发送登录验证码

### `POST /api/auth/login`

请求体：

```json
{
  "phone": "13800138000",
  "code": "123456"
}
```

说明：

- 只有已注册用户才能登录
- 如果手机号不存在，会返回 `USER_NOT_FOUND`
- 前端会自动切换到注册页，引导用户补全资料

### `POST /api/auth/register`

请求体：

```json
{
  "phone": "13800138000",
  "code": "123456",
  "username": "小宇",
  "courseType": "PRODUCER"
}
```

说明：

- 如果用户已存在，会更新昵称和课程方向

### `GET /api/auth/me`

请求头：

```txt
Authorization: Bearer <token>
```

说明：

- 前端刷新时会调用这个接口恢复登录态
