import React, { useState, useRef, useCallback } from 'react';
import { Play, Square, Music2, Piano } from 'lucide-react';
import { PALETTE } from '../../constants/palette';
import { useSettings } from '../../contexts/SettingsContext';
import InstrumentPlayer, { PLAYABLE_IDS } from './InstrumentPlayer';

type Category = 'all' | 'strings' | 'woodwind';

interface Instrument {
  id: string;
  nameKey: string;
  descKey: string;
  category: 'strings' | 'woodwind';
  color: keyof typeof PALETTE;
  sampleUrl: string;
}

const INSTRUMENTS: Instrument[] = [
  { id: 'erhu', nameKey: 'lab.cnInst.erhu', descKey: 'lab.cnInst.erhu.desc', category: 'strings', color: 'pink', sampleUrl: '/samples/china/Loops/Strings/Erhu/120_Am_Erhu_01_541.wav' },
  { id: 'guqin', nameKey: 'lab.cnInst.guqin', descKey: 'lab.cnInst.guqin.desc', category: 'strings', color: 'blue', sampleUrl: '/samples/china/Loops/Strings/Guqin/120_F_Guqin_01_541.wav' },
  { id: 'pipa', nameKey: 'lab.cnInst.pipa', descKey: 'lab.cnInst.pipa.desc', category: 'strings', color: 'orange', sampleUrl: '/samples/china/Loops/Strings/Pipa/100_D_Pipa_01_541.wav' },
  { id: 'yangqin', nameKey: 'lab.cnInst.yangqin', descKey: 'lab.cnInst.yangqin.desc', category: 'strings', color: 'yellow', sampleUrl: '/samples/china/Loops/Strings/Yangqin/100_D_Yangqin_01_541.wav' },
  { id: 'dizi', nameKey: 'lab.cnInst.dizi', descKey: 'lab.cnInst.dizi.desc', category: 'woodwind', color: 'green', sampleUrl: '/samples/china/Loops/Woodwind/Dizi/120_G_Dizi_01_541.wav' },
  { id: 'hulusi', nameKey: 'lab.cnInst.hulusi', descKey: 'lab.cnInst.hulusi.desc', category: 'woodwind', color: 'pink', sampleUrl: '/samples/china/Loops/Woodwind/Hulusi/120_F_Hulusi_01_541.wav' },
  { id: 'xiao', nameKey: 'lab.cnInst.xiao', descKey: 'lab.cnInst.xiao.desc', category: 'woodwind', color: 'blue', sampleUrl: '/samples/china/Loops/Woodwind/Xiao/120_G_Xiao_01_541.wav' },
];

const ChineseInstruments: React.FC = () => {
  const { t } = useSettings();
  const [filter, setFilter] = useState<Category>('all');
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [activePlayer, setActivePlayer] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const filtered = filter === 'all' ? INSTRUMENTS : INSTRUMENTS.filter(i => i.category === filter);

  const handlePlay = useCallback((inst: Instrument) => {
    if (playingId === inst.id) {
      audioRef.current?.pause();
      audioRef.current = null;
      setPlayingId(null);
      return;
    }
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    const audio = new Audio(inst.sampleUrl);
    audio.onended = () => { setPlayingId(null); audioRef.current = null; };
    audio.play().catch(() => setPlayingId(null));
    audioRef.current = audio;
    setPlayingId(inst.id);
  }, [playingId]);

  // If a player is active, show it
  if (activePlayer) {
    return (
      <InstrumentPlayer
        instrumentId={activePlayer}
        onBack={() => setActivePlayer(null)}
      />
    );
  }

  const categories: { id: Category; label: string }[] = [
    { id: 'all', label: t('lab.cnInst.all') },
    { id: 'strings', label: t('lab.cnInst.strings') },
    { id: 'woodwind', label: t('lab.cnInst.woodwind') },
  ];

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Category filter */}
      <div className="flex gap-2">
        {categories.map(cat => (
          <button
            key={cat.id}
            onClick={() => setFilter(cat.id)}
            className="px-3.5 py-2 rounded-full text-xs font-semibold transition-all"
            style={filter === cat.id
              ? { background: '#1e293b', color: '#fff' }
              : { background: 'white', color: '#94A3B8' }
            }
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Instrument cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        {filtered.map(inst => {
          const pal = PALETTE[inst.color];
          const isPlaying = playingId === inst.id;
          const hasOneShot = PLAYABLE_IDS.includes(inst.id);
          return (
            <div
              key={inst.id}
              className="bg-white rounded-2xl p-4 shadow-[0_1px_4px_rgba(0,0,0,0.02)] transition-all hover:shadow-[0_1px_6px_rgba(0,0,0,0.03)] hover:-translate-y-0.5 flex flex-col"
            >
              {/* Header */}
              <div className="flex items-center gap-3 mb-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: pal.bg }}
                >
                  <Music2 size={18} style={{ color: pal.accent }} />
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-bold text-slate-800 truncate">{t(inst.nameKey)}</h3>
                  <span
                    className="text-[10px] font-semibold uppercase tracking-widest"
                    style={{ color: pal.accent }}
                  >
                    {t(inst.category === 'strings' ? 'lab.cnInst.strings' : 'lab.cnInst.woodwind')}
                  </span>
                </div>
              </div>

              {/* Description */}
              <p className="text-xs text-slate-500 leading-relaxed mb-3 line-clamp-3 flex-1">
                {t(inst.descKey)}
              </p>

              {/* Action buttons */}
              <div className="flex gap-2 mt-auto">
                <button
                  onClick={() => handlePlay(inst)}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-semibold transition-all active:scale-95`}
                  style={isPlaying
                    ? { background: pal.accent, color: '#fff' }
                    : { background: pal.bg, color: pal.accent }
                  }
                >
                  {isPlaying ? <Square size={13} /> : <Play size={13} />}
                  {isPlaying ? t('lab.cnInst.stop') : t('lab.cnInst.play')}
                </button>

                {hasOneShot && (
                  <button
                    onClick={() => {
                      // Stop any loop playback first
                      if (audioRef.current) {
                        audioRef.current.pause();
                        audioRef.current = null;
                        setPlayingId(null);
                      }
                      setActivePlayer(inst.id);
                    }}
                    className="flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold border transition-all hover:scale-[1.02] active:scale-95"
                    style={{
                      background: 'white',
                      color: pal.accent,
                      borderColor: pal.accent + '33',
                    }}
                  >
                    <Piano size={13} />
                    {t('lab.cnInst.perform')}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ChineseInstruments;
