# 民乐音频管线重写：HTMLAudioElement → AudioContext + AudioBuffer

> **状态：✅ 已启用** — 彻底重写音频加载与播放管线，使用 Web Audio API 的 AudioBuffer 替代 HTMLAudioElement，消除琴键延迟和无声问题。

## 1. 问题描述

### 用户现象

- 进入民乐弹奏页面后，进度条显示 100% 但部分琴键按下无声音
- 能发声的琴键也有明显延迟（100-300ms），手感差
- 试听按钮点击后偶尔无反应
- 等待一段时间后所有琴键恢复正常，说明是加载/解码时序问题

### 业务影响

- 民乐演奏是核心功能，延迟和无声直接破坏用户体验
- 用户无法信任进度条——显示完成但实际不可用
- 问题在慢网络和低端设备上更严重

## 2. 根本原因分析

### 问题 1：HTMLAudioElement 的解码延迟不可控

之前的方案用 `resourceLoader` 创建 `HTMLAudioElement` 并等待 `canplaythrough` 事件来"预热" URL。但 `canplaythrough` 只表示浏览器认为可以开始播放，不代表音频数据已完全解码到内存。首次调用 `audio.play()` 时，浏览器仍需从磁盘缓存读取 + 解码 WAV 数据，产生 100-300ms 延迟。

```tsx
// 旧方案：resourceLoader 预热的是 URL 缓存，不是解码后的 PCM 数据
function doLoad(item: QueueItem): Promise<void> {
  const audio = new Audio();
  audio.src = item.url;
  audio.load();
  // canplaythrough 触发 ≠ 音频已解码到内存
  audio.addEventListener('canplaythrough', () => finish(true));
}
```

### 问题 2：音频池创建时重新 new Audio 导致缓存失效

`resourceLoader` 预热了 URL 并保存了 warm 的 `HTMLAudioElement`，但 `createAudioPool` 又 `new Audio(url)` 创建全新元素。新元素需要重新从浏览器缓存读取 + 解码，warm 元素的预热成果被浪费。

```tsx
// 旧方案：预热的 Audio 元素没被复用
const entries = notes.map((noteKey) => {
  const audios = Array.from({ length: AUDIO_POOL_SIZE }, () => {
    const audio = new Audio(noteKey.url);  // 全新元素，需重新解码
    audio.preload = 'auto';
    return audio;
  });
  return [noteKey.label, audios] as const;
});
```

### 问题 3：并行解码超时导致部分琴键不可用

后续修复尝试在 `createAudioPool` 中对每个池元素 `load()` + 等 `canplaythrough`，但 `Promise.all` 并行发起几十个解码请求，浏览器解码线程饱和，部分被 2 秒超时截断。这些半成品元素进入池子，`play()` 静默失败。

### 问题 4：进度条与实际可用性脱节

进度条追踪的是 `resourceLoader` 的 URL 下载完成数，而非音频解码完成数。URL 下载完 ≠ 解码完 ≠ 可播放，导致进度条 100% 但琴键无声。

### 问题 5：预览和演奏采样竞争带宽

预览采样（5 个 loop 文件）和演奏采样（100+ one-shot 文件）同时加载，互相抢占浏览器的 6 个并发连接。预览采样还走独立的 `primeAudioElement` 路径，不受 `resourceLoader` 队列控制。

## 3. 解决方案

### 3.1 核心改造：fetch + decodeAudioData

彻底抛弃 `HTMLAudioElement` 作为预加载和播放载体，改用 Web Audio API：

```
fetch(url)                    → ArrayBuffer（原始字节）
AudioContext.decodeAudioData  → AudioBuffer（已解码的 PCM 数据，在内存中）
createBufferSource().start()  → 即时播放，零延迟
```

`AudioBuffer` 是已解码的 PCM 浮点数组，存在 JavaScript 堆内存中，不依赖浏览器的媒体解码管线。`start()` 调用时直接将 PCM 数据送入音频输出，延迟接近 0。

### 3.2 resourceLoader 重写


| 对比项 | 旧方案（HTMLAudioElement） | 新方案（AudioBuffer） |
|--------|---------------------------|----------------------|
| 下载方式 | `new Audio(); audio.src=url; audio.load()` | `fetch(url) → arrayBuffer()` |
| 解码方式 | 浏览器内部媒体管线，时机不可控 | `AudioContext.decodeAudioData()`，显式完成 |
| 缓存形式 | 浏览器 HTTP 缓存 + Audio 元素引用 | `Map<string, AudioBuffer>`，PCM 在 JS 堆中 |
| 播放方式 | `audio.currentTime=0; audio.play()` | `createBufferSource().start(0)` |
| 播放延迟 | 100-300ms（需从缓存读取 + 解码） | ~0ms（PCM 已在内存） |
| 并发控制 | 受浏览器连接数限制 | `fetch` 同样受限，但解码在 `decodeAudioData` 中一次完成 |
| 进度语义 | URL 下载完 ≠ 可播放 | `decodeAudioData` 完成 = 可播放 |

新的 `resourceLoader.ts` 核心流程：

```tsx
async function doLoad(item: QueueItem): Promise<void> {
  const ctx = getAudioContext();
  const response = await fetch(item.url);
  const arrayBuffer = await response.arrayBuffer();
  const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
  bufferCache.set(item.url, audioBuffer);  // 解码完成，存入缓存
  item.resolve();
}
```

队列系统保持不变：高优先级并发 6、低优先级并发 2、失败重试 2 次、URL 去重、优先级提升。

### 3.3 InstrumentPlayer 播放改造

演奏不再维护 `HTMLAudioElement[]` 音频池，改为 `Map<string, AudioBuffer>`：

```tsx
// 播放：从 BufferMap 取出 AudioBuffer，创建一次性 source 节点
const playNote = (nk: NoteKey) => {
  const buffer = bufferMapRef.current.get(nk.label);
  if (!buffer) return;
  const ctx = getAudioContext();
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  source.playbackRate.value = nk.playbackRate ?? 1;
  source.connect(gainNodeRef.current);  // GainNode 控制音量
  source.start(0);  // 零延迟
};
```

`AudioBufferSourceNode` 是一次性的（用完即弃），天然支持快速连击——每次按键创建新 source，不存在"找空闲元素"的问题。

音量控制通过共享的 `GainNode` 实现，不再逐个设置 `audio.volume`。

### 3.4 预览采样同步改造

试听也从 `HTMLAudioElement.play()` 改为 `AudioBuffer` + `createBufferSource()`：

```tsx
function playPreviewBuffer(url: string): AudioBufferSourceNode | null {
  const buffer = getAudioBuffer(url);
  if (!buffer) return null;
  const ctx = getAudioContext();
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  source.connect(ctx.destination);
  source.start(0);
  return source;
}
```

停止播放通过 `source.stop()` 实现。

### 3.5 加载时序优化

```
用户登录（AppLayout）
    │
    ▼ 立即
preloadPlayableInstrumentSamples('low')  ← 后台预加载所有民乐采样
    │
    │  用户进入民乐页面（ChineseInstruments）
    │      │
    │      ▼ 立即
    │  preloadPreviewSamples('high')  ← 5 个预览文件，高优先级插队
    │      │
    │      ▼ 预览完成
    │  preloadPlayableInstrumentSamples('low')  ← 继续后台加载（URL 去重，不重复）
    │
    │  用户 hover "弹奏"按钮
    │      │
    │      ▼
    │  preloadPlayableInstrumentSamples(instId, 'high')  ← 该乐器提升为高优先级
    │
    │  用户点击"弹奏"
    │      │
    │      ▼
    │  loadBufferMapWithProgress('high', onProgress)
    │      │
    │      ├── bufferMapCache 命中？ → 立即 isReady=true
    │      └── 未命中 → 高优先级加载 + 进度条
    │              │
    │              ▼ 每个 URL 的 decodeAudioData 完成
    │          onProgress({ loaded, total })
    │              │
    │              ▼ 全部完成
    │          isReady=true → 琴键可用 → 零延迟播放
```

关键改进：
- 登录后立即开始后台预加载，不等用户进入民乐页面
- 预览采样高优先级先加载（只有 5 个文件），完成后才开始演奏采样
- hover 弹奏按钮时提升该乐器为高优先级（利用 hover → click 的 200-500ms 窗口）
- 进度条走完 = `decodeAudioData` 全部完成 = `AudioBuffer` 在内存中 = 立即可演奏

### 3.6 进度条语义修正

旧方案进度条追踪 URL 下载完成数，新方案追踪 `decodeAudioData` 完成数。进度条 100% 时所有 `AudioBuffer` 已在 JS 堆内存中，`playNote` 一定能取到 buffer 并立即发声。不再存在"进度条满了但琴键无声"的问题。

## 4. 涉及文件

| 文件 | 变更说明 |
|------|----------|
| `src/services/resourceLoader.ts` | **重写** — HTMLAudioElement → fetch + decodeAudioData + AudioBuffer 缓存 |
| `src/components/modes/InstrumentPlayer.tsx` | 音频池 → BufferMap，playNote 用 createBufferSource，GainNode 控制音量 |
| `src/components/modes/ChineseInstruments.tsx` | 预览改用 AudioBuffer 播放，移除 HTMLAudioElement 相关代码 |
| `src/components/layout/AppLayout.tsx` | 登录后立即后台预加载所有民乐采样 |
| `src/components/modes/FreeLab.tsx` | 移除冗余的民乐采样预加载（已由 AppLayout 统一处理） |

## 5. 测试验证

1. 登录后等待 10 秒，进入民乐 → 弹奏任意乐器 → 应无进度条，所有琴键立即发声
2. 登录后立即进入民乐 → 弹奏 → 应显示进度条，走完后所有琴键立即发声，无延迟
3. 快速连击同一琴键 → 每次都应发声，不丢音
4. 切换 Long/Short 发音 → 缓存命中时无进度条，未缓存时显示进度条
5. 试听按钮 → 采样未加载时按钮禁用，加载完后点击立即播放
6. 弱网模拟（Chrome DevTools → Network → Slow 3G）→ 进度条正常推进，走完后琴键可用
7. iOS Safari → 首次触摸后 AudioContext resume，后续播放正常

## 6. 架构决策记录

### 为什么用 AudioBuffer 而不是继续优化 HTMLAudioElement？

`HTMLAudioElement` 的解码时机由浏览器内部媒体管线控制，JavaScript 无法干预。即使 `readyState === HAVE_ENOUGH_DATA`，首次 `play()` 仍可能触发内部解码。`AudioBuffer` 通过 `decodeAudioData` 显式完成解码，解码完成后 PCM 数据在 JS 堆中，播放时不再有任何 I/O 或解码开销。

### AudioBuffer 的内存开销可接受吗？

WAV 采样解码后的 PCM 大小 ≈ 采样率 × 位深 × 声道数 × 时长。以 44.1kHz / 16bit / mono / 2s 的 one-shot 为例，约 176KB/个。6 个乐器 × 平均 15 个音符 ≈ 90 个采样 ≈ 16MB。对现代设备完全可接受。

### 为什么不用 AudioWorklet？

AudioWorklet 适合实时音频处理（合成器、效果器），对于采样回放场景 `createBufferSource` 已是最优解，且兼容性更好。

### 为什么在 AppLayout 而不是 Service Worker 中预加载？

Service Worker 缓存的是 HTTP 响应，仍需 `decodeAudioData` 解码。在 AppLayout 中预加载直接产出 `AudioBuffer`，用户进入民乐页面时已是解码后的 PCM，零额外开销。

---

**修复日期**：2026-04-07
**修复人员**：Andy, Kiro
**问题严重程度**：高（核心功能不可用）
**修复状态**：✅ 已完成并验证
