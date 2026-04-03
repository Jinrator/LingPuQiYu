# 生音科技 - 灵谱奇域

## 工程结构

```
├── src/
│   ├── index.tsx                  # React 渲染入口
│   ├── App.tsx                    # 应用入口组件
│   ├── index.css                  # 全局样式
│   ├── vite-env.d.ts              # Vite 类型声明
│   │
│   ├── router/                    # 路由配置
│   │   └── index.tsx             # React Router 配置
│   │
│   ├── pages/                     # 页面组件
│   │   ├── FreeLab.tsx           # 自由实验室页面
│   │   ├── Adventure.tsx         # 冒险模式页面
│   │   ├── Stage.tsx             # 舞台模式页面
│   │   ├── Profile.tsx           # 用户档案页面
│   │   ├── Login.tsx             # 登录页面
│   │   ├── Settings.tsx          # 设置页面
│   │   └── NotFound.tsx          # 404 页面
│   │
│   ├── components/                # 组件目录
│   │   ├── layout/               # 布局组件
│   │   │   ├── AppLayout.tsx     # 主布局组件
│   │   │   ├── AuthPage.tsx      # 登录/注册页面
│   │   │   ├── Navigation.tsx    # 导航栏
│   │   │   └── UserProfile.tsx   # 用户档案
│   │   │
│   │   ├── router/               # 路由组件
│   │   │   └── ProtectedRoute.tsx # 路由守卫
│   │   │
│   │   ├── modes/                # 三大模式
│   │   │   ├── AdventureMode.tsx # 冒险模式（闯关地图）
│   │   │   ├── FreeLab.tsx       # 自由实验室
│   │   │   └── StageMode.tsx     # 舞台模式（作品展示）
│   │   │
│   │   ├── projects/             # 15个教学项目
│   │   │   ├── SoundHuntingProject.tsx          # 1. 声音狩猎计划
│   │   │   ├── RhythmColoringProject.tsx        # 2. 律动填色游戏
│   │   │   ├── RhythmLegoProject.tsx            # 3. 节奏乐高工厂
│   │   │   ├── PitchLadderProject.tsx           # 4. 音高登天梯
│   │   │   ├── MoodDoodleProject.tsx            # 5. 心情涂鸦板
│   │   │   ├── MelodyMirrorProject.tsx          # 6. 旋律对对子
│   │   │   ├── InspirationRetroProject.tsx      # 7. 灵感回溯录
│   │   │   ├── ChordBurgerProject.tsx           # 8. 和弦叠叠乐
│   │   │   ├── ChordRouteProject.tsx            # 9. 音乐探险路线
│   │   │   ├── StyleTransformProject.tsx        # 10. 风格大变身
│   │   │   ├── MusicAtlasProject.tsx            # 11. 音乐地图册
│   │   │   ├── MemoryHookProject.tsx            # 12. 记忆钩子
│   │   │   ├── MusicTrainProject.tsx            # 13. 音乐火车组装
│   │   │   ├── AIRecordingStudioProject.tsx     # 14. AI 录音棚
│   │   │   └── PersonalDebutProject.tsx         # 15. 个人首单发布
│   │   │
│   │   ├── music/                # 音乐相关组件
│   │   │   ├── Piano.tsx         # 钢琴键盘
│   │   │   ├── PianoRoll.tsx     # 钢琴卷帘
│   │   │   ├── TranscriptionPianoRoll.tsx # 曲转谱钢琴卷帘
│   │   │   ├── MusicStaff.tsx    # 五线谱
│   │   │   └── DrumSequencer.tsx # 鼓机音序器
│   │   │
│   │   ├── ui/                   # UI 组件
│   │   │   ├── AIAssistant.tsx   # AI 助手（灵感精灵）
│   │   │   ├── ExitConfirmation.tsx # 退出确认提示
│   │   │   └── MelodyDecoderModal.tsx # 旋律解码弹窗
│   │   │
│   │   └── demo/                 # 演示组件
│   │       └── RouterDemo.tsx    # 路由演示
│   │
│   ├── contexts/                 # React Context
│   │   ├── AuthContext.tsx       # 认证上下文
│   │   ├── SettingsContext.tsx   # 设置上下文
│   │   └── i18n.ts               # 国际化配置
│   │
│   ├── hooks/                    # 自定义 Hooks
│   │   ├── useAuth.ts           # 认证 Hook
│   │   ├── useAppRouter.ts      # 路由工具 Hook
│   │   └── useExitConfirmation.ts # 退出确认 Hook
│   │
│   ├── services/                 # 服务层
│   │   ├── audioService.ts       # 音频服务（Web Audio API）
│   │   ├── authService.ts        # 认证服务
│   │   ├── drumSynthesizer.ts    # 鼓机合成器
│   │   ├── instrumentConfig.ts   # 乐器配置
│   │   ├── midiExportService.ts  # MIDI 导出服务
│   │   └── pitchDetectionService.ts # 音高检测服务（YIN算法）
│   │
│   ├── types/                    # TypeScript 类型定义
│   │   └── index.ts              # 全局类型
│   │
│   ├── constants/                # 常量配置
│   │   ├── index.ts              # 音符、和弦、关卡等配置
│   │   └── palette.ts            # 调色板配置
│   │
│   ├── utils/                    # 工具函数
│   │   └── musicNotes.ts         # 音乐理论工具
│   │
│   └── assets/                   # 静态资源
│       └── logo.jpg              # Logo 图片
│
├── public/                       # 公共资源
│   ├── logo/                     # Logo 文件
│   │   └── logo.png
│   └── samples/                  # 音频样本
│       ├── piano/                # 钢琴音色（C3-C5, A3-A5 等）
│       └── drums/                # 鼓组音色
│           ├── acoustic/         # 原声鼓
│           └── electronic/       # 电子鼓
│
├── docs/                         # 文档目录
│   ├── AUTHING_LOGIN_GUIDE.md    # 技术文档
│   └── solutions/               # 解决方案知识库
│       ├── PIANO_HIGHLIGHT_DELAY_FIX.md
│       ├── SAFARI_FIX_ANALYSIS.md
│       ├── AUTHING_INTEGRATION_SOLUTION.md
│       ├── ROUTING_AND_LOGOUT_FIX.md
│       ├── REACT_ROUTER_MIGRATION_SOLUTION.md
│       └── SMS_AUTH_SERVICE_MIGRATION.md
│
├── index.html                    # HTML 入口
├── vite.config.ts                # Vite 配置
├── tsconfig.json                 # TypeScript 配置
└── package.json                  # 项目依赖
```

## 技术栈

- **框架**: React 19 + TypeScript
- **路由**: React Router DOM
- **构建工具**: Vite
- **样式**: Tailwind CSS
- **音频**: Web Audio API + Tone.js
- **AI**: qwen-plus API
- **图标**: Lucide React
- **认证**: 自定义认证服务（支持手机号、微信、QQ）

## Run Locally

```bash
# 安装依赖
npm install

# 配置环境变量
cp .env.local.example .env.local

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build

# 预览生产构建
npm run preview
```

## 📚 文档体系

本项目采用**双文档体系**，确保知识沉淀和开发效率：

### � 1. 技术文档 (`docs/`)
面向开发者的部署和集成指南：
- **[Authing 登录集成指南](./docs/AUTHING_LOGIN_GUIDE.md)** - 微信、QQ、手机号登录完整方案

### 🔧 2. 解决方案知识库 (`docs/solutions/`)
每次解决问题后的技术沉淀：
- **[Piano 高亮延迟修复](./docs/solutions/PIANO_HIGHLIGHT_DELAY_FIX.md)** - 钢琴键盘高亮延迟问题
- **[Safari 兼容性修复](./docs/solutions/SAFARI_FIX_ANALYSIS.md)** - Safari 浏览器兼容性问题
- **[Authing 集成方案](./docs/solutions/AUTHING_INTEGRATION_SOLUTION.md)** - Authing 认证集成完整方案
- **[路由状态 & 退出登录修复](./docs/solutions/ROUTING_AND_LOGOUT_FIX.md)** - 路由状态丢失与退出登录功能修复
- **[React Router 迁移方案](./docs/solutions/REACT_ROUTER_MIGRATION_SOLUTION.md)** - 从状态管理到现代路由系统的完整迁移
- **[SMS 认证服务迁移](./docs/solutions/SMS_AUTH_SERVICE_MIGRATION.md)** - 短信认证服务迁移方案

---

## 📝 文档工作流

**核心原则：每次解决问题后，必须写 Solution 文档扩充项目知识库**

### 标准工作流程

```
遇到问题 → 调试分析 → 实施修复 → 写 Solution 文档 → 提交代码
```

### Solution 文档规范

**存放位置**: `docs/solutions/`

**命名格式**: 
- 问题修复：`PROBLEM_NAME_FIX.md`
- 功能方案：`FEATURE_NAME_SOLUTION.md`

**必须包含**:
1. 问题描述/背景
2. 根本原因分析
3. 解决方案详解
4. 关键代码示例
5. 测试验证方法

### 文档目录结构

```
docs/
├── AUTHING_LOGIN_GUIDE.md        # 技术文档：开发者集成指南
├── OTHER_TECH_GUIDE.md           # 技术文档：其他部署文档
└── solutions/                     # 解决方案：问题知识库
    ├── PIANO_HIGHLIGHT_DELAY_FIX.md
    ├── SAFARI_FIX_ANALYSIS.md
    ├── AUTHING_INTEGRATION_SOLUTION.md
    ├── ROUTING_AND_LOGOUT_FIX.md
    ├── REACT_ROUTER_MIGRATION_SOLUTION.md
    └── SMS_AUTH_SERVICE_MIGRATION.md
    ├── SAFARI_FIX_ANALYSIS.md
    ├── AUTHING_INTEGRATION_SOLUTION.md
    └── ROUTING_AND_LOGOUT_FIX.md
```

---

## 🔧 后端调试指南

### 架构概览

后端采用 Vercel Serverless Functions，每个 `api/` 目录下的 `.ts` 文件对应一个独立的 HTTP 端点：

| 端点 | 方法 | 说明 |
|------|------|------|
| `/api/health` | GET | 健康检查 |
| `/api/auth/login` | POST | 手机号登录 |
| `/api/auth/register` | POST | 手机号注册 |
| `/api/auth/me` | GET | 获取当前用户（需 Bearer Token） |
| `/api/profile/update` | POST | 更新用户资料（需 Bearer Token） |
| `/api/sms/send` | POST | 发送短信验证码 |
| `/api/ai/chat` | POST | AI 对话（需 Bearer Token） |

### 本地调试

#### 1. 安装 Vercel CLI

```bash
npm i -g vercel
```

#### 2. 关联项目并启动本地开发服务器

```bash
vercel link          # 首次需要关联 Vercel 项目
vercel dev           # 启动本地开发服务器（默认 http://localhost:3000）
```

`vercel dev` 会模拟 Vercel 的 Serverless 运行环境，自动读取 `.env.local` 中的环境变量，并将 `api/` 目录下的函数映射为 HTTP 端点。

#### 3. 用 curl 测试端点

```bash
# 健康检查
curl http://localhost:3000/api/health

# 发送验证码
curl -X POST http://localhost:3000/api/sms/send \
  -H "Content-Type: application/json" \
  -d '{"phone":"13800138000"}'

# 登录
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"phone":"13800138000","code":"123456"}'

# 需要认证的接口（用登录返回的 token）
curl http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer <your_token>"
```

#### 4. 测试短信（非生产环境）

在 `.env.local` 中配置以下变量即可跳过阿里云短信，使用固定验证码：

```env
ALLOW_TEST_SMS=true
TEST_SMS_CODE=123456
```

> 注意：`ALLOW_TEST_SMS=true` 仅在 `VERCEL_ENV` / `NODE_ENV` 不为 `production` 时生效。

### 查看 Vercel 生产日志

```bash
# 实时查看 Serverless Function 日志
vercel logs <your-deployment-url> --follow

# 或在 Vercel Dashboard 中查看：
# Project → Deployments → Functions → 选择具体函数查看日志
```

### 常见问题排查

| 现象 | 排查方向 |
|------|----------|
| 接口返回 500 | 检查 Vercel Dashboard 的 Function Logs，看具体报错 |
| 验证码发不出去 | 确认 `ALIYUN_ACCESS_KEY_ID` / `ALIYUN_ACCESS_KEY_SECRET` 已配置 |
| Token 验证失败 | 确认 `AUTH_TOKEN_SECRET` 在本地和生产环境一致 |
| AI 聊天无响应 | 确认 `DASHSCOPE_API_KEY` 已配置，检查上游 API 是否可达 |
| 数据库操作失败 | 确认 `SUPABASE_URL` 和 `SUPABASE_SERVICE_ROLE_KEY` 正确 |
| CORS 报错 | 生产环境需在 `ALLOWED_ORIGINS` 中配置前端域名 |

### 环境变量清单

后端运行所需的完整环境变量（在 Vercel Dashboard → Settings → Environment Variables 中配置）：

```env
# 必需
AUTH_TOKEN_SECRET=          # JWT 签名密钥（随机长字符串）
SUPABASE_URL=               # Supabase 项目 URL
SUPABASE_SERVICE_ROLE_KEY=  # Supabase Service Role Key

# 短信服务（阿里云）
ALIYUN_ACCESS_KEY_ID=
ALIYUN_ACCESS_KEY_SECRET=
SMS_SIGN_NAME=
SMS_TEMPLATE_CODE=
SMS_SCHEME_NAME=

# AI 服务
DASHSCOPE_API_KEY=
DASHSCOPE_BASE_URL=         # 可选，默认 https://dashscope.aliyuncs.com/compatible-mode/v1
DEFAULT_MODEL=              # 可选，默认 qwen-plus

# 安全
ALLOWED_ORIGINS=            # 生产环境必须配置，逗号分隔

# 仅开发环境
ALLOW_TEST_SMS=true
TEST_SMS_CODE=123456
```
