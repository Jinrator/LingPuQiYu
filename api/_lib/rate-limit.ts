import type { VercelRequest } from '@vercel/node';

interface RateLimitBucket {
  hits: number[];
  blockedUntil: number;
}

declare global {
  var __shenyinRateLimitStore: Map<string, RateLimitBucket> | undefined;
}

const rateLimitStore =
  globalThis.__shenyinRateLimitStore ?? new Map<string, RateLimitBucket>();

if (!globalThis.__shenyinRateLimitStore) {
  globalThis.__shenyinRateLimitStore = rateLimitStore;
}

export interface RateLimitRule {
  scope: string;
  identifier: string;
  limit: number;
  windowMs: number;
  blockMs?: number;
  message?: string;
}

export class RateLimitError extends Error {
  status: number;
  retryAfterSeconds: number;

  constructor(message: string, retryAfterMs: number) {
    super(message);
    this.name = 'RateLimitError';
    this.status = 429;
    this.retryAfterSeconds = Math.max(1, Math.ceil(retryAfterMs / 1000));
  }
}

export function getClientIp(req: Pick<VercelRequest, 'headers' | 'socket'>): string {
  const forwarded = req.headers['x-forwarded-for'];
  const candidate = Array.isArray(forwarded) ? forwarded[0] : forwarded;
  return candidate?.split(',')[0]?.trim() || req.socket?.remoteAddress || 'unknown';
}

export function assertRateLimit(rule: RateLimitRule): void {
  if (!rule.identifier) {
    throw new Error(`速率限制规则 "${rule.scope}" 缺少 identifier`);
  }

  const now = Date.now();
  const key = `${rule.scope}:${rule.identifier}`;
  const existing = rateLimitStore.get(key);
  const bucket: RateLimitBucket = existing
    ? {
        hits: existing.hits.filter((hitAt) => now - hitAt < rule.windowMs),
        blockedUntil: existing.blockedUntil,
      }
    : { hits: [], blockedUntil: 0 };

  if (bucket.blockedUntil > now) {
    rateLimitStore.set(key, bucket);
    throw new RateLimitError(
      rule.message || '请求太频繁，请稍后再试',
      bucket.blockedUntil - now,
    );
  }

  if (bucket.hits.length >= rule.limit) {
    const retryAfterMs =
      rule.blockMs ?? Math.max(bucket.hits[0] + rule.windowMs - now, 1000);
    bucket.blockedUntil = now + retryAfterMs;
    rateLimitStore.set(key, bucket);
    throw new RateLimitError(rule.message || '请求太频繁，请稍后再试', retryAfterMs);
  }

  bucket.hits.push(now);
  bucket.blockedUntil = 0;
  rateLimitStore.set(key, bucket);
}

export function assertRateLimits(rules: RateLimitRule[]): void {
  for (const rule of rules) {
    assertRateLimit(rule);
  }
}
