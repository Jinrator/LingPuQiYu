import { PALETTE } from '../constants/palette';

const COLORS = [
  PALETTE.blue.accent,
  PALETTE.pink.accent,
  PALETTE.orange.accent,
  PALETTE.green.accent,
  PALETTE.yellow.accent,
];

/**
 * 根据 seed 生成一个字母头像的 data URI（SVG）
 * 纯前端，零网络请求，替代 dicebear 外部服务
 */
export function generateAvatarUrl(seed: string): string {
  const letter = (seed[0] || 'U').toUpperCase();
  const bg = COLORS[hashCode(seed) % COLORS.length];
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64"><rect width="64" height="64" rx="14" fill="${bg}"/><text x="32" y="40" text-anchor="middle" font-family="sans-serif" font-size="28" font-weight="bold" fill="white">${letter}</text></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

function hashCode(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}
