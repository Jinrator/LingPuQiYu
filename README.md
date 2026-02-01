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

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build

# 预览生产构建
npm run preview
```
