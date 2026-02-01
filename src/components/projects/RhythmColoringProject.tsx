
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, Trash2, X, Check, Music, MousePointer2, Sparkles, Layers } from 'lucide-react';

interface RhythmColoringProjectProps {
  onComplete: () => void;
  onBack: () => void;
  theme?: 'light' | 'dark';
}

const RhythmColoringProject: React.FC<RhythmColoringProjectProps> = ({ onComplete, onBack, theme = 'dark' }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [bpm, setBpm] = useState(100);
  const [grid, setGrid] = useState<boolean[]>(new Array(16).fill(false));
  const isDark = theme === 'dark';
  
  const timerRef = useRef<number | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  const initAudio = () => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }
  };

  const playClick = useCallback(() => {
    initAudio();
    if (!audioCtxRef.current) return;
    const osc = audioCtxRef.current.createOscillator();
    const gain = audioCtxRef.current.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(440, audioCtxRef.current.currentTime);
    gain.gain.setValueAtTime(0.3, audioCtxRef.current.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtxRef.current.currentTime + 0.1);
    
    osc.connect(gain);
    gain.connect(audioCtxRef.current.destination);
    
    osc.start();
    osc.stop(audioCtxRef.current.currentTime + 0.1);
  }, []);

  useEffect(() => {
    if (isPlaying) {
      const interval = (60 / bpm) * 1000 / 4; 
      timerRef.current = window.setInterval(() => {
        setCurrentStep((prev) => {
          const next = (prev + 1) % 16;
          if (grid[next]) playClick();
          return next;
        });
      }, interval);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isPlaying, bpm, grid, playClick]);

  const toggleStep = (idx: number) => {
    initAudio();
    const newGrid = [...grid];
    newGrid[idx] = !newGrid[idx];
    setGrid(newGrid);
    if (newGrid[idx]) playClick();
  };

  return (
    <div className={`fixed inset-0 z-[200] flex flex-col transition-colors duration-500 animate-in fade-in zoom-in-95 ${isDark ? 'bg-slate-950' : 'bg-[#fcfdff]'}`}>
      <header className={`p-8 border-b flex items-center justify-between transition-colors ${isDark ? 'bg-slate-900/50 border-white/5' : 'bg-blue-50/50 border-blue-100'}`}>
        <div className="flex items-center gap-6">
          <button onClick={onBack} className={`p-4 rounded-2xl transition-all ${isDark ? 'bg-white/5 text-slate-400 hover:text-white' : 'bg-white text-slate-500 hover:text-blue-600 border border-blue-100'}`}>
            <X size={24} />
          </button>
          <div>
            <h2 className={`text-3xl font-fredoka tracking-tight ${isDark ? 'text-white' : 'text-blue-900'}`}>L2 · 律动填色游戏</h2>
            <p className="text-sm font-black text-blue-500 uppercase tracking-widest mt-1">RHYTHM COLORING PROJECT</p>
          </div>
        </div>
        
        <div className="flex items-center gap-8">
           <div className={`flex items-center gap-6 px-6 py-3 rounded-2xl border ${isDark ? 'bg-black/30 border-white/5' : 'bg-white border-blue-100'}`}>
             <span className="text-[10px] font-black text-blue-500 uppercase">速度控制</span>
             <input type="range" min="60" max="180" value={bpm} onChange={(e) => setBpm(parseInt(e.target.value))} className="w-32 accent-blue-600" />
             <span className={`font-fredoka text-xl w-10 ${isDark ? 'text-white' : 'text-blue-900'}`}>{bpm}</span>
           </div>

           <button 
             onClick={onComplete}
             className={`px-10 py-4 rounded-2xl font-black text-lg transition-all flex items-center gap-3 bg-emerald-600 text-white hover:scale-105 active:scale-95`}
           >
             完成挑战 <Check size={20} />
           </button>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center p-12 scrollbar-hide">
        <div className="max-w-6xl w-full">
          <div className="text-center mb-16">
            <h3 className={`text-5xl font-fredoka mb-6 ${isDark ? 'text-white' : 'text-blue-950'}`}>填涂你的节拍</h3>
            <p className="text-slate-500 text-xl max-w-2xl mx-auto leading-relaxed">
              把杂乱的声响变成整齐的节奏。在大格子（正拍）和小格子（弱拍）中填入颜色，创造你的第一个 Loop！
            </p>
          </div>

          <div className={`p-16 rounded-[4.5rem] border relative transition-all ${isDark ? 'bg-slate-900/60 border-white/5' : 'bg-white border-blue-100'}`}>
            <div className="absolute -top-10 left-1/2 -translate-x-1/2 flex gap-4">
              <button 
                onClick={() => { initAudio(); setIsPlaying(!isPlaying); }}
                className={`w-24 h-24 rounded-[2rem] flex items-center justify-center transition-all border-4 ${isPlaying ? 'bg-rose-500 border-rose-400' : 'bg-blue-600 border-blue-400'} text-white active:scale-90`}
              >
                {isPlaying ? <Pause size={40} fill="currentColor" /> : <Play size={40} fill="currentColor" className="ml-2" />}
              </button>
              <button 
                onClick={() => setGrid(new Array(16).fill(false))}
                className={`w-20 h-20 rounded-[1.8rem] flex items-center justify-center border-2 transition-all ${isDark ? 'bg-slate-800 border-white/10 text-slate-400' : 'bg-slate-100 border-slate-200 text-slate-400'} hover:text-rose-500 active:scale-90`}
              >
                <Trash2 size={30} />
              </button>
            </div>

            <div className="grid grid-cols-8 gap-8">
              {grid.map((active, idx) => {
                const isQuarter = idx % 4 === 0;
                const isCurrent = currentStep === idx && isPlaying;
                return (
                  <div key={idx} className="flex flex-col items-center gap-4">
                    <button
                      onClick={() => toggleStep(idx)}
                      className={`
                        relative transition-all duration-300 transform rounded-[1.8rem]
                        ${isQuarter ? 'w-24 h-24' : 'w-20 h-20'}
                        ${active 
                          ? 'bg-blue-600 border-4 border-blue-400 scale-110' 
                          : isDark ? 'bg-white/5 border-2 border-white/5 hover:bg-white/10' : 'bg-slate-50 border-2 border-slate-100 hover:bg-blue-50'}
                        ${isCurrent ? 'ring-8 ring-blue-500/20' : ''}
                      `}
                    >
                      {active && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className={`w-3 h-3 rounded-full bg-white animate-pulse`} />
                        </div>
                      )}
                      {isCurrent && active && (
                        <div className="absolute inset-[-12px] border-4 border-blue-400 rounded-[2.2rem] animate-ping opacity-30" />
                      )}
                      {isQuarter && !active && (
                         <div className={`absolute bottom-3 right-3 w-1.5 h-1.5 rounded-full ${isDark ? 'bg-white/20' : 'bg-blue-200'}`} />
                      )}
                    </button>
                    <span className={`text-[9px] font-black uppercase tracking-widest ${isCurrent ? 'text-blue-500 scale-125 transition-transform' : 'text-slate-500 opacity-40'}`}>
                      {isQuarter ? 'Beat' : 'Step'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </main>
      <div className={`h-24 transition-colors ${isDark ? 'bg-slate-900/30' : 'bg-blue-50/50'}`} />
    </div>
  );
};

export default RhythmColoringProject;
