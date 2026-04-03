# 生音科技 - 灵谱奇域

## 技术栈

- React 19 + TypeScript + Vite
- Tailwind CSS
- React Router DOM
- Web Audio API + Tone.js
- Vercel Serverless Functions（后端）
- Supabase（数据库）
- 阿里云短信（验证码）
- 通义千问 qwen-plus（AI 对话）

## 快速开始

```bash
npm install
cp .env.local.example .env.local
npm run dev
```

## 工程结构

```
src/                              # 前端
├── pages/                        # 页面（FreeLab / Adventure / Stage / Profile / Login / Settings）
├── components/
│   ├── layout/                   # AppLayout / AuthPage / Navigation
│   ├── modes/                    # 三大模式（冒险 / 自由实验室 / 舞台）
│   ├── projects/                 # 15 个教学项目
│   ├── music/                    # Piano / PianoRoll / MusicStaff / DrumSequencer
│   └── ui/                       # AIAssistant / ExitConfirmation
├── contexts/                     # AuthContext / SettingsContext
├── services/                     # authService / audioService / drumSynthesizer
├── hooks/                        # useAuth / useAppRouter
├── constants/                    # palette / 音符和弦配置
└── utils/                        # musicNotes

api/                              # 后端（Vercel Serverless Functions）
├── _lib/                         # 共享模块
│   ├── auth.ts                   # JWT 签发/验签 + Refresh Token
│   ├── cors.ts                   # CORS + 安全头
│   ├── rate-limit.ts             # 滑动窗口限流
│   ├── sms.ts                    # 阿里云短信 / 测试模式
│   ├── supabase.ts               # Supabase 客户端
│   ├── users.ts                  # 用户 CRUD
│   ├── validate.ts               # 输入校验
│   └── types.ts                  # 类型定义
├── auth/                         # 认证端点
│   ├── login.ts                  # POST 手机号登录
│   ├── register.ts               # POST 注册
│   ├── me.ts                     # GET 获取当前用户
│   ├── refresh.ts                # POST 刷新 token
│   └── logout.ts                 # POST 登出（吊销 refresh token）
├── profile/update.ts             # POST 更新用户资料
├── sms/send.ts                   # POST 发送验证码
├── ai/chat.ts                    # POST AI 对话
└── health.ts                     # GET 健康检查
```

## 数据库配置（Supabase）

项目采用自有后端鉴权 + Supabase 只做数据库的模式，前端不直接访问 Supabase。

### 获取密钥

Supabase Dashboard → Project Settings → Data API / API Keys：

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`（不是 Publishable Key）

### 建表

在 SQL Editor 中执行：

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

create table if not exists public.refresh_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id text not null references public.app_users(id) on delete cascade,
  token_hash text not null unique,
  expires_at timestamptz not null,
  revoked boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists refresh_tokens_hash_idx on public.refresh_tokens (token_hash) where not revoked;
create index if not exists refresh_tokens_user_idx on public.refresh_tokens (user_id) where not revoked;
```

## 部署（Vercel）

### 构建设置

仓库已有 `vercel.json`，Vercel 会自动识别。确认：

- Framework Preset: Vite
- Build Command: `npm run build`
- Output Directory: `dist`

> 线上只运行 `api/` 下的函数。

### 环境变量

在 Vercel Dashboard → Settings → Environment Variables 中配置：

```env
# 必需
AUTH_TOKEN_SECRET=          # JWT 签名密钥，用 openssl rand -base64 48 生成
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=

# 短信（阿里云）
ALIYUN_ACCESS_KEY_ID=
ALIYUN_ACCESS_KEY_SECRET=
SMS_SIGN_NAME=
SMS_TEMPLATE_CODE=
SMS_SCHEME_NAME=

# AI
DASHSCOPE_API_KEY=
DASHSCOPE_BASE_URL=         # 可选，默认 https://dashscope.aliyuncs.com/compatible-mode/v1
DEFAULT_MODEL=              # 可选，默认 qwen-plus

# 安全
ALLOWED_ORIGINS=            # 生产环境必填，逗号分隔前端域名

# 仅开发/预览环境
ALLOW_TEST_SMS=true
TEST_SMS_CODE=123456
```

注意：

- 不要在 Vercel 上配 `VITE_API_BASE`，前端默认请求同域 `/api/*`
- 生产环境不要开 `ALLOW_TEST_SMS=true`
- 改完环境变量后需要重新部署

### 部署验收

```bash
# 健康检查
curl https://your-domain.vercel.app/api/health

# AI 接口
curl https://your-domain.vercel.app/api/ai/chat
```

## 一键全栈调试（VS Code）

项目已配置 `.vscode/launch.json`，可以在 VS Code 中一键启动前端 + 后端并 attach 调试器。

### 前提

1. 确保 `.env.local` 中配置了 `VITE_API_BASE=http://localhost:3001`
2. 首次使用需运行 `npx vercel link` 关联项目

### 启动方式

按 `F5` 或打开 Run and Debug 面板（`⇧⌘D`），选择配置：

| 配置名 | 说明 |
|--------|------|
| 🚀 全栈调试 (前端 + API) | 同时启动 Vite（:3000）和 vercel dev（:3001），打开 Chrome |
| 前端 (Chrome) | 仅启动 Vite + Chrome 调试 |
| 后端 API (Vercel Dev) | 仅启动 vercel dev，可在 `api/` 下打断点 |

### 调试技巧

- 前端：直接在 `.tsx` / `.ts` 文件中打断点，Chrome 会自动暂停
- 后端：在 `api/` 下的 serverless function 中打断点
- 停止：点击调试工具栏的红色停止按钮，会同时终止前后端进程

## 后端调试

### 本地开发

```bash
npm i -g vercel
vercel link
vercel dev           # http://localhost:3000
```

`vercel dev` 模拟 Serverless 环境，自动读取 `.env.local`。

测试短信（跳过阿里云）：

```env
ALLOW_TEST_SMS=true
TEST_SMS_CODE=123456
```

### curl 测试

```bash
curl http://localhost:3000/api/health

curl -X POST http://localhost:3000/api/sms/send \
  -H "Content-Type: application/json" \
  -d '{"phone":"13800138000"}'

curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"phone":"13800138000","code":"123456"}'

# 用登录返回的 token
curl http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer <token>"

# 刷新 token
curl -X POST http://localhost:3000/api/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{"refreshToken":"<refresh_token>"}'

# 登出
curl -X POST http://localhost:3000/api/auth/logout \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"refreshToken":"<refresh_token>"}'
```

### 生产日志

```bash
vercel logs <deployment-url> --follow
```

### 常见问题

| 现象 | 排查方向 |
|------|----------|
| 500 | Vercel Dashboard → Function Logs |
| 验证码发不出 | 检查 `ALIYUN_ACCESS_KEY_ID` / `ALIYUN_ACCESS_KEY_SECRET` |
| Token 失败 | `AUTH_TOKEN_SECRET` 本地和生产是否一致 |
| AI 无响应 | 检查 `DASHSCOPE_API_KEY` |
| 数据库失败 | 检查 `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` |
| CORS 报错 | 生产环境需配置 `ALLOWED_ORIGINS` |

## 解决方案知识库

`docs/solutions/` 下记录每次问题修复和功能方案的技术沉淀：

| 文档 | 说明 |
|------|------|
| [BACKEND_SECURITY_SOLUTION](./docs/solutions/BACKEND_SECURITY_SOLUTION.md) | 后端安全防护方案 |
| [PIANO_HIGHLIGHT_DELAY_FIX](./docs/solutions/PIANO_HIGHLIGHT_DELAY_FIX.md) | 钢琴键盘高亮延迟修复 |
| [SAFARI_FIX_ANALYSIS](./docs/solutions/SAFARI_FIX_ANALYSIS.md) | Safari 兼容性修复 |
| [AUTHING_INTEGRATION_SOLUTION](./docs/solutions/AUTHING_INTEGRATION_SOLUTION.md) | Authing 认证集成方案（已弃用） |
| [ROUTING_AND_LOGOUT_FIX](./docs/solutions/ROUTING_AND_LOGOUT_FIX.md) | 路由状态与退出登录修复 |
| [REACT_ROUTER_MIGRATION_SOLUTION](./docs/solutions/REACT_ROUTER_MIGRATION_SOLUTION.md) | React Router 迁移方案 |
| [SMS_AUTH_SERVICE_MIGRATION](./docs/solutions/SMS_AUTH_SERVICE_MIGRATION.md) | SMS 认证服务迁移方案 |

每次解决问题后按 `遇到问题 → 调试分析 → 实施修复 → 写 Solution 文档 → 提交代码` 的流程沉淀文档。
