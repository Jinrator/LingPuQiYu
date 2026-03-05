# 生音科技 · 设计规范

## 核心原则

专业但有温度，克制但有活力。对标现代教育平台的设计语言——功能清晰、视觉干净、用彩色点缀传递学习的愉悦感。适合全年龄段用户，不走儿童化也不走冷峻企业风。

---

## 色彩系统

### 主色板（Palette）

不使用渐变色。用以下马卡龙色系做点缀，白色为主背景。

| 名称 | 背景色 | 强调色 | 用途 |
|------|--------|--------|------|
| 蓝 (Blue) | `#E8F4FF` | `#5BA4F5` | 主强调、CTA、信息 |
| 粉 (Pink) | `#FFE8F4` | `#F57EB6` | 艺术类、次级标签 |
| 橙 (Orange) | `#FFF0E8` | `#F5A05B` | 创作类、警示 |
| 绿 (Green) | `#E8FFF0` | `#5BCC8A` | 成功、在线状态 |
| 黄 (Yellow) | `#FFFBE8` | `#F5C85B` | 提示、徽章 |

```ts
// 统一从 src/constants/palette.ts 引入
import { PALETTE } from '@/constants/palette';
// 或相对路径
import { PALETTE } from '../../constants/palette';

export const PALETTE = {
  blue:   { bg: '#E8F4FF', accent: '#5BA4F5' },
  pink:   { bg: '#FFE8F4', accent: '#F57EB6' },
  orange: { bg: '#FFF0E8', accent: '#F5A05B' },
  green:  { bg: '#E8FFF0', accent: '#5BCC8A' },
  yellow: { bg: '#FFFBE8', accent: '#F5C85B' },
} as const;
```

### 背景色
| 用途 | 色值 |
|------|------|
| 页面背景 | `#F5F7FA` |
| 主卡片/面板 | `#FFFFFF` |
| 品牌侧面板 | `#F0F4FF`（蓝调浅色） |
| 输入框背景 | `#FFFFFF` |
| 次级区域背景 | `#F8FAFC` |

### 文字色
| 层级 | 色值 |
|------|------|
| 主标题 | `#1E293B`（slate-800） |
| 正文 | `#475569`（slate-600） |
| 辅助说明 | `#94A3B8`（slate-400） |
| 占位符 | `#CBD5E1`（slate-300） |
| 极弱提示 | `#E2E8F0`（slate-200） |

### 边框色
- 通用边框：`#E2E8F0`（slate-200）
- 输入框默认：`border-slate-200`
- 输入框 focus：`border-[#5BA4F5]` + `ring-2 ring-[#5BA4F5]/10`
- 彩色卡片边框：`accent + '33'`（对应强调色加 20% 透明度）

---

## 排版

### 字体
- 品牌 Logo：`font-fredoka`（仅限 Logo，不用于正文）
- 正文 / UI：系统默认 sans-serif（Quicksand 作为 body 字体）
- 标签 / 徽章：`text-[10px] font-semibold uppercase tracking-widest`

### 字号层级
| 层级 | 类名 | 用途 |
|------|------|------|
| 超大标题 | `text-5xl font-black leading-[1.1] tracking-tight` | 品牌大字、页面主标题 |
| 大标题 | `text-xl font-bold tracking-tight` | 卡片标题、模块标题 |
| 分区标题 | `text-sm font-bold tracking-tight text-slate-700` | 内容分区标题（如"推荐歌单"、"热门排行"、"最新发布"） |
| 正文 | `text-sm font-medium` | 说明文字、表单标签 |
| 小字 | `text-xs font-semibold` | 按钮文字、辅助说明 |
| 极小字 | `text-[10px] font-semibold uppercase tracking-widest` | 元数据标签、标识（如 "LV.12"、"PRO-9527"、阶段标签） |

> ⚠️ **分区标题 vs 极小字的区别**：`text-[10px] uppercase tracking-widest` 仅用于元数据标签和徽章（等级、编号、分类标识），不可用于内容分区标题。凡是标注一组内容的标题（歌单、排行、发布等），必须使用 `text-sm font-bold text-slate-700`。

### 标题彩色强调
大标题中的关键词可用 PALETTE 强调色点缀，不用渐变：
```tsx
<h2 className="font-black text-5xl text-slate-800">
  开启你的<br />
  <span style={{ color: PALETTE.blue.accent }}>音乐之旅</span>
</h2>
```

---

## 圆角规范

| 元素 | 圆角 |
|------|------|
| 页面级卡片/弹窗 | `rounded-2xl` |
| 内部子卡片、色块装饰 | `rounded-xl` ~ `rounded-3xl` |
| 输入框 | `rounded-xl` |
| 按钮（主要） | `rounded-xl` |
| 标签/气泡 | `rounded-full` |
| Logo 图标容器 | `rounded-lg` |

不使用 `rounded-[3rem]` 以上的超大圆角。

---

## 组件规范

### 输入框
```tsx
const inputCls = `w-full pl-11 pr-4 py-3.5 rounded-xl border text-sm font-medium outline-none transition-all
  bg-white border-slate-200 text-slate-800 placeholder:text-slate-300
  focus:border-[#5BA4F5] focus:ring-2 focus:ring-[#5BA4F5]/10`;
// 左侧图标：absolute left-4 top-1/2 -translate-y-1/2 text-slate-300，尺寸 size={15}
```

### 主按钮
```tsx
// 激活状态（深色，不用纯黑）
'bg-[#1e293b] text-white hover:opacity-90'
// 品牌色按钮（次主要操作）
style={{ background: PALETTE.blue.accent }} + 'text-white hover:opacity-90'
// 禁用状态
'bg-slate-200 text-slate-400 cursor-not-allowed opacity-40'
// 通用结构
'w-full py-3.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all'
```

### 次级/描边按钮
```tsx
'border border-slate-200 text-slate-600 hover:bg-slate-50 bg-white'
'py-3 rounded-xl text-xs font-semibold transition-all hover:scale-[1.02] active:scale-95'
```

### 彩色标签（Tag）
```tsx
<span className="px-3 py-1 rounded-full text-xs font-semibold border"
  style={{
    background: PALETTE.blue.bg,
    color: PALETTE.blue.accent,
    borderColor: PALETTE.blue.accent + '33'
  }}>
  标签文字
</span>
```

### 浮动数据气泡
白色卡片样式，带轻阴影，不用半透明黑色：
```tsx
'flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-slate-200 shadow-sm text-slate-600 text-xs font-semibold'
// 状态点
'w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse'  // 在线
style={{ background: PALETTE.blue.accent }}               // 信息
```

### 选项卡片（选择类）
```tsx
// 选中状态（用对应 PALETTE 颜色）
style={{ background: color.bg, borderColor: color.accent, color: color.accent }}
// 未选中状态
{ background: '#F8FAFC', borderColor: '#E2E8F0', color: '#94A3B8' }
// 通用结构
'flex flex-col items-center gap-2 p-3 rounded-xl border text-center transition-all hover:scale-[1.02]'
```

### 装饰色块（品牌面板背景装饰）
用彩色圆角色块叠放，模拟卡片堆叠感，增加视觉活力：
```tsx
<div className="absolute top-[-28px] right-[-28px] w-40 h-40 rounded-3xl rotate-12 opacity-70"
  style={{ background: PALETTE.blue.bg, border: `2px solid ${PALETTE.blue.accent}22` }} />
<div className="absolute top-[60px] right-[40px] w-24 h-24 rounded-2xl rotate-6 opacity-60"
  style={{ background: PALETTE.pink.bg, border: `2px solid ${PALETTE.pink.accent}22` }} />
```
规则：2~4 个色块，不同大小、轻微旋转、递减透明度，放在面板右侧角落。

---

## 布局规范

### 双栏卡片布局
- 左侧：品牌面板，`bg-[#F0F4FF]`，放品牌信息、大标题、装饰色块、浮动气泡、底部标签
- 右侧：内容面板，`bg-white`，放表单/操作区
- 比例：`grid-cols-[1.1fr_1fr]`
- 卡片固定高度：`h-[580px]`，避免内容变化导致跳动
- 卡片整体：`rounded-2xl shadow-xl border border-slate-200`

### 页面背景
```tsx
'bg-[#F5F7FA]'  // 统一用浅灰，不用纯白也不用深色
```

### 内容区 padding
- 主面板内边距：`px-10 py-10`
- 品牌面板内边距：`p-12`

---

## 动画规范

- 页面/卡片切换：`transition-all duration-500`
- 按钮交互：`hover:opacity-90`（主按钮）/ `hover:scale-[1.02] active:scale-95`（次级按钮/卡片）
- 状态点呼吸：`animate-pulse`（仅在线状态点使用）
- 加载状态：`<Loader2 className="animate-spin" />`
- 禁止使用 `animate-ping`、`animate-bounce` 作为常驻效果

---

## 图标规范

- 图标库：`lucide-react`，统一线性风格
- 表单内图标：`size={15}`，颜色 `text-slate-300`
- 按钮内图标：`size={16}`
- 装饰性图标：`size={18}` ~ `size={20}`
- 不使用 emoji 作为 UI 功能图标（课程内容标识可以用）

---

## 主题

当前统一使用亮色模式，不再维护双主题切换。组件不需要接收 `theme` prop 做暗色适配（历史组件可保留，新组件不新增）。

---

## 移动端适配规范

### 基础字号
移动端（`max-width: 639px`）全局基础字号设为 17px，防止 iOS Safari 自动缩放：
```css
@media (max-width: 639px) {
  html { font-size: 17px; }
}
html { -webkit-text-size-adjust: 100%; }
```

### 响应式策略
采用 mobile-first 写法，用 `sm:` 断点（640px）向上覆盖桌面样式：
```tsx
// ✅ 正确：先写移动端，sm: 覆盖桌面
'p-3.5 sm:p-4'
'gap-2 sm:gap-3'
'text-2xl sm:text-5xl'

// ❌ 错误：先写桌面再用 max-* 回退
'p-4 max-sm:p-3.5'
```

### 间距收紧
移动端统一收紧 padding 和 gap，避免内容过于松散：

| 元素 | 移动端 | 桌面端 |
|------|--------|--------|
| 卡片内边距 | `p-3.5` | `sm:p-4` ~ `sm:p-5` |
| 列表间距 | `gap-2` | `sm:gap-3` |
| 区块间距 | `space-y-4` | `sm:space-y-6` |
| 面板内边距 | `px-5 py-6` | `sm:px-10 sm:py-10` |

### 字号适配

| 元素 | 移动端 | 桌面端 |
|------|--------|--------|
| Hero 大标题 | `text-2xl` | `sm:text-5xl` |
| 卡片标题 | `text-sm` | `sm:text-base` |
| 正文 | `text-sm` | `text-sm`（不变） |
| 辅助说明 | `text-xs` | `text-xs`（不变） |

### 顶部导航栏（移动端）
- Logo：`w-8 h-8`
- 品牌文字：`text-base font-bold`
- 头像/退出图标：`w-9 h-9` / `size={18}`

### 底部导航栏（移动端）
- 标签文字：`text-xs`（不用 `text-[10px]`）
- 图标尺寸：`size={20}`
- 安全区域：`pb-[calc(0.625rem+env(safe-area-inset-bottom))]`

### 弹窗/底部抽屉
移动端弹窗从底部滑出，桌面端居中：
```tsx
// 容器
'items-end sm:items-center'
// 弹窗本体
'rounded-t-2xl sm:rounded-2xl'
// 宽度
'w-full sm:max-w-md'
```
