# 资源加载统一优化方案

> **状态：✅ 已启用** — 通过统一资源加载管理器、页面 chunk 预取、采样进度条等手段，消除页面切换卡顿和乐器演奏无声问题。

## 1. 问题描述

### 用户现象

- 点击"演出舞台"或"冒险模式"时，首次切换明显卡顿（白屏 + loading spinner）
- 进入民族乐器弹奏模式后，点击琴键没有声音，用户不知道在等什么
- 多个页面同时预加载音频采样，互相抢占带宽，导致整体加载缓慢
- 字体从 Google Fonts CDN 加载，中国大陆访问不稳定，出现 FOUT（无样式文本闪烁）

### 业务影响

- 首次页面切换延迟 1-3 秒，用户感知为"卡死"
- 乐器弹奏无声严重影响核心功能体验
- 音频采样无并发控制，慢网络下页面长时间无响应

## 2. 根本原因分析

### 问题 1：页面 chunk 未预取

`AppLayout` 使用 `React.lazy` 做代码分割，但没有任何预加载策略。用户登录后默认在 `/lab`，Stage（20KB gzip）和 Adventure（15KB gzip）的 JS chunk 完全没有下载，首次点击时才开始下载 → spinner → 卡顿。

### 问题 2：音频预加载无并发控制

改动前，`ChineseInstruments` 和 `FreeLab` 各自独立调用 `preloadPlayableInstrumentSamples()`，每个音符创建 3 个 `HTMLAudioElement` 并立即 `.load()`。6 个乐器 × 5-30 个音符 × 3 = 数百个并发请求，浏览器网络队列被塞满，关键资源（页面 JS、CSS）也被阻塞。

```tsx
// 改动前：InstrumentPlayer.tsx — 每个音符 3 个并发请求，无排队
const AUDIO_POOL_SIZE = 3;
async function createAudioPool(notes: NoteKey[]) {
  const entries = await Promise.all(notes.map(async (noteKey) => {
    const audios = Array.from({ length: AUDIO_POOL_SIZE }, () => {
      const audio = new Audio(noteKey.url);
      audio.preload = 'auto';
      audio.load(); // 立即发起请求
      return audio;
    });
    await primeAudioElement(audios[0]);
    return [noteKey.label, audios] as const;
  }));
  return new Map(entries);
}
```

### 问题 3：采样加载是 all-or-nothing

`createAudioPool` 先 `await` 所有 URL 全部加载完，然后才创建 `HTMLAudioElement` 赋给 `audioPoolRef`。在此之前 `playNote` 拿到的 `audios` 是空 Map，按键完全无声，且没有任何 UI 反馈。

### 问题 4：低优先级任务无法被提升

后台预加载将所有 URL 放入低优先级队列（并发 2），当用户点击"弹奏"时，高优先级请求只是复用了已有的低优先级 Promise，无法加速。URL 可能排在队列末尾，等待前面几十个 URL 完成。

### 问题 5：重复代码与缓存缺失

- `primeAudioElement()` 在 `ChineseInstruments.tsx` 和 `InstrumentPlayer.tsx` 中各有一份完全相同的实现
- `FreeLab` 挂载时就预加载全部民族乐器采样，即使用户可能根本不会切到该 tab
- StageMode 的 ID3 元数据（每首歌 512KB，7 首 = 3.5MB）每次组件挂载都重新 fetch

### 问题 6：字体外部依赖

`index.html` 从 Google Fonts CDN 加载 Fredoka One 和 Quicksand，但 `package.json` 中已安装 `@fontsource/fredoka-one` 和 `@fontsource/quicksand` 却从未使用。中国大陆访问 Google CDN 不稳定。

## 3. 解决方案

### 3.1 新增统一资源加载管理器

新建 `src/services/resourceLoader.ts`，所有音频预加载通过此模块排队：

| 特性 | 说明 |
|------|------|
| 优先级队列 | `high`（用户交互，并发 6）> `low`（后台预热，并发 2） |
| URL 级去重 | 同一 URL 不会重复下载，`pendingUrls` Map 保证 |
| 优先级提升 | 低优先级队列中的 URL 被高优先级请求时，自动从 `lowQueue` 移到 `highQueue` |
| 进度回调 | `preloadAudioUrlsWithProgress()` 每完成一个 URL 触发回调，驱动 UI 进度条 |
| GC 防护 | `warmAudioElements` Map 保持对预热 Audio 元素的引用，防止浏览器丢弃缓存 |
| 超时保护 | 单个 URL 加载超过 8 秒自动跳过，不阻塞队列 |

```
用户点击"弹奏"
    │
    ▼
loadAudioPoolWithProgress()
    │
    ├── audioPoolCache 命中？ → 立即返回，isReady=true，无感知
    │
    └── 未命中 → createAudioPool('high', onProgress)
                    │
                    ▼
              preloadAudioUrlsWithProgress()
                    │
                    ├── URL 已在 loadedUrls → loaded++ 立即计入
                    ├── URL 在 lowQueue 中 → 提升到 highQueue
                    └── URL 全新 → 加入 highQueue
                    │
                    ▼
              每个 URL 完成 → onProgress({ loaded, total })
                    │
                    ▼
              全部完成 → 创建 HTMLAudioElement → isReady=true
```

### 3.2 乐器演奏页加载进度条

`InstrumentPlayer` 新增 `isReady` 和 `loadProgress` 状态：

- 加载中：显示带百分比的进度条（使用乐器对应的 PALETTE 强调色），琴键区域 `opacity-40 + pointer-events-none` 禁用
- `playNote` 内部 `if (!isReady) return` 兜底
- 切换 Long/Short 发音时，如果缓存已存在则同步设置 `isReady=true`，不闪烁

### 3.3 页面 chunk 空闲预取

`AppLayout` 登录后通过 `requestIdleCallback` 分批预取其他页面：

```tsx
let prefetchStarted = false;
function prefetchPageChunks() {
  if (prefetchStarted) return;
  prefetchStarted = true;
  const idle = (fn: () => void) => {
    if ('requestIdleCallback' in window) {
      (window as any).requestIdleCallback(fn, { timeout: 5000 });
    } else {
      setTimeout(fn, 2000);
    }
  };
  idle(() => {
    void import('../../pages/Stage');
    setTimeout(() => void import('../../pages/Adventure'), 1000);
    setTimeout(() => void import('../../pages/Profile'), 2000);
  });
}
```

间隔 1 秒分批，避免同时发起多个请求抢占带宽。

### 3.4 采样预加载策略调整

| 场景 | 改动前 | 改动后 |
|------|--------|--------|
| FreeLab 挂载 | 3 秒后预加载全部民族乐器采样 | 不再预加载，由 ChineseInstruments 按需触发 |
| ChineseInstruments 挂载 | 500ms 后同时预加载预览 + 可演奏采样 | 300ms 后预览（低优先级），2s 后可演奏（requestIdleCallback + 低优先级） |
| 用户点击"弹奏" | 高优先级加载，但无进度反馈 | 高优先级加载 + 进度条 + 琴键禁用直到完成 |
| 音频池大小 | 每音符 3 个 HTMLAudioElement | 每音符 2 个（足够支持快速连击） |

### 3.5 其他优化

- **字体自托管**：移除 `index.html` 中的 Google Fonts CDN 链接，改为在 `src/index.tsx` 中 `import '@fontsource/fredoka-one'` 和 `@fontsource/quicksand`
- **ID3 缓存**：StageMode 新增 `id3Cache` Map，避免重复 fetch 512KB/首的元数据
- **死代码清理**：移除未使用的 `SOLFEGE` 常量、`primeAudioElement` 和 `isAudioLoaded` 导出

## 4. 涉及文件

| 文件 | 变更说明 |
|------|----------|
| `src/services/resourceLoader.ts` | **新增** 统一资源加载管理器 |
| `src/components/modes/InstrumentPlayer.tsx` | 音频池改用 resourceLoader，新增进度条 + isReady 状态 |
| `src/components/modes/ChineseInstruments.tsx` | 移除重复的 primeAudioElement，预加载走 resourceLoader |
| `src/components/modes/FreeLab.tsx` | 移除多余的全量采样预加载 |
| `src/components/modes/StageMode.tsx` | ID3 元数据加缓存 |
| `src/components/layout/AppLayout.tsx` | 新增页面 chunk 空闲预取 |
| `src/contexts/i18n.ts` | 新增 `lab.cnInst.loading` / `lab.cnInst.loadingSamples` 翻译 |
| `index.html` | 移除 Google Fonts CDN |
| `src/index.tsx` | 新增 @fontsource 字体导入 |

## 5. 测试验证

1. 登录后等待 3 秒，切换到"演出舞台" → 应无 loading spinner，瞬间切换
2. 切换到"冒险模式" → 同上
3. 进入自由工坊 → 民族乐器 tab → 点击任意乐器"弹奏" → 应显示进度条，加载完成后琴键亮起可弹奏
4. 弹奏页面快速连击同一个键 → 应正常发声不中断
5. 切换 Long/Short 发音（葫芦丝/箫）→ 如果后台已预加载，应无进度条直接可弹
6. 刷新页面后重复步骤 3 → ID3 封面应立即显示（缓存命中）
7. 检查 Network 面板 → 音频请求并发数不超过 6（high）或 2（low）

## 6. 架构决策记录

### 为什么不用 Service Worker 缓存音频？

Service Worker 缓存适合静态资源版本化场景，但本项目的 wav 采样文件数量多（100+）、体积大、且不常更新。浏览器 HTTP 缓存 + `warmAudioElements` 引用保持已经足够，引入 SW 增加复杂度但收益有限。

### 为什么 AUDIO_POOL_SIZE 从 3 降到 2？

3 个 HTMLAudioElement/音符意味着 6 个乐器 × 平均 15 个音符 × 3 = 270 个元素。降到 2 后减少 1/3 内存占用，实测快速连击场景下 2 个已足够（一个播放中、一个空闲可复用）。

### 为什么低优先级并发只有 2？

低优先级是后台预热，不应影响用户当前交互。2 个并发足以在用户浏览乐器列表的 10-20 秒内完成大部分预加载，同时为页面渲染、API 请求等留出带宽。

---

**修复日期**：2026-04-04
**修复人员**：Andy, Claude Sonnet 4
**问题严重程度**：高（影响核心功能可用性）
**修复状态**：✅ 已完成并验证
