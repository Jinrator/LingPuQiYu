/**
 * 带超时 + 自动重试的 fetch 封装
 *
 * - 所有请求默认 15s 超时
 * - 网络错误 / 5xx 自动重试（指数退避）
 * - 4xx 不重试（业务错误，重试无意义）
 */

export interface FetchWithTimeoutOptions extends RequestInit {
  /** 超时毫秒数，默认 15000 */
  timeoutMs?: number;
  /** 最大重试次数（不含首次），默认 2 */
  maxRetries?: number;
  /** 基础退避毫秒数，默认 1000 */
  retryBaseMs?: number;
  /** 是否对该请求禁用重试，默认 false */
  noRetry?: boolean;
}

function isRetryable(status: number): boolean {
  return status >= 500 || status === 408 || status === 429;
}

function wait(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

export async function fetchWithTimeout(
  url: string,
  options: FetchWithTimeoutOptions = {},
): Promise<Response> {
  const {
    timeoutMs = 15_000,
    maxRetries = 2,
    retryBaseMs = 1_000,
    noRetry = false,
    signal: externalSignal,
    ...fetchInit
  } = options;

  let lastError: unknown;

  const attempts = noRetry ? 1 : maxRetries + 1;

  for (let attempt = 0; attempt < attempts; attempt++) {
    // 指数退避（首次不等待）
    if (attempt > 0) {
      const delay = retryBaseMs * Math.pow(2, attempt - 1);
      await wait(delay);
    }

    const controller = new AbortController();

    // 如果外部传了 signal，联动取消
    if (externalSignal) {
      if (externalSignal.aborted) {
        controller.abort(externalSignal.reason);
      } else {
        externalSignal.addEventListener('abort', () => controller.abort(externalSignal.reason), { once: true });
      }
    }

    const timer = setTimeout(() => controller.abort('timeout'), timeoutMs);

    try {
      const response = await fetch(url, { ...fetchInit, signal: controller.signal });
      clearTimeout(timer);

      // 可重试的服务端错误
      if (isRetryable(response.status) && attempt < attempts - 1) {
        lastError = new Error(`HTTP ${response.status}`);
        continue;
      }

      return response;
    } catch (err: any) {
      clearTimeout(timer);
      lastError = err;

      // 用户主动取消 → 不重试
      if (externalSignal?.aborted) throw err;

      // 超时或网络错误 → 继续重试
      if (attempt < attempts - 1) continue;

      // 最后一次也失败了
      if (err?.name === 'AbortError' || err?.message === 'timeout') {
        throw new Error('请求超时，请检查网络连接');
      }
      throw err;
    }
  }

  throw lastError;
}
