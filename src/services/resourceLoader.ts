/**
 * 统一资源加载管理器
 *
 * 策略：
 * - 所有音频预加载通过此模块排队，控制并发
 * - 优先级：high（用户正在交互）> low（后台预热）
 * - 去重：同一 URL 不会重复加载
 * - 支持进度回调，驱动 UI 进度条
 */

const MAX_CONCURRENT_HIGH = 8;
const MAX_CONCURRENT_LOW = 3;
const PRIME_TIMEOUT_MS = 15000;
const MAX_RETRIES = 2;

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

/** 已完成加载的 URL 集合 */
const loadedUrls = new Set<string>();
/** 正在加载中的 URL -> Promise */
const pendingUrls = new Map<string, Promise<void>>();
/** 保持对预热 Audio 元素的引用，防止 GC 导致浏览器丢弃缓存 */
const warmAudioElements = new Map<string, HTMLAudioElement>();

/** URLs that failed to load (for retry logic) */
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

function doLoad(item: QueueItem): Promise<void> {
  return new Promise<void>((resolve) => {
    const audio = new Audio();
    audio.preload = 'auto';
    let settled = false;

    const finish = (success: boolean) => {
      if (settled) return;
      settled = true;
      audio.removeEventListener('canplaythrough', onReady);
      audio.removeEventListener('loadeddata', onReady);
      audio.removeEventListener('error', onError);

      if (success) {
        loadedUrls.add(item.url);
        failedUrls.delete(item.url);
        warmAudioElements.set(item.url, audio);
        item.resolve();
      } else if (item.retries < MAX_RETRIES) {
        // Retry: re-queue with incremented retry count
        item.retries++;
        (item.priority === 'high' ? highQueue : lowQueue).unshift(item);
        // Don't resolve the outer promise yet — it stays pending via pendingUrls
      } else {
        // Exhausted retries — mark as failed but resolve to unblock progress
        failedUrls.add(item.url);
        item.resolve();
      }
      resolve();
    };

    const onReady = () => finish(true);
    const onError = () => finish(false);

    audio.addEventListener('canplaythrough', onReady);
    audio.addEventListener('loadeddata', onReady);
    audio.addEventListener('error', onError);
    setTimeout(() => finish(false), PRIME_TIMEOUT_MS);

    audio.src = item.url;
    audio.load();
  });
}

// ── 公共 API ─────────────────────────────────────────────────────────────────

/**
 * 预热单个音频 URL（去重 + 排队）
 * 如果同一 URL 已在低优先级队列中，高优先级请求会将其提升
 */
export function preloadAudioUrl(url: string, priority: 'high' | 'low' = 'low'): Promise<void> {
  if (loadedUrls.has(url)) return Promise.resolve();

  // If previously failed, allow retry by clearing the failure flag
  if (failedUrls.has(url)) {
    failedUrls.delete(url);
  }

  const pending = pendingUrls.get(url);
  if (pending) {
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

/**
 * 批量预热音频 URL（无进度回调）
 */
export function preloadAudioUrls(urls: string[], priority: 'high' | 'low' = 'low'): Promise<void> {
  return Promise.all(urls.map(u => preloadAudioUrl(u, priority))).then(() => undefined);
}

/** 检查某个 URL 是否已加载完成 */
export function isAudioUrlLoaded(url: string): boolean {
  return loadedUrls.has(url);
}

/** 获取已预热的 Audio 元素（用于直接复用，避免重新解码） */
export function getWarmAudioElement(url: string): HTMLAudioElement | undefined {
  return warmAudioElements.get(url);
}

export interface PreloadProgress {
  loaded: number;
  total: number;
}

/**
 * 批量预热音频 URL，带进度回调
 * onProgress 在每个 URL 完成时调用，可用于驱动进度条
 */
export function preloadAudioUrlsWithProgress(
  urls: string[],
  priority: 'high' | 'low',
  onProgress: (p: PreloadProgress) => void,
): Promise<void> {
  const total = urls.length;
  if (total === 0) { onProgress({ loaded: 0, total: 0 }); return Promise.resolve(); }

  let loaded = 0;

  // 对每个 URL：如果已加载则立即计数，否则等待加载完成后计数
  const promises = urls.map(u => {
    if (loadedUrls.has(u)) {
      loaded++;
      return Promise.resolve();
    }
    return preloadAudioUrl(u, priority).then(() => { loaded++; onProgress({ loaded, total }); });
  });

  // 初始进度（已缓存的部分）
  onProgress({ loaded, total });
  if (loaded === total) return Promise.resolve();

  return Promise.all(promises).then(() => undefined);
}


