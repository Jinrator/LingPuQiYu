import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Sun, CloudRain, Play, Pause, HeartPulse } from 'lucide-react';
import { audioService } from '../../services/audioService';
import { NOTES, C_MAJOR_SCALE, C_MINOR_SCALE } from '../../utils/musicNotes';
import { PALETTE } from '../../constants/palette';
import ProjectShell from './ProjectShell';

interface MoodDoodleProjectProps { onComplete: () => void; onBack: () => void; theme?: 'light' | 'dark'; }

const BIRTHDAY_MELODY = [
  { step: 0, note: 0, label: '1' }, { step: 1, note: 0, label: '1' },
  { step: 2, note: 1, label: '2' }, { step: 3, note: 0, label: '1' },
  { step: 4, note: 3, label: '4' }, { step: 5, note: 2, label: '3' },
];

const MAJOR_NOTES = C_MAJOR_SCALE;
const MINOR_NOTES = C_MINOR_SCALE;

const MoodDoodleProject: React.FC<MoodDoodleProjectProps> = ({ onComplete, onBack }) => {
  const [mood, setMood] = useState<'happy' | 'sad'>('happy');
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStep, setCurrentStep] = useState(-1);
  const timerRef = useRef<number | null>(null);

  const playNote = useCallback((note: any) => { audioService.playPianoNote(note, 0.8, mood === 'happy' ? 0.7 : 0.5); }, [mood]);

  useEffect(() => {
    if (isPlaying) {
      timerRef.current = window.setInterval(() => {
        setCurrentStep(prev => {
          const next = (prev + 1) % 8;
          const notes = mood === 'happy' ? MAJOR_NOTES : MINOR_NOTES;
          const m = BIRTHDAY_MELODY.find(m => m.step === next);
          if (m) playNote(notes[m.note]);
          return next;
        });
      }, 600);
    } else { if (timerRef.current) clearInterval(timerRef.current); setCurrentStep(-1); }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isPlaying, mood, playNote]);

  const moodColor = mood === 'happy' ? PALETTE.yellow : PALETTE.blue;

  return (
    <ProjectShell lessonId={5} title="心情涂鸦板" subtitle={mood === 'happy' ? 'MAJOR SCALE' : 'MINOR SCALE'}
      color={mood === 'happy' ? 'yellow' : 'blue'} actionLabel="保存情绪实验" actionEnabled={true}
      onAction={onComplete} onBack={onBack} footerText="Mood Engine · L5">
      {/* Mood selector */}
      <div className="flex items-center justify-center gap-6 sm:gap-10 mb-6 sm:mb-8">
        <div className="flex flex-col items-center gap-2">
          <button onClick={() => setMood('happy')}
            className={`w-16 h-16 sm:w-20 sm:h-20 rounded-2xl flex items-center justify-center transition-all border-2 ${mood === 'happy' ? 'scale-110' : 'opacity-30'}`}
            style={mood === 'happy' ? { background: PALETTE.yellow.accent, borderColor: PALETTE.yellow.accent, color: '#fff' } : { background: '#F8FAFC', borderColor: '#E2E8F0', color: '#94A3B8' }}>
            <Sun size={28} />
          </button>
          <span className="text-xs font-semibold" style={{ color: mood === 'happy' ? PALETTE.yellow.accent : '#94A3B8' }}>大调 (Major)</span>
        </div>

        <div className="relative">
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl flex items-center justify-center text-5xl sm:text-6xl bg-white border border-slate-200 shadow-[0_1px_4px_rgba(0,0,0,0.02)] transition-all">🐰</div>
          <span className="absolute -top-2 -right-2 px-2.5 py-0.5 rounded-full text-[10px] font-semibold border"
            style={{ background: moodColor.bg, color: moodColor.accent, borderColor: moodColor.accent + '33' }}>
            {mood === 'happy' ? '☀️ 快乐' : '🌙 忧郁'}
          </span>
        </div>

        <div className="flex flex-col items-center gap-2">
          <button onClick={() => setMood('sad')}
            className={`w-16 h-16 sm:w-20 sm:h-20 rounded-2xl flex items-center justify-center transition-all border-2 ${mood === 'sad' ? 'scale-110' : 'opacity-30'}`}
            style={mood === 'sad' ? { background: PALETTE.blue.accent, borderColor: PALETTE.blue.accent, color: '#fff' } : { background: '#F8FAFC', borderColor: '#E2E8F0', color: '#94A3B8' }}>
            <CloudRain size={28} />
          </button>
          <span className="text-xs font-semibold" style={{ color: mood === 'sad' ? PALETTE.blue.accent : '#94A3B8' }}>小调 (Minor)</span>
        </div>
      </div>

      {/* Melody grid */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-[0_1px_4px_rgba(0,0,0,0.02)] p-4 sm:p-8">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: moodColor.bg }}>
              <HeartPulse size={18} style={{ color: moodColor.accent }} />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-700">旋律进度条</h4>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">
                {mood === 'happy' ? 'C 大调音阶' : 'C 小调音阶'}
              </p>
            </div>
          </div>
          <button onClick={() => setIsPlaying(!isPlaying)}
            className="px-5 py-2.5 rounded-xl font-semibold text-xs text-white flex items-center gap-2 transition-all hover:opacity-90 active:scale-95"
            style={{ background: isPlaying ? '#ef4444' : moodColor.accent }}>
            {isPlaying ? <Pause size={14} fill="currentColor" /> : <Play size={14} fill="currentColor" />}
            {isPlaying ? '停止' : '播放'}
          </button>
        </div>

        <div className="grid grid-cols-8 gap-2 sm:gap-4">
          {[...Array(8)].map((_, idx) => {
            const hasNote = BIRTHDAY_MELODY.find(m => m.step === idx);
            const isActive = currentStep === idx;
            return (
              <div key={idx} className="flex flex-col items-center gap-2">
                <div className={`w-full aspect-square rounded-xl transition-all flex items-center justify-center border-2 ${isActive ? 'scale-105' : ''}`}
                  style={hasNote
                    ? { background: moodColor.accent, borderColor: moodColor.accent + '66', ...(isActive ? { boxShadow: `0 0 0 4px ${moodColor.accent}22` } : {}) }
                    : { background: '#F8FAFC', borderColor: '#E2E8F0' }
                  }>
                  {hasNote && <span className="text-base sm:text-lg font-bold text-white">{hasNote.label}</span>}
                </div>
                <div className="w-1.5 h-1.5 rounded-full transition-all" style={{ background: isActive ? moodColor.accent : '#E2E8F0' }} />
              </div>
            );
          })}
        </div>
      </div>
    </ProjectShell>
  );
};

export default MoodDoodleProject;
