import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Play, Square, Piano, Loader2 } from 'lucide-react';
import { PALETTE } from '../../constants/palette';
import { useSettings } from '../../contexts/SettingsContext';
import InstrumentPlayer, { PLAYABLE_IDS, preloadPlayableInstrumentSamples } from './InstrumentPlayer';
import { preloadAudioUrlsWithProgress, getAudioBuffer, getAudioContext, resumeAudioContext } from '../../services/resourceLoader';

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

// ── 预览采样：统一走 resourceLoader（AudioBuffer） ───────────────────────────

let previewPreloadPromise: Promise<void> | null = null;
let previewReady = false;

/** 预加载所有预览采样为 AudioBuffer */
function preloadPreviewSamples(): Promise<void> {
  if (previewPreloadPromise) return previewPreloadPromise;
  const urls = INSTRUMENTS.map(inst => inst.sampleUrl);
  previewPreloadPromise = preloadAudioUrlsWithProgress(urls, 'high', () => {}).then(() => {
    previewReady = true;
  });
  return previewPreloadPromise;
}

/** 用 AudioContext 播放预览采样（AudioBuffer → BufferSource，零延迟） */
function playPreviewBuffer(url: string): AudioBufferSourceNode | null {
  const buffer = getAudioBuffer(url);
  if (!buffer) return null;
  const ctx = getAudioContext();
  resumeAudioContext();
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  source.connect(ctx.destination);
  source.start(0);
  return source;
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
  const [previewsReady, setPreviewsReady] = useState(() => previewReady);
  const sourceRef = useRef<AudioBufferSourceNode | null>(null);
  const hoveredRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    // 预览采样（高优先级，5 个文件）→ 完成后开始后台预加载演奏采样
    void preloadPreviewSamples().then(() => {
      setPreviewsReady(true);
      void preloadPlayableInstrumentSamples();
    });

    return () => {
      if (sourceRef.current) {
        try { sourceRef.current.stop(); } catch { /* already stopped */ }
      }
    };
  }, []);

  const handlePlay = useCallback((inst: Instrument) => {
    // 停止当前播放
    if (playingId === inst.id) {
      if (sourceRef.current) {
        try { sourceRef.current.stop(); } catch { /* already stopped */ }
        sourceRef.current = null;
      }
      setPlayingId(null);
      return;
    }

    // 停止之前的
    if (sourceRef.current) {
      try { sourceRef.current.stop(); } catch { /* already stopped */ }
      sourceRef.current = null;
    }

    const source = playPreviewBuffer(inst.sampleUrl);
    if (!source) return;

    source.onended = () => { setPlayingId(null); sourceRef.current = null; };
    sourceRef.current = source;
    setPlayingId(inst.id);
  }, [playingId]);

  const handlePerformHover = useCallback((instId: string) => {
    if (hoveredRef.current.has(instId)) return;
    hoveredRef.current.add(instId);
    void preloadPlayableInstrumentSamples(instId, 'high');
  }, []);

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
      {!previewsReady && (
        <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-white shadow-[0_1px_4px_rgba(0,0,0,0.02)]">
          <Loader2 size={14} className="animate-spin text-slate-400" />
          <span className="text-xs font-semibold text-slate-500">{t('lab.cnInst.loading')}</span>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        {INSTRUMENTS.map(inst => {
          const pal = PALETTE[inst.color];
          const isPlaying = playingId === inst.id;
          const hasOneShot = PLAYABLE_IDS.includes(inst.id);
          const previewDisabled = !previewsReady && !isPlaying;
          return (
            <div
              key={inst.id}
              className="bg-white rounded-2xl p-4 shadow-[0_1px_4px_rgba(0,0,0,0.02)] transition-all hover:shadow-[0_1px_6px_rgba(0,0,0,0.03)] hover:-translate-y-0.5 flex flex-col"
            >
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

              <p className="text-xs text-slate-500 leading-relaxed mb-3 line-clamp-3 flex-1">
                {t(inst.descKey)}
              </p>

              <div className="flex gap-2 mt-auto">
                <button
                  onClick={() => handlePlay(inst)}
                  disabled={previewDisabled}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-semibold transition-all active:scale-95${previewDisabled ? ' opacity-40 cursor-not-allowed' : ''}`}
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
                    onMouseEnter={() => handlePerformHover(inst.id)}
                    onTouchStart={() => handlePerformHover(inst.id)}
                    onClick={() => {
                      if (sourceRef.current) {
                        try { sourceRef.current.stop(); } catch { /* */ }
                        sourceRef.current = null;
                        setPlayingId(null);
                      }
                      void preloadPlayableInstrumentSamples(inst.id, 'high');
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
