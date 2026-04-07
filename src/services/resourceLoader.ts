/**
 * 统一资源加载管理器
 *
 * 策略：
 * - 所有音频通过此模块排队加载，控制并发
 * - 优先级：high（用户正在交互）> low（后台预热）
 * - 去重：同一 URL 不会重复加载
 * - 支持进度回调，驱动 UI 进度条
 * - 使用 fetch + AudioContext.decodeAudioData 预解码为 AudioBuffer
 *   播放时 createBufferSource().start() 零延迟
 */

const MAX_CONCURRENT_HIGH = 6;
const MAX_CONCURRENT_LOW = 2;
const MAX_RETRIES = 2;

// ── AudioContext 单例 ────────────────────────────────────────────────────────

let _audioCtx: AudioContext | null = null;

export function getAudioContext(): AudioContext {
  if (!_audioCtx) {
    _audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  // Safari 需要 resume
  if (_audioCtx.state === 'suspended') {
    _audioCtx.resume().catch(() => {});
  }
  return _audioCtx;
}

/** 确保 AudioContext 在用户交互后 resume（iOS Safari 要求） */
export function resumeAudioContext(): void {
  if (_audioCtx && _audioCtx.state === 'suspended') {
    _audioCtx.resume().catch(() => {});
  }
}

// ── 队列系统 ─────────────────────────────────────────────────────────────────

interface QueueItem {
  url: string;
  resolve: () => void;
  reject: (err: Error) => void;
  priority: 'high' | 'low';
  retries: number;
}

let activeHigh = 0;
let activeLow = 0;
const highQueue: QueueItem[] = [];
const lowQueue: QueueItem[] = [];

/** 已解码的 AudioBuffer 缓存 */
const bufferCache = new Map<string, AudioBuffer>();
/** 正在加载中的 URL -> Promise */
const pendingUrls = new Map<string, Promise<void>>();
/** 加载失败的 URL */
const failedUrls = new Set<string>();

function processQueue() {
  while (highQueue.length > 0 && activeHigh < MAX_CONCURRENT_HIGH) {
    const item = highQueue.shift()!;
    activeHigh++;
    doLoad(item).finally(() => { activeHigh--; processQueue(); });
  }
  while (lowQueue.length > 0 && activeLow < MAX_CONCURRENT_LOW && activeHigh < MAX_CONCURRENT_HIGH) {
    const item = lowQueue.shift()!;
    activeLow++;
    doLoad(item).finally(() => { activeLow--; processQueue(); });
  }
}

async function doLoad(item: QueueItem): Promise<void> {
  try {
    const ctx = getAudioContext();
    const response = await fetch(item.url);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const arrayBuffer = await response.arrayBuffer();
    const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
    bufferCache.set(item.url, audioBuffer);
    failedUrls.delete(item.url);
    item.resolve();
  } catch {
    if (item.retries < MAX_RETRIES) {
      item.retries++;
      (item.priority === 'high' ? highQueue : lowQueue).unshift(item);
    } else {
      failedUrls.add(item.url);
      item.resolve(); // 不阻塞进度
    }
  }
}

// ── 公共 API ─────────────────────────────────────────────────────────────────

/**
 * 预加载单个音频 URL → AudioBuffer（去重 + 排队）
 */
export function preloadAudioUrl(url: string, priority: 'high' | 'low' = 'low'): Promise<void> {
  if (bufferCache.has(url)) return Promise.resolve();

  if (failedUrls.has(url)) failedUrls.delete(url);

  const pending = pendingUrls.get(url);
  if (pending) {
    // 提升优先级
    if (priority === 'high') {
      const idx = lowQueue.findIndex(item => item.url === url);
      if (idx !== -1) {
        const [item] = lowQueue.splice(idx, 1);
        item.priority = 'high';
        highQueue.push(item);
        processQueue();
      }
    }
    return pending;
  }

  const promise = new Promise<void>((resolve, reject) => {
    const item: QueueItem = { url, resolve, reject, priority, retries: 0 };
    (priority === 'high' ? highQueue : lowQueue).push(item);
    processQueue();
  });

  pendingUrls.set(url, promise);
  promise.finally(() => pendingUrls.delete(url));
  return promise;
}

/** 批量预加载（无进度） */
export function preloadAudioUrls(urls: string[], priority: 'high' | 'low' = 'low'): Promise<void> {
  return Promise.all(urls.map(u => preloadAudioUrl(u, priority))).then(() => undefined);
}

/** 获取已解码的 AudioBuffer */
export function getAudioBuffer(url: string): AudioBuffer | undefined {
  return bufferCache.get(url);
}

/** 检查是否已加载 */
export function isAudioUrlLoaded(url: string): boolean {
  return bufferCache.has(url);
}

export interface PreloadProgress {
  loaded: number;
  total: number;
}

/** 批量预加载，带进度回调 */
export function preloadAudioUrlsWithProgress(
  urls: string[],
  priority: 'high' | 'low',
  onProgress: (p: PreloadProgress) => void,
): Promise<void> {
  const total = urls.length;
  if (total === 0) { onProgress({ loaded: 0, total: 0 }); return Promise.resolve(); }

  let loaded = 0;

  const promises = urls.map(u => {
    if (bufferCache.has(u)) {
      loaded++;
      return Promise.resolve();
    }
    return preloadAudioUrl(u, priority).then(() => { loaded++; onProgress({ loaded, total }); });
  });

  onProgress({ loaded, total });
  if (loaded === total) return Promise.resolve();

  return Promise.all(promises).then(() => undefined);
}
