
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { X, Check, Music2, Play, Pause, Sparkles, Zap, Flame, Headphones, MessageCircle, Info } from 'lucide-react';
import { audioService } from '../../services/audioService';
import { NOTES } from '../../utils/musicNotes';

interface MusicStyle {
  id: string;
  name: string;
  icon: string;
  description: string;
  color: string;
  accent: string;
  bgGradient: string;
  bpm: number;
  aiTip: string;
}

const STYLES: MusicStyle[] = [
  { id: 'rock', name: '热血摇滚', icon: '⚡', description: '强有力的重音与失真感。', color: 'bg-rose-600', accent: 'text-rose-500', bgGradient: 'from-rose-900/40 to-black', bpm: 130, aiTip: '摇滚乐的核心是“强弱强弱”，重音通常落在第 2、4 拍上！' },
  { id: 'jazz', name: '摇摆爵士', icon: '🎷', description: '慵懒的切分音与华丽和弦。', color: 'bg-indigo-600', accent: 'text-indigo-400', bgGradient: 'from-indigo-900/40 to-slate-900', bpm: 90, aiTip: '爵士乐喜欢“摇摆（Swing）”，节奏富有弹性。' },
  { id: 'electronic', name: '未来电子', icon: '🎹', description: '精准的节奏与合成器魅力。', color: 'bg-emerald-500', accent: 'text-emerald-400', bgGradient: 'from-emerald-900/40 to-[#020617]', bpm: 128, aiTip: '电子乐追求极高的精准度，底鼓通常是“咚咚咚咚”。' },
];

const StyleTransformProject: React.FC<{ onComplete: () => void; onBack: () => void; theme?: 'light' | 'dark' }> = ({ onComplete, onBack, theme = 'dark' }) => {
  const [activeStyle, setActiveStyle] = useState<MusicStyle>(STYLES[0]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStep, setCurrentStep] = useState(-1);
  const timerRef = useRef<number | null>(null);
  const isDark = theme === 'dark';

  // 简洁的旋律音符 - 使用统一的音符系统
  const melodyNotes = [
    NOTES.C4, // Do
    NOTES.E4, // Mi
    NOTES.G4, // Sol
    NOTES.C4, // Do
  ];

  const runSequence = useCallback(() => {
    const step = (currentStep + 1) % 8;
    setCurrentStep(step);
    
    if (activeStyle.id === 'rock') {
      // 摇滚风格：强劲的鼓点 + 失真吉他感
      if (step % 2 === 0) {
        audioService.playDrum('kick');
      }
      if (step % 2 === 1) {
        audioService.playDrum('snare');
      }
      if (step % 2 === 0) {
        audioService.playPianoNote(melodyNotes[step % 4], 0.5, 0.8);
      }
    } else if (activeStyle.id === 'jazz') {
      // 爵士风格：摇摆节奏 + 柔和钢琴
      if (step % 4 === 0) {
        audioService.playDrum('kick');
      }
      if (step % 4 !== 1) {
        audioService.playPianoNote(melodyNotes[step % 4], 0.8, 0.4);
      }
    } else {
      // 电子风格：精准节拍 + 合成器音色
      audioService.playDrum('kick');
      if (step % 1 === 0) {
        audioService.playPianoNote(melodyNotes[step % 4], 0.1, 0.6);
      }
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

  const handleTogglePlay = () => {
    setIsPlaying(!isPlaying);
  };

  const handleStyleChange = (style: MusicStyle) => {
    setActiveStyle(style);
    setCurrentStep(-1);
  };

  return (
    <div className={`fixed inset-0 z-[200] flex flex-col transition-all duration-1000 overflow-hidden ${activeStyle.bgGradient}`}>
      <header className={`relative z-10 p-8 flex items-center justify-between transition-colors border-b backdrop-blur-xl ${isDark ? 'bg-slate-900/60 border-white/5' : 'bg-white/60 border-blue-100'}`}>
        <div className="flex items-center gap-6">
          <button onClick={onBack} className={`p-4 rounded-2xl transition-all ${isDark ? 'bg-white/5 text-slate-400' : 'bg-white border border-blue-100 text-blue-600'}`}>
            <X size={24} />
          </button>
          <h2 className={`text-2xl font-black tracking-tight ${isDark ? 'text-white' : 'text-blue-950'}`}>L10 · 风格大变身</h2>
        </div>
        <button onClick={onComplete} className="px-10 py-4 rounded-2xl font-black text-sm text-white bg-emerald-600">
          掌握风格徽章 <Check size={18} className="ml-2 inline" />
        </button>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center p-8 relative z-10 gap-16">
        <div className={`relative w-64 h-64 rounded-[5rem] flex items-center justify-center text-[10rem] ${isDark ? 'bg-slate-800' : 'bg-white'}`}>
              {activeStyle.icon}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-6xl">
           {STYLES.map((style) => (
             <button key={style.id} onClick={() => handleStyleChange(style)} className={`group p-8 rounded-[3.5rem] border-4 transition-all ${activeStyle.id === style.id ? `${style.color} border-white scale-105 text-white` : 'bg-white/5 border-white/5 text-slate-500'}`}>
                <span className="text-5xl">{style.icon}</span>
                <h4 className="text-2xl font-black mt-4">{style.name}</h4>
             </button>
           ))}
        </div>

        <button onClick={handleTogglePlay} className={`w-28 h-28 rounded-[3rem] flex items-center justify-center transition-all border-4 ${isPlaying ? 'bg-rose-500 border-rose-400' : 'bg-blue-600 border-blue-400'} text-white active:scale-90`}>
           {isPlaying ? <Pause size={48} fill="currentColor" /> : <Play size={48} fill="currentColor" className="ml-2" />}
        </button>
      </main>
    </div>
  );
};

export default StyleTransformProject;
