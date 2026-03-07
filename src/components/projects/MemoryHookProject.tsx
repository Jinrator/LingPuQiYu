import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Fish, Play, Pause, X, Repeat, Zap } from 'lucide-react';
import { audioService } from '../../services/audioService';
import { NOTES } from '../../utils/musicNotes';
import { PALETTE } from '../../constants/palette';
import ProjectShell from './ProjectShell';

interface MelodyFragment {
  id: string; name: string; notes: number[]; paletteKey: keyof typeof PALETTE; emoji: string;
}

const SCALE_NOTES = [
  NOTES.C4, NOTES.D4, NOTES.E4, NOTES.F4,
  NOTES.G4, NOTES.A4, NOTES.B4, NOTES.C5,
];

const MOCK_FRAGMENTS: MelodyFragment[] = [
  { id: 'f1', name: '夏日闪闪', notes: [SCALE_NOTES[0], SCALE_NOTES[2], SCALE_NOTES[4], SCALE_NOTES[7]], paletteKey: 'yellow', emoji: '✨' },
  { id: 'f2', name: '深夜电波', notes: [SCALE_NOTES[7], SCALE_NOTES[5], SCALE_NOTES[4], SCALE_NOTES[0]], paletteKey: 'blue', emoji: '🌙' },
  { id: 'f3', name: '彩虹阶梯', notes: [SCALE_NOTES[0], SCALE_NOTES[1], SCALE_NOTES[2], SCALE_NOTES[3]], paletteKey: 'pink', emoji: '🌈' },
  { id: 'f4', name: '心跳加速', notes: [SCALE_NOTES[0], SCALE_NOTES[0], SCALE_NOTES[7], SCALE_NOTES[7]], paletteKey: 'green', emoji: '💓' },
];

const MemoryHookProject: React.FC<{ onComplete: () => void; onBack: () => void; theme?: 'light' | 'dark' }> = ({ onComplete, onBack }) => {
  const [hookSlots, setHookSlots] = useState<(MelodyFragment | null)[]>([null, null, null, null]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStep, setCurrentStep] = useState(-1);
  const timerRef = useRef<number | null>(null);

  const playFragment = useCallback((fragment: MelodyFragment) => {
    for (let i = 0; i < fragment.notes.length; i++) {
      setTimeout(() => { audioService.playPianoNote(fragment.notes[i], 0.3, 0.6); }, i * 150);
    }
  }, []);

  useEffect(() => {
    if (isPlaying) {
      timerRef.current = window.setInterval(() => {
        setCurrentStep(prev => {
          const next = (prev + 1) % 4;
          const frag = hookSlots[next];
          if (frag) playFragment(frag);
          return next;
        });
      }, 800);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      setCurrentStep(-1);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isPlaying, hookSlots, playFragment]);

  const addToSlot = (fragment: MelodyFragment) => {
    const firstEmpty = hookSlots.findIndex(s => s === null);
    if (firstEmpty !== -1) {
      const newSlots = [...hookSlots];
      newSlots[firstEmpty] = fragment;
      setHookSlots(newSlots);
      playFragment(fragment);
    }
  };

  const duplicateHook = () => {
    const firstFrag = hookSlots.find(s => s !== null);
    if (firstFrag) {
      setHookSlots([firstFrag, firstFrag, firstFrag, firstFrag]);
      setIsPlaying(true);
    }
  };

  const clearSlot = (idx: number) => {
    const newSlots = [...hookSlots];
    newSlots[idx] = null;
    setHookSlots(newSlots);
  };

  const hasAny = hookSlots.some(s => s !== null);

  return (
    <ProjectShell lessonId={12} title="记忆钩子 (Hook)" subtitle="CATCHY MELODY REPETITION" color="pink"
      actionLabel="这就是我的 Hook" actionEnabled={hasAny} onAction={onComplete} onBack={onBack} footerText="Hook Generation Engine · L12">

      {/* Section title + duplicate button */}
      <div className="flex items-center justify-between mb-3 sm:mb-4">
        <h3 className="text-sm font-bold text-slate-700 flex items-center gap-2">
          <Zap size={16} style={{ color: PALETTE.yellow.accent }} /> 副歌高潮区
        </h3>
        <button onClick={duplicateHook} disabled={!hasAny}
          className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold transition-all ${hasAny
            ? 'border border-slate-200 text-slate-600 hover:bg-slate-50 bg-white hover:scale-[1.02] active:scale-95'
            : 'bg-slate-200 text-slate-400 cursor-not-allowed opacity-40'
          }`}>
          <Repeat size={14} /> 一键洗脑
        </button>
      </div>

      {/* Hook slots */}
      <div className="grid grid-cols-4 gap-2 sm:gap-3 mb-4 sm:mb-6">
        {hookSlots.map((slot, idx) => {
          const slotColor = slot ? PALETTE[slot.paletteKey] : null;
          return (
            <div key={idx}
              className="relative h-28 sm:h-36 rounded-2xl border-2 border-dashed transition-all flex flex-col items-center justify-center gap-2 overflow-hidden"
              style={slot && slotColor
                ? { background: slotColor.bg, borderColor: slotColor.accent, borderStyle: 'solid' }
                : { background: '#F8FAFC', borderColor: '#E2E8F0' }
              }>
              {slot && slotColor ? (
                <>
                  <span className="text-3xl sm:text-4xl">{slot.emoji}</span>
                  <span className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: slotColor.accent }}>{slot.name}</span>
                  <button onClick={() => clearSlot(idx)}
                    className="absolute top-2 right-2 p-1 rounded-full bg-white border border-slate-200 text-slate-400 hover:text-slate-600">
                    <X size={12} />
                  </button>
                  {currentStep === idx && (
                    <div className="absolute inset-0 border-2 rounded-2xl pointer-events-none" style={{ borderColor: slotColor.accent }} />
                  )}
                </>
              ) : (
                <div className="text-slate-300 flex flex-col items-center gap-1">
                  <Fish size={20} />
                  <span className="text-[10px] font-semibold uppercase tracking-widest">等待垂钓</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Play button */}
      <div className="flex justify-center mb-4 sm:mb-6">
        <button onClick={() => setIsPlaying(!isPlaying)}
          className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl flex items-center justify-center transition-all text-white active:scale-95"
          style={{ background: isPlaying ? PALETTE.pink.accent : PALETTE.blue.accent }}>
          {isPlaying ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" className="ml-0.5" />}
        </button>
      </div>

      {/* Inspiration pool */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-[0_1px_4px_rgba(0,0,0,0.02)] p-4 sm:p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white" style={{ background: PALETTE.blue.accent }}>
            <Fish size={18} />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-800">灵感池</h4>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">Your Inspiration Pool</p>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
          {MOCK_FRAGMENTS.map(frag => {
            const fc = PALETTE[frag.paletteKey];
            return (
              <button key={frag.id} onClick={() => addToSlot(frag)}
                className="p-3 sm:p-4 rounded-2xl border transition-all flex flex-col items-center gap-2 hover:scale-[1.02] active:scale-95"
                style={{ background: '#F8FAFC', borderColor: '#E2E8F0' }}>
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl flex items-center justify-center text-2xl sm:text-3xl"
                  style={{ background: fc.bg }}>
                  {frag.emoji}
                </div>
                <span className="text-xs font-semibold text-slate-700">{frag.name}</span>
              </button>
            );
          })}
        </div>
      </div>
    </ProjectShell>
  );
};

export default MemoryHookProject;
