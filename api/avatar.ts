import type { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * 头像代理 — 将 dicebear API 搬到后端
 *
 * GET /api/avatar?seed=xxx
 *
 * 后端请求 dicebear，缓存 7 天返回给前端。
 * 前端不再直接访问外部域名，解决国内网络不稳定问题。
 */
export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  const seed = (req.query.seed as string) || 'JinBot';
  const url = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(seed)}`;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const upstream = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);

    if (!upstream.ok) {
      res.setHeader('Content-Type', 'image/svg+xml');
      res.setHeader('Cache-Control', 'public, max-age=86400');
      res.status(200).send(fallbackSvg(seed));
      return;
    }

    const svg = await upstream.text();

    res.setHeader('Content-Type', 'image/svg+xml');
    res.setHeader('Cache-Control', 'public, max-age=604800, s-maxage=604800');
    res.status(200).send(svg);
  } catch {
    // 上游不可达 → 返回简单的字母头像 SVG
    res.setHeader('Content-Type', 'image/svg+xml');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.status(200).send(fallbackSvg(seed));
  }
}

/** 生成一个简单的字母头像 SVG 作为兜底 */
function fallbackSvg(seed: string): string {
  const letter = (seed[0] || 'U').toUpperCase();
  const colors = ['#5BA4F5', '#F57EB6', '#F5A05B', '#5BCC8A', '#F5C85B'];
  const bg = colors[seed.charCodeAt(0) % colors.length];
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">
  <rect width="64" height="64" rx="14" fill="${bg}"/>
  <text x="32" y="38" text-anchor="middle" font-family="sans-serif" font-size="28" font-weight="bold" fill="white">${letter}</text>
</svg>`;
}
