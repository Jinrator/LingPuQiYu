# 生音科技 - 灵谱奇域

## 工程结构

```
├── src/
│   ├── App.tsx                    # 应用主入口
│   ├── index.tsx                  # React 渲染入口
│   │
│   ├── components/                # 组件目录
│   │   ├── layout/               # 布局组件
│   │   │   ├── AuthPage.tsx      # 登录/注册页面
│   │   │   ├── Navigation.tsx    # 导航栏
│   │   │   └── UserProfile.tsx   # 用户档案
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
│   │       └── AIAssistant.tsx   # AI 助手（灵感精灵）
│   │
│   ├── services/                 # 服务层
│   │   └── audioService.ts       # 音频服务（Web Audio API）
│   │
│   ├── types/                    # TypeScript 类型定义
│   │   └── index.ts              # 全局类型
│   │
│   ├── constants/                # 常量配置
│   │   └── index.ts              # 音符、和弦、关卡等配置
│   │
│   ├── assets/                   # 静态资源
│   │   └── logo.jpg              # Logo 图片
│   │
│   └── utils/                    # 工具函数（预留）
│
├── index.html                    # HTML 入口
├── vite.config.ts                # Vite 配置
├── tsconfig.json                 # TypeScript 配置
└── package.json                  # 项目依赖

```

## 技术栈

- **框架**: React 19 + TypeScript
- **构建工具**: Vite
- **样式**: Tailwind CSS
- **音频**: Web Audio API
- **AI**: Google Gemini API
- **图标**: Lucide React

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

### � 2. 解决方案知识库 (`docs/solutions/`)
每次解决问题后的技术沉淀：
- **[Piano 高亮延迟修复](./docs/solutions/PIANO_HIGHLIGHT_DELAY_FIX.md)** - 钢琴键盘高亮延迟问题
- **[Safari 兼容性修复](./docs/solutions/SAFARI_FIX_ANALYSIS.md)** - Safari 浏览器兼容性问题
- **[Authing 集成方案](./docs/solutions/AUTHING_INTEGRATION_SOLUTION.md)** - Authing 认证集成完整方案

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
    └── AUTHING_INTEGRATION_SOLUTION.md
```

**为什么这样做？**
- ✅ 避免重复踩坑
- ✅ 新成员快速上手
- ✅ 技术决策可追溯
- ✅ 形成团队知识资产
