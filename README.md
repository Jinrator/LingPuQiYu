# 生音科技 - 灵谱奇域

## 工程结构

```
├── src/
│   ├── index.tsx                  # React 渲染入口
│   ├── App.tsx                    # 旧版应用入口（已废弃）
│   │
│   ├── router/                    # 路由配置
│   │   └── index.tsx             # React Router 配置
│   │
│   ├── pages/                     # 页面组件（类似 Next.js）
│   │   ├── FreeLab.tsx           # 自由实验室页面
│   │   ├── Adventure.tsx         # 冒险模式页面
│   │   ├── Stage.tsx             # 舞台模式页面
│   │   ├── Profile.tsx           # 用户档案页面
│   │   ├── Login.tsx             # 登录页面
│   │   ├── NotFound.tsx          # 404 页面
│   │   └── lab/                  # 实验室子页面
│   │       ├── ProjectDetail.tsx # 项目详情页
│   │       └── CreateProject.tsx # 创建项目页
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
│   │   │   ├── MusicStaff.tsx    # 五线谱
│   │   │   └── DrumSequencer.tsx # 鼓机音序器
│   │   │
│   │   └── ui/                   # UI 组件
│   │       ├── AIAssistant.tsx   # AI 助手（灵感精灵）
│   │       └── ExitConfirmation.tsx # 退出确认提示
│   │
│   ├── contexts/                 # React Context
│   │   └── AuthContext.tsx       # 认证上下文
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
│   │   └── instrumentConfig.ts   # 乐器配置
│   │
│   ├── types/                    # TypeScript 类型定义
│   │   └── index.ts              # 全局类型
│   │
│   ├── constants/                # 常量配置
│   │   └── index.ts              # 音符、和弦、关卡等配置
│   │
│   ├── utils/                    # 工具函数
│   │   └── musicNotes.ts         # 音乐理论工具
│   │
│   └── assets/                   # 静态资源
│       └── logo.jpg              # Logo 图片
│
├── public/                       # 公共资源
│   └── samples/                  # 音频样本
│       ├── piano/                # 钢琴音色
│       └── drums/                # 鼓组音色
│           ├── acoustic/         # 原声鼓
│           └── electronic/       # 电子鼓
│
├── server/                       # 后端服务（可选）
│   ├── index.js                  # Express 服务器
│   └── package.json              # 后端依赖
│
├── scripts/                      # 工具脚本
│   └── generate-samples.html     # 音频样本生成工具
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
- **AI**: Google Gemini API
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
