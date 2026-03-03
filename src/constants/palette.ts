export const PALETTE = {
  blue:   { bg: '#E8F4FF', accent: '#5BA4F5' },
  pink:   { bg: '#FFE8F4', accent: '#F57EB6' },
  orange: { bg: '#FFF0E8', accent: '#F5A05B' },
  green:  { bg: '#E8FFF0', accent: '#5BCC8A' },
  yellow: { bg: '#FFFBE8', accent: '#F5C85B' },
} as const;

export type PaletteKey = keyof typeof PALETTE;
export type PaletteColor = typeof PALETTE[PaletteKey];
