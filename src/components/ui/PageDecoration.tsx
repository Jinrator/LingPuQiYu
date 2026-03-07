import React from 'react';
import { Music, Headphones, Mic2, Music2, Music3, Music4, Piano, Disc3, Radio } from 'lucide-react';
import { PALETTE } from '../../constants/palette';

/**
 * Colorful music-symbol background decoration.
 * Uses lucide music icons in PALETTE accent colors with gentle rotation.
 */

interface DecoIcon {
  Icon: React.FC<any>;
  size: number;
  top: string;
  left: string;
  color: string;
  rotate: number;
  opacity: number;
}

const ICONS: DecoIcon[] = [
  // ── Top band ──
  { Icon: Music,      size: 110, top: '14%', left: '72%', color: PALETTE.blue.accent,   rotate: 12,  opacity: 0.14 },
  { Icon: Music2,     size: 44,  top: '12%', left: '88%', color: PALETTE.pink.accent,   rotate: -18, opacity: 0.12 },
  { Icon: Headphones, size: 64,  top: '22%', left: '80%', color: PALETTE.yellow.accent, rotate: 8,   opacity: 0.10 },
  { Icon: Music3,     size: 52,  top: '15%', left: '8%',  color: PALETTE.green.accent,  rotate: -15, opacity: 0.12 },
  { Icon: Mic2,       size: 36,  top: '20%', left: '24%', color: PALETTE.orange.accent, rotate: 6,   opacity: 0.10 },
  { Icon: Disc3,      size: 40,  top: '13%', left: '52%', color: PALETTE.pink.accent,   rotate: 0,   opacity: 0.09 },

  // ── Upper-mid ──
  { Icon: Radio,      size: 38,  top: '30%', left: '3%',  color: PALETTE.blue.accent,   rotate: -10, opacity: 0.10 },
  { Icon: Music4,     size: 48,  top: '34%', left: '18%', color: PALETTE.yellow.accent, rotate: 15,  opacity: 0.09 },
  { Icon: Music,      size: 44,  top: '28%', left: '60%', color: PALETTE.green.accent,  rotate: 25,  opacity: 0.08 },
  { Icon: Piano,      size: 32,  top: '32%', left: '92%', color: PALETTE.orange.accent, rotate: -8,  opacity: 0.09 },

  // ── Mid band ──
  { Icon: Headphones, size: 42,  top: '46%', left: '5%',  color: PALETTE.pink.accent,   rotate: -12, opacity: 0.10 },
  { Icon: Music2,     size: 56,  top: '44%', left: '40%', color: PALETTE.blue.accent,   rotate: 20,  opacity: 0.07 },
  { Icon: Mic2,       size: 58,  top: '48%', left: '84%', color: PALETTE.green.accent,  rotate: 18,  opacity: 0.11 },
  { Icon: Music3,     size: 30,  top: '50%', left: '68%', color: PALETTE.yellow.accent, rotate: -22, opacity: 0.08 },

  // ── Lower-mid ──
  { Icon: Music4,     size: 34,  top: '58%', left: '12%', color: PALETTE.blue.accent,   rotate: 20,  opacity: 0.09 },
  { Icon: Disc3,      size: 46,  top: '60%', left: '55%', color: PALETTE.orange.accent, rotate: 10,  opacity: 0.07 },
  { Icon: Music,      size: 36,  top: '62%', left: '90%', color: PALETTE.pink.accent,   rotate: -15, opacity: 0.08 },
  { Icon: Radio,      size: 28,  top: '56%', left: '34%', color: PALETTE.green.accent,  rotate: -5,  opacity: 0.07 },

  // ── Bottom band ──
  { Icon: Music,      size: 76,  top: '76%', left: '78%', color: PALETTE.orange.accent, rotate: -20, opacity: 0.10 },
  { Icon: Music3,     size: 38,  top: '82%', left: '90%', color: PALETTE.blue.accent,   rotate: 15,  opacity: 0.09 },
  { Icon: Music4,     size: 52,  top: '80%', left: '6%',  color: PALETTE.yellow.accent, rotate: -8,  opacity: 0.11 },
  { Icon: Headphones, size: 34,  top: '86%', left: '18%', color: PALETTE.pink.accent,   rotate: 22,  opacity: 0.08 },
  { Icon: Piano,      size: 40,  top: '78%', left: '45%', color: PALETTE.blue.accent,   rotate: 12,  opacity: 0.08 },
  { Icon: Mic2,       size: 30,  top: '88%', left: '62%', color: PALETTE.green.accent,  rotate: -18, opacity: 0.08 },
];

const PageDecoration: React.FC = () => (
  <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
    {ICONS.map((item, i) => (
      <item.Icon
        key={i}
        size={item.size}
        className="absolute"
        style={{
          top: item.top,
          left: item.left,
          color: item.color,
          opacity: item.opacity,
          transform: `rotate(${item.rotate}deg)`,
        }}
      />
    ))}
    {/* Staff lines hint — upper */}
    <div className="absolute right-[20%] top-[20%] w-[38%] hidden sm:flex flex-col gap-3 opacity-[0.10]">
      {[0,1,2,3,4].map(i => (
        <div key={i} className="h-px rounded-full" style={{ background: PALETTE.blue.accent }} />
      ))}
    </div>
    {/* Staff lines hint — lower */}
    <div className="absolute left-[10%] top-[65%] w-[32%] hidden sm:flex flex-col gap-3 opacity-[0.08]">
      {[0,1,2,3,4].map(i => (
        <div key={`b${i}`} className="h-px rounded-full" style={{ background: PALETTE.pink.accent }} />
      ))}
    </div>
  </div>
);

export default PageDecoration;
