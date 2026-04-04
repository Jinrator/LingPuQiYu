import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Play, Square, Piano } from 'lucide-react';
import { PALETTE } from '../../constants/palette';
import { useSettings } from '../../contexts/SettingsContext';
import InstrumentPlayer, { PLAYABLE_IDS, preloadPlayableInstrumentSamples } from './InstrumentPlayer';
import { preloadAudioUrls } from '../../services/resourceLoader';

interface Instrument {
  id: string;
  nameKey: string;
  descKey: string;
  category: 'strings' | 'woodwind';
  color: keyof typeof PALETTE;
  sampleUrl: string;
  iconUrl: string;
}

const INSTRUMENTS: Instrument[] = [
  { id: 'guzheng', nameKey: 'lab.cnInst.guzheng', descKey: 'lab.cnInst.guzheng.desc', category: 'strings',   color: 'green',  sampleUrl: '/samples/china/Loops/Strings/Guzheng/SO_CG_90_melodic_loop_chengdu_Gm.wav', iconUrl: '/images/guqin.svg' },
  { id: 'pipa',    nameKey: 'lab.cnInst.pipa',    descKey: 'lab.cnInst.pipa.desc',    category: 'strings',   color: 'orange', sampleUrl: '/samples/china/Loops/Strings/Pipa/100_D_Pipa_01_541.wav',    iconUrl: '/images/pipa.svg' },
  { id: 'yangqin', nameKey: 'lab.cnInst.yangqin', descKey: 'lab.cnInst.yangqin.desc', category: 'strings',   color: 'yellow', sampleUrl: '/samples/china/Loops/Strings/Yangqin/100_D_Yangqin_01_541.wav', iconUrl: '/images/yangqin.svg' },
  { id: 'xiao',    nameKey: 'lab.cnInst.xiao',    descKey: 'lab.cnInst.xiao.desc',    category: 'woodwind',  color: 'blue',   sampleUrl: '/samples/china/Loops/Woodwind/Xiao/120_G_Xiao_01_541.wav',    iconUrl: '/images/xiao.svg' },
  { id: 'erhu',    nameKey: 'lab.cnInst.erhu',    descKey: 'lab.cnInst.erhu.desc',    category: 'strings',   color: 'pink',   sampleUrl: '/samples/china/Loops/Strings/Erhu/120_Am_Erhu_01_541.wav',    iconUrl: '/images/erhu.svg' },
];

const previewAudioCache = new Map<string, HTMLAudioElement>();
let previewPreloadPromise: Promise<void> | null = null;

function getPreviewAudio(inst: Instrument): HTMLAudioElement {
  const cached = previewAudioCache.get(inst.id);
  if (cached) return cached;

  const audio = new Audio(inst.sampleUrl);
  audio.preload = 'auto';
  previewAudioCache.set(inst.id, audio);
  return audio;
}

async function preloadPreviewSamples(): Promise<void> {
  if (previewPreloadPromise) return previewPreloadPromise;

  // 通过 resourceLoader 统一排队，控制并发
  previewPreloadPromise = preloadAudioUrls(
    INSTRUMENTS.map(inst => inst.sampleUrl),
    'low',
  );

  return previewPreloadPromise;
}

const getIconFilter = (color: keyof typeof PALETTE): string => {
  const filters: Record<keyof typeof PALETTE, string> = {
    orange: 'invert(55%) sepia(85%) saturate(1000%) hue-rotate(340deg)',
    yellow: 'invert(65%) sepia(90%) saturate(500%) hue-rotate(5deg)',
    pink: 'invert(45%) sepia(80%) saturate(500%) hue-rotate(300deg)',
    blue: 'invert(45%) sepia(90%) saturate(2000%) hue-rotate(200deg)',
    green: 'invert(50%) sepia(90%) saturate(500%) hue-rotate(100deg)',
  };
  return filters[color];
};

const ChineseInstruments: React.FC = () => {
  const { t } = useSettings();
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [activePlayer, setActivePlayer] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // 预览采样较小，延迟 300ms 后开始
    const previewTimer = setTimeout(() => {
      void preloadPreviewSamples();
    }, 300);

    // 可演奏采样较大，延迟到浏览器空闲时再加载
    const playableTimer = setTimeout(() => {
      if ('requestIdleCallback' in window) {
        (window as any).requestIdleCallback(() => {
          void preloadPlayableInstrumentSamples();
        }, { timeout: 8000 });
      } else {
        void preloadPlayableInstrumentSamples();
      }
    }, 2000);

    return () => {
      clearTimeout(previewTimer);
      clearTimeout(playableTimer);
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
    };
  }, []);

  const handlePlay = useCallback((inst: Instrument) => {
    if (playingId === inst.id) {
      audioRef.current?.pause();
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
      }
      audioRef.current = null;
      setPlayingId(null);
      return;
    }
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }

    const audio = getPreviewAudio(inst);
    audio.currentTime = 0;
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

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Instrument cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        {INSTRUMENTS.map(inst => {
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
                  className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 p-2"
                  style={{ background: pal.bg }}
                >
                  <img src={inst.iconUrl} alt={t(inst.nameKey)} className="w-full h-full object-contain" loading="lazy" style={{ filter: getIconFilter(inst.color) }} />
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
                        audioRef.current.currentTime = 0;
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
