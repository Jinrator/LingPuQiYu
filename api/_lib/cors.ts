import type { VercelRequest, VercelResponse } from '@vercel/node';

function getAllowedOrigins(): string[] {
  const raw = process.env.ALLOWED_ORIGINS;
  if (!raw) return [];
  return raw.split(',').map((s) => s.trim()).filter(Boolean);
}

function isProduction(): boolean {
  const env = process.env.VERCEL_ENV || process.env.NODE_ENV;
  return env === 'production';
}

export function setCorsHeaders(req: VercelRequest, res: VercelResponse): boolean {
  const origin = req.headers.origin as string | undefined;
  const allowed = getAllowedOrigins();

  if (isProduction() && allowed.length === 0) {
    throw new Error('生产环境必须配置 ALLOWED_ORIGINS');
  }

  if (origin) {
    // 开发环境未配置时放行所有，生产环境严格匹配白名单
    if (allowed.length === 0 || allowed.includes(origin)) {
      res.setHeader('Access-Control-Allow-Origin', origin);
    }
  }

  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Max-Age', '86400');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return true;
  }

  return false;
}
