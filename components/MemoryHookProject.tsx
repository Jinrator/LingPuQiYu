
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { X, Check, Fish, Sparkles, MessageCircle, Play, Pause, Trash2, Repeat, Zap, Waves, Volume2, Music } from 'lucide-react';

interface MelodyFragment {
  id: string;
  name: string;
  notes: number[]; 
  color: string;
  emoji: string;
}

const MOCK_FRAGMENTS: MelodyFragment[] = [
  { id: 'f1', name: '夏日闪闪', notes: [0, 2, 4, 7], color: 'bg-yellow-400', emoji: '✨' },
  { id: 'f2', name: '深夜电波', notes: [7, 5, 4, 0], color: 'bg-indigo-500', emoji: '🌙' },
  { id: 'f3', name: '彩虹阶梯', notes: [0, 1, 2, 3], color: 'bg-rose-400', emoji: '🌈' },
  { id: 'f4', name: '心跳加速', notes: [0, 0, 7, 7], color: 'bg-emerald-500', emoji: '💓' },
];

const SCALE = [261.63, 293.66, 329.63, 349.23, 392.00, 440.00, 493.88, 523.25];

const MemoryHookProject: React.FC<{ onComplete: () => void; onBack: () => void; theme?: 'light' | 'dark' }> = ({ onComplete, onBack, theme = 'dark' }) => {
  const [hookSlots, setHookSlots] = useState<(MelodyFragment | null)[]>([null, null, null, null]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStep, setCurrentStep] = useState(-1);
  const [showAITip, setShowAITip] = useState(false);
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
  };

  const playFragment = useCallback((fragment: MelodyFragment) => {
    initAudio();
    const ctx = audioCtxRef.current!;
    if (ctx.state === 'suspended') ctx.resume();

    fragment.notes.forEach((noteIdx, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(SCALE[noteIdx % 8], ctx.currentTime + i * 0.15);
      gain.gain.setValueAtTime(0, ctx.currentTime + i * 0.15);
      gain.gain.linearRampToValueAtTime(0.2, ctx.currentTime + i * 0.15 + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.15 + 0.3);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + i * 0.15);
      osc.stop(ctx.currentTime + i * 0.15 + 0.3);
    });
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
    initAudio();
    const firstEmpty = hookSlots.findIndex(s => s === null);
    if (firstEmpty !== -1) {
      const newSlots = [...hookSlots];
      newSlots[firstEmpty] = fragment;
      setHookSlots(newSlots);
      playFragment(fragment);
      
      if (newSlots.filter(s => s !== null).length === 1) {
        setShowAITip(true);
      }
    }
  };

  const duplicateHook = () => {
    initAudio();
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

  return (
    <div className={`fixed inset-0 z-[200] flex flex-col transition-all duration-1000 overflow-hidden ${isDark ? 'bg-slate-950' : 'bg-blue-50'}`}>
      <header className={`relative z-10 p-8 flex items-center justify-between transition-colors border-b backdrop-blur-xl ${isDark ? 'bg-slate-900/60 border-white/5' : 'bg-white/60 border-blue-100'}`}>
        <div className="flex items-center gap-6">
          <button onClick={onBack} className={`p-4 rounded-2xl transition-all shadow-sm ${isDark ? 'bg-white/5 text-slate-400 hover:text-white' : 'bg-white border border-blue-100 text-blue-600'}`}>
            <X size={24} />
          </button>
          <div>
            <h2 className={`text-2xl font-black tracking-tight ${isDark ? 'text-white' : 'text-blue-950'}`}>L12 · 记忆钩子 (Hook)</h2>
            <p className={`text-[10px] font-black uppercase tracking-[0.3em] mt-1 ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>CATCHY MELODY REPETITION</p>
          </div>
        </div>
        <button 
          disabled={hookSlots.every(s => s === null)}
          onClick={onComplete}
          className={`px-10 py-4 rounded-2xl font-black text-sm text-white shadow-xl transition-all ${!hookSlots.every(s => s === null) ? 'bg-emerald-600 scale-105 hover:bg-emerald-500' : 'bg-slate-400 opacity-50 cursor-not-allowed'}`}
        >
          这就是我的 Hook! <Check size={18} className="ml-2 inline" />
        </button>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center p-8 relative z-10 gap-12">
        <div className="w-full max-w-5xl flex flex-col gap-8">
           <div className="flex items-center justify-between px-4">
              <h3 className={`text-xl font-black flex items-center gap-3 ${isDark ? 'text-white' : 'text-blue-950'}`}>
                 <Zap className="text-yellow-400" /> 副歌高潮区
              </h3>
              <button 
                onClick={duplicateHook}
                disabled={!hookSlots.some(s => s !== null)}
                className={`flex items-center gap-2 px-6 py-2 rounded-full font-black text-xs uppercase tracking-widest transition-all ${hookSlots.some(s => s !== null) ? 'bg-blue-600 text-white shadow-lg hover:scale-105' : 'bg-slate-400 opacity-30 cursor-not-allowed'}`}
              >
                 <Repeat size={14} /> 一键洗脑 (重复填充)
              </button>
           </div>
           
           <div className="grid grid-cols-4 gap-6 h-64">
              {hookSlots.map((slot, idx) => (
                <div 
                  key={idx}
                  className={`relative rounded-[3rem] border-4 border-dashed transition-all duration-500 flex flex-col items-center justify-center gap-4 overflow-hidden ${slot ? `${slot.color} border-white shadow-2xl scale-105` : isDark ? 'bg-white/5 border-white/10' : 'bg-white border-blue-100'}`}
                >
                   {slot ? (
                     <>
                        <span className="text-6xl animate-bounce-subtle">{slot.emoji}</span>
                        <span className="text-xs font-black text-white/80 uppercase">{slot.name}</span>
                        <button 
                          onClick={() => clearSlot(idx)}
                          className="absolute top-4 right-4 p-2 bg-black/20 text-white rounded-full hover:bg-black/40"
                        >
                          <X size={14} />
                        </button>
                        {currentStep === idx && (
                          <div className="absolute inset-0 border-8 border-white animate-pulse pointer-events-none" />
                        )}
                     </>
                   ) : (
                     <div className="text-slate-400 flex flex-col items-center gap-2">
                        <Fish size={32} className="opacity-20" />
                        <span className="text-[10px] font-black uppercase tracking-widest opacity-40">等待垂钓</span>
                     </div>
                   )}
                </div>
              ))}
           </div>

           <div className="flex justify-center">
              <button 
                onClick={() => { initAudio(); setIsPlaying(!isPlaying); }}
                className={`w-20 h-20 rounded-full flex items-center justify-center shadow-2xl transition-all ${isPlaying ? 'bg-rose-500' : 'bg-blue-600'} text-white`}
              >
                 {isPlaying ? <Pause size={32} fill="currentColor" /> : <Play size={32} fill="currentColor" className="ml-1" />}
              </button>
           </div>
        </div>

        <div className={`w-full max-w-5xl p-10 rounded-[4rem] border transition-all duration-700 relative overflow-hidden ${isDark ? 'bg-slate-900/60 border-white/5' : 'bg-white border-blue-100 shadow-2xl'}`}>
           <div className="absolute inset-0 pointer-events-none">
              <div className="absolute inset-0 bg-blue-500/5 animate-pulse" />
              <Waves className="absolute bottom-4 right-4 text-blue-500/10" size={120} />
           </div>

           <div className="relative z-10 flex flex-col gap-8">
              <div className="flex items-center gap-4">
                 <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-lg"><Fish size={24} /></div>
                 <div>
                    <h4 className={`text-xl font-black ${isDark ? 'text-white' : 'text-blue-900'}`}>灵感池</h4>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Your Inspiration Pool</p>
                 </div>
              </div>

              <div className="grid grid-cols-4 gap-6">
                 {MOCK_FRAGMENTS.map(frag => (
                   <button 
                     key={frag.id}
                     onClick={() => addToSlot(frag)}
                     className={`group p-6 rounded-[2.5rem] border-2 transition-all flex flex-col items-center gap-3 hover:scale-105 active:scale-95 ${isDark ? 'bg-white/5 border-white/5 hover:border-blue-500/50' : 'bg-slate-50 border-slate-100 hover:border-blue-400'}`}
                   >
                      <div className={`w-20 h-20 rounded-full ${frag.color} flex items-center justify-center text-4xl shadow-xl transition-transform group-hover:rotate-12`}>
                         {frag.emoji}
                      </div>
                      <span className={`font-black text-sm ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{frag.name}</span>
                   </button>
                 ))}
              </div>
           </div>
        </div>
      </main>

      <footer className={`h-14 flex items-center justify-center transition-colors border-t ${isDark ? 'bg-black/40 border-white/5' : 'bg-white border-blue-100'}`}>
         <div className="flex items-center gap-3 opacity-30">
            <Volume2 size={14} />
            <p className="text-[9px] font-black uppercase tracking-[0.8em]">Hook Generation Engine v1.2 · Memory Persistence Active</p>
         </div>
      </footer>
    </div>
  );
};

export default MemoryHookProject;
