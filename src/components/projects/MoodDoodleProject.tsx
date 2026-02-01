
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { X, Check, Sun, CloudRain, Music, Play, Pause, Sparkles, Info, HeartPulse, BadgeCheck } from 'lucide-react';

interface MoodDoodleProjectProps {
  onComplete: () => void;
  onBack: () => void;
  theme?: 'light' | 'dark';
}

const BIRTHDAY_MELODY = [
  { step: 0, note: 0, label: '1' }, 
  { step: 1, note: 0, label: '1' }, 
  { step: 2, note: 1, label: '2' }, 
  { step: 3, note: 0, label: '1' }, 
  { step: 4, note: 3, label: '4' }, 
  { step: 5, note: 2, label: '3' }
];

const MAJOR_FREQS = [261.63, 293.66, 329.63, 349.23, 392.00, 440.00, 493.88, 523.25];
const MINOR_FREQS = [261.63, 293.66, 311.13, 349.23, 392.00, 415.30, 466.16, 523.25];

const MoodDoodleProject: React.FC<MoodDoodleProjectProps> = ({ onComplete, onBack, theme = 'dark' }) => {
  const [mood, setMood] = useState<'happy' | 'sad'>('happy');
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStep, setCurrentStep] = useState(-1);
  const isDark = theme === 'dark';
  
  const audioCtxRef = useRef<AudioContext | null>(null);
  const timerRef = useRef<number | null>(null);

  const initAudio = () => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }
    return audioCtxRef.current;
  };

  const playNote = useCallback((freq: number) => {
    const ctx = initAudio();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = mood === 'happy' ? 'sine' : 'triangle'; 
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(mood === 'happy' ? 0.3 : 0.2, ctx.currentTime + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 1);
  }, [mood]);

  useEffect(() => {
    if (isPlaying) {
      timerRef.current = window.setInterval(() => {
        setCurrentStep(prev => {
          const next = (prev + 1) % 8;
          const freqs = mood === 'happy' ? MAJOR_FREQS : MINOR_FREQS;
          const melodyNote = BIRTHDAY_MELODY.find(m => m.step === next);
          if (melodyNote) {
            playNote(freqs[melodyNote.note]);
          }
          return next;
        });
      }, 600);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      setCurrentStep(-1);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isPlaying, mood, playNote]);

  const togglePlay = () => {
    initAudio(); 
    setIsPlaying(!isPlaying);
  };

  const handleMoodSwitch = (newMood: 'happy' | 'sad') => {
    initAudio();
    setMood(newMood);
  };

  return (
    <div className={`fixed inset-0 z-[200] flex flex-col transition-all duration-1000 overflow-hidden ${mood === 'happy' ? 'bg-[#fffbeb]' : 'bg-[#020617]'}`}>
      <header className={`relative z-10 p-8 flex items-center justify-between transition-colors border-b ${mood === 'happy' ? 'bg-white/40 border-amber-100' : 'bg-slate-900/40 border-white/5'} backdrop-blur-xl`}>
        <div className="flex items-center gap-6">
          <button onClick={onBack} className={`p-4 rounded-2xl transition-all ${mood === 'happy' ? 'bg-white text-amber-600' : 'bg-white/5 text-slate-400'}`}>
            <X size={24} />
          </button>
          <div>
            <h2 className={`text-2xl font-black tracking-tight ${mood === 'happy' ? 'text-amber-900' : 'text-white'}`}>L5 · 心情涂鸦板</h2>
            <p className={`text-[10px] font-black uppercase tracking-[0.2em] mt-0.5 ${mood === 'happy' ? 'text-amber-600' : 'text-blue-500'}`}>
              {mood === 'happy' ? 'MAJOR SCALE EXPERIENCE' : 'MINOR SCALE EXPERIENCE'}
            </p>
          </div>
        </div>
        <button onClick={onComplete} className={`px-10 py-4 rounded-2xl font-black text-sm text-white transition-all active:scale-95 ${mood === 'happy' ? 'bg-amber-500' : 'bg-blue-600'}`}>
          保存情绪实验 <Check size={18} className="ml-2 inline" />
        </button>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center p-8 relative z-10 gap-20">
        <div className="flex items-center justify-center gap-12 lg:gap-24 w-full">
           <div className="flex flex-col items-center gap-4">
             <button onClick={() => handleMoodSwitch('happy')} className={`group w-28 h-28 rounded-[2.5rem] flex flex-col items-center justify-center transition-all duration-500 ${mood === 'happy' ? 'bg-amber-400 scale-110 border-4 border-white' : 'bg-white/10 opacity-30 grayscale hover:opacity-100 hover:grayscale-0'}`}>
                  <Sun size={48} className="text-white group-hover:rotate-12 transition-transform" />
             </button>
             <span className={`text-sm font-black transition-colors ${mood === 'happy' ? 'text-amber-600' : 'text-slate-500 opacity-40'}`}>大调音阶 (Major)</span>
           </div>

           <div className="relative">
              <div className={`relative w-56 h-56 rounded-[4.5rem] flex flex-col items-center justify-center text-9xl transition-all duration-700 ${mood === 'happy' ? 'bg-white scale-105 rotate-2 animate-bounce-subtle' : 'bg-slate-800 -rotate-2'}`}>
                🐰
              </div>
              <div className={`absolute -top-4 -right-4 px-6 py-2 rounded-full border-2 font-black text-xs transition-all duration-700 ${mood === 'happy' ? 'bg-amber-100 border-amber-400 text-amber-600 scale-100' : 'bg-blue-900 border-blue-400 text-blue-300 scale-90'}`}>
                 {mood === 'happy' ? '☀️ 快乐大调' : '🌙 忧郁小调'}
              </div>
           </div>

           <div className="flex flex-col items-center gap-4">
             <button onClick={() => handleMoodSwitch('sad')} className={`group w-28 h-28 rounded-[2.5rem] flex flex-col items-center justify-center transition-all duration-500 ${mood === 'sad' ? 'bg-blue-600 scale-110 border-4 border-white/20' : 'bg-white/10 opacity-30 grayscale hover:opacity-100 hover:grayscale-0'}`}>
                  <CloudRain size={48} className="text-white group-hover:-rotate-12 transition-transform" />
             </button>
             <span className={`text-sm font-black transition-colors ${mood === 'sad' ? 'text-blue-500' : 'text-slate-500 opacity-40'}`}>小调音阶 (Minor)</span>
           </div>
        </div>

        <div className={`w-full max-w-5xl p-12 rounded-[4.5rem] border transition-all duration-1000 ${mood === 'happy' ? 'bg-white border-amber-100' : 'bg-slate-900/80 border-white/5'}`}>
           <div className="flex flex-col gap-10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-5">
                   <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white ${mood === 'happy' ? 'bg-amber-500' : 'bg-blue-600'}`}>
                      <HeartPulse size={28} className={isPlaying ? 'animate-pulse' : ''} />
                   </div>
                   <div>
                      <h4 className={`text-2xl font-black ${mood === 'happy' ? 'text-amber-950' : 'text-white'}`}>旋律进度条</h4>
                      <p className="text-xs font-bold text-slate-500 mt-1 uppercase tracking-widest">
                         {mood === 'happy' ? '当前使用：明亮欢快的 C 大调音阶' : '当前使用：静谧忧伤的 C 小调音阶'}
                      </p>
                   </div>
                </div>
                <button 
                  onClick={togglePlay}
                  className={`px-10 py-4 rounded-full font-black text-lg text-white transition-all flex items-center gap-4 ${isPlaying ? 'bg-rose-500' : mood === 'happy' ? 'bg-amber-500' : 'bg-blue-600'} active:scale-90`}
                >
                  {isPlaying ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" />}
                  {isPlaying ? '停止回放' : '运行旋律'}
                </button>
              </div>

              <div className="grid grid-cols-8 gap-6">
                {[...Array(8)].map((_, idx) => {
                  const hasNote = BIRTHDAY_MELODY.find(m => m.step === idx);
                  const isActive = currentStep === idx;
                  return (
                    <div key={idx} className="flex flex-col items-center gap-4">
                      <div className={`w-full aspect-square rounded-[2.2rem] transition-all duration-500 flex items-center justify-center border-4 ${hasNote ? mood === 'happy' ? 'bg-amber-400 border-amber-200' : 'bg-blue-600 border-blue-400' : isDark ? 'bg-white/5 border-white/5' : 'bg-slate-50 border-slate-100'} ${isActive ? 'scale-110 ring-8 ring-current/10' : 'opacity-80 scale-100'}`}>
                        {hasNote && <span className={`text-2xl font-black ${mood === 'happy' ? 'text-amber-900' : 'text-white'}`}>{hasNote.label}</span>}
                      </div>
                      <div className={`w-1.5 h-1.5 rounded-full transition-all duration-500 ${isActive ? mood === 'happy' ? 'bg-amber-500 scale-150' : 'bg-blue-500 scale-150' : 'bg-slate-300 opacity-20'}`} />
                    </div>
                  );
                })}
              </div>
           </div>
        </div>
      </main>
    </div>
  );
};

export default MoodDoodleProject;
