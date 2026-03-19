# Vercel 部署指南

本项目部署到 Vercel 时，实际生效的是：

- 前端静态站点：Vite 构建产物 `dist`
- 后端接口：根目录 `api/` 下的 Vercel Functions
- 本地开发专用服务：`server/` 目录不会部署到 Vercel
- AI 接口继续保留 Python：`api/ai/chat.py`

## 我已经帮你准备好的内容

- 已存在 [vercel.json](/Users/andylyu/Documents/GitHub/LingPuQiYu/vercel.json)
- 已补上 `api/auth/login.ts`、`api/auth/register.ts`、`api/auth/me.ts`
- 已给 `api/ai/chat.py` 配置了更长的函数运行时长
- 已添加 [.python-version](/Users/andylyu/Documents/GitHub/LingPuQiYu/.python-version) 固定 Python 3.12

## 部署前必须准备

### 1. Supabase

你必须先在 Supabase 里创建这张表：

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

还需要拿到：

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

### 2. 阿里云短信

如果线上要发真实验证码，你还需要：

- `ALIYUN_ACCESS_KEY_ID`
- `ALIYUN_ACCESS_KEY_SECRET`
- `SMS_SIGN_NAME`
- `SMS_TEMPLATE_CODE`
- `SMS_SCHEME_NAME`（如果你当前方案需要）

如果你暂时只是联调，可以先不填阿里云变量，这样会走测试模式。

### 3. AI 接口

如果你要启用 `/api/ai/chat`，需要：

- `DASHSCOPE_API_KEY`

可选：

- `DASHSCOPE_BASE_URL`
- `DEFAULT_MODEL`

## 在 Vercel Dashboard 里怎么配

### 1. 新建项目

去 Vercel Dashboard：

1. 点击 `Add New...`
2. 选择 `Project`
3. 导入你的 GitHub 仓库
4. Root Directory 选仓库根目录 `/`

### 2. 构建设置

这个仓库已经有 `vercel.json`，正常情况下 Vercel 会直接按它来。

确认这几项：

- Framework Preset: `Vite`
- Build Command: `npm run build`
- Output Directory: `dist`

### 3. 环境变量

在 Project Settings -> Environment Variables 里添加下面这些。

#### 必填

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `AUTH_TOKEN_SECRET`

#### 短信相关

- `ALIYUN_ACCESS_KEY_ID`
- `ALIYUN_ACCESS_KEY_SECRET`
- `SMS_SIGN_NAME`
- `SMS_TEMPLATE_CODE`
- `SMS_SCHEME_NAME`

#### AI 相关

- `DASHSCOPE_API_KEY`
- `DASHSCOPE_BASE_URL`
- `DEFAULT_MODEL`

#### 测试环境可选

- `TEST_SMS_CODE`
- `ALLOW_TEST_SMS`

建议：

- `Production`、`Preview` 两个环境都先配
- 改完环境变量后重新部署一次，因为新变量不会自动作用到旧部署
- 生产环境不要开启 `ALLOW_TEST_SMS=true`

## 哪些前端变量要配，哪些不要配

### 不建议在 Vercel 配

- `VITE_API_BASE`

原因：

- 你的前端现在默认请求同域名下的 `/api/*`
- 在 Vercel 上这正是我们想要的行为
- 如果你把 `VITE_API_BASE` 配成 `http://localhost:3001`，线上会直接坏掉

### 可不配

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`

原因：

- 现在这套方案里前端并不直接访问 Supabase
- 它们只是在本地示例里保留，方便你以后扩展 Storage 或前端只读场景

## 推荐的 `AUTH_TOKEN_SECRET`

请不要用短字符串。建议至少 32 位随机字符。

例如：

```txt
lingpuqiyu_prod_2026_replace_this_with_a_real_random_secret_32chars
```

更好的方式是用密码管理器生成随机值。

## 部署后怎么验收

部署成功后，先检查这几个地址：

### 1. 健康检查

```txt
https://你的域名.vercel.app/api/health
```

应该返回类似：

```json
{
  "status": "ok",
  "mode": "aliyun-sms-auth",
  "database": "supabase-ready"
}
```

如果没配阿里云，也可能是：

```json
{
  "status": "ok",
  "mode": "test",
  "smsTestMode": true,
  "database": "supabase-ready"
}
```

### 2. AI 接口健康检查

```txt
https://你的域名.vercel.app/api/ai/chat
```

应该返回：

```json
{
  "ok": true,
  "message": "AI chat endpoint is running."
}
```

### 3. 登录流程

检查：

- 能否发送验证码
- 能否登录
- 刷新后是否保持登录
- Supabase `app_users` 表里是否写入用户

## 最容易踩坑的地方

### 1. 只配了 publishable key，没配 service role key

症状：

- `/api/auth/login` 或 `/api/auth/register` 报错
- `/api/health` 里 `database` 不是 `supabase-ready`

### 2. 配了 `VITE_API_BASE=http://localhost:3001`

症状：

- 线上页面能打开
- 但所有登录请求都打到你本地地址，直接失败

### 3. 生产环境误开 `ALLOW_TEST_SMS=true`

这会让未配置阿里云短信时仍然接受测试验证码，存在明显安全风险。

### 4. 改了环境变量但没重新部署

Vercel 的环境变量只会作用于新的部署。

### 5. 以为 `server/` 会一起上线

不会。

在 Vercel 上只会运行根目录 `api/` 下的函数。

## 你可以直接用的部署方式

### 方式一：Dashboard

最稳妥，适合第一次部署。

### 方式二：CLI

如果你已经登录过 Vercel CLI：

```bash
npx vercel
```

生产部署：

```bash
npx vercel --prod
```

## 和官方文档对应的点

- Vite 项目可以直接部署到 Vercel，`api/` 目录可作为 Vercel Functions 使用
- Python Runtime 会读取根目录的 `.python-version`
- 函数的最大运行时长可以通过 `vercel.json` 配置
- 环境变量在 Vercel Project Settings 中配置，修改后要重新部署
