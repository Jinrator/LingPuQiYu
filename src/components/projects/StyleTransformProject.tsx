import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Play, Pause } from 'lucide-react';
import { audioService } from '../../services/audioService';
import { NOTES } from '../../utils/musicNotes';
import { PALETTE } from '../../constants/palette';
import ProjectShell from './ProjectShell';

interface MusicStyle {
  id: string; name: string; icon: string; description: string;
  paletteKey: keyof typeof PALETTE; bpm: number; aiTip: string;
}

const STYLES: MusicStyle[] = [
  { id: 'rock', name: '热血摇滚', icon: '⚡', description: '强有力的重音与失真感', paletteKey: 'pink', bpm: 130, aiTip: '摇滚乐的核心是"强弱强弱"，重音通常落在第 2、4 拍上！' },
  { id: 'jazz', name: '摇摆爵士', icon: '🎷', description: '慵懒的切分音与华丽和弦', paletteKey: 'blue', bpm: 90, aiTip: '爵士乐喜欢"摇摆（Swing）"，节奏富有弹性。' },
  { id: 'electronic', name: '未来电子', icon: '🎹', description: '精准的节奏与合成器魅力', paletteKey: 'green', bpm: 128, aiTip: '电子乐追求极高的精准度，底鼓通常是"咚咚咚咚"。' },
];

const StyleTransformProject: React.FC<{ onComplete: () => void; onBack: () => void; theme?: 'light' | 'dark' }> = ({ onComplete, onBack }) => {
  const [activeStyle, setActiveStyle] = useState<MusicStyle>(STYLES[0]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStep, setCurrentStep] = useState(-1);
  const timerRef = useRef<number | null>(null);

  const melodyNotes = [NOTES.C4, NOTES.E4, NOTES.G4, NOTES.C4];

  const runSequence = useCallback(() => {
    const step = (currentStep + 1) % 8;
    setCurrentStep(step);
    if (activeStyle.id === 'rock') {
      if (step % 2 === 0) audioService.playDrum('kick');
      if (step % 2 === 1) audioService.playDrum('snare');
      if (step % 2 === 0) audioService.playPianoNote(melodyNotes[step % 4], 0.5, 0.8);
    } else if (activeStyle.id === 'jazz') {
      if (step % 4 === 0) audioService.playDrum('kick');
      if (step % 4 !== 1) audioService.playPianoNote(melodyNotes[step % 4], 0.8, 0.4);
    } else {
      audioService.playDrum('kick');
      if (step % 1 === 0) audioService.playPianoNote(melodyNotes[step % 4], 0.1, 0.6);
    }
  }, [activeStyle, currentStep, melodyNotes]);

  useEffect(() => {
    if (isPlaying) {
      const interval = (60 / activeStyle.bpm) * 1000 / 2;
      timerRef.current = window.setInterval(runSequence, interval);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isPlaying, activeStyle, runSequence]);

  const handleStyleChange = (style: MusicStyle) => {
    setActiveStyle(style); setCurrentStep(-1);
  };

  const color = PALETTE[activeStyle.paletteKey];

  return (
    <ProjectShell lessonId={10} title="风格大变身" subtitle="MUSIC STYLE TRANSFORM" color={activeStyle.paletteKey}
      actionLabel="掌握风格徽章" actionEnabled onAction={onComplete} onBack={onBack} footerText="Style Transform Engine · L10">

      {/* AI tip */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-[0_1px_4px_rgba(0,0,0,0.02)] p-4 sm:p-5 mb-4"
        style={{ borderLeftColor: color.accent, borderLeftWidth: 3 }}>
        <div className="flex gap-3 items-start">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0" style={{ background: color.bg }}>🤖</div>
          <div>
            <h3 className="text-sm font-bold text-slate-800 mb-1">AI 助教：{activeStyle.name}</h3>
            <p className="text-xs font-medium text-slate-500 leading-relaxed">{activeStyle.aiTip}</p>
          </div>
        </div>
      </div>

      {/* Style icon display */}
      <div className="flex justify-center mb-4 sm:mb-6">
        <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-2xl flex items-center justify-center text-7xl sm:text-8xl bg-white border border-slate-200 shadow-[0_1px_4px_rgba(0,0,0,0.02)] transition-all"
          style={{ borderColor: color.accent + '33' }}>
          {activeStyle.icon}
        </div>
      </div>

      {/* Style selector */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-4 sm:mb-6">
        {STYLES.map(style => {
          const sc = PALETTE[style.paletteKey];
          const isSelected = activeStyle.id === style.id;
          return (
            <button key={style.id} onClick={() => handleStyleChange(style)}
              className="p-4 sm:p-5 rounded-2xl border-2 transition-all flex flex-col items-center gap-3 text-center hover:scale-[1.02] active:scale-95"
              style={isSelected
                ? { background: sc.bg, borderColor: sc.accent, color: sc.accent }
                : { background: '#F8FAFC', borderColor: '#E2E8F0', color: '#94A3B8' }
              }>
              <span className="text-4xl">{style.icon}</span>
              <h4 className="text-sm font-bold">{style.name}</h4>
              <p className="text-[10px] font-semibold uppercase tracking-widest">{style.bpm} BPM</p>
              <p className="text-xs font-medium" style={{ color: isSelected ? sc.accent : '#94A3B8' }}>{style.description}</p>
            </button>
          );
        })}
      </div>

      {/* Step visualizer + play button */}
      <div className="flex items-center gap-3 sm:gap-4">
        <button onClick={() => setIsPlaying(!isPlaying)}
          className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl flex items-center justify-center transition-all text-white flex-shrink-0 active:scale-95"
          style={{ background: isPlaying ? PALETTE.pink.accent : color.accent }}>
          {isPlaying ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" className="ml-0.5" />}
        </button>
        <div className="flex-1 flex gap-1.5 sm:gap-2">
          {[0,1,2,3,4,5,6,7].map(s => (
            <div key={s} className={`flex-1 h-10 sm:h-14 rounded-xl border transition-all ${currentStep === s ? 'scale-105' : 'opacity-30'}`}
              style={currentStep === s
                ? { background: color.bg, borderColor: color.accent }
                : { background: '#F8FAFC', borderColor: '#E2E8F0' }
              }>
              <div className="w-full h-full flex items-center justify-center">
                <div className="w-2 h-2 rounded-full transition-all" style={{ background: currentStep === s ? color.accent : '#E2E8F0' }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </ProjectShell>
  );
};

export default StyleTransformProject;
