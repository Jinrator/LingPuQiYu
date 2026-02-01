
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, Trash2, X, Check, Clock, Drum, Music, Activity } from 'lucide-react';

interface RhythmLegoProjectProps {
  onComplete: () => void;
  onBack: () => void;
  theme?: 'light' | 'dark';
}

const TRACKS = [
  { id: 'hihat', name: '擦片 (Hi-hat)', icon: '✨', color: 'bg-yellow-400', activeBorder: 'border-yellow-300', shadow: '', sound: '次' },
  { id: 'snare', name: '军鼓 (Snare)', icon: '👏', color: 'bg-blue-500', activeBorder: 'border-blue-400', shadow: '', sound: '啪' },
  { id: 'kick', name: '底鼓 (Kick)', icon: '🥁', color: 'bg-rose-500', activeBorder: 'border-rose-400', shadow: '', sound: '咚' },
];

const RhythmLegoProject: React.FC<RhythmLegoProjectProps> = ({ onComplete, onBack, theme = 'dark' }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [bpm, setBpm] = useState(110);
  const [grid, setGrid] = useState<Record<string, boolean[]>>({
    kick: new Array(16).fill(false),
    snare: new Array(16).fill(false),
    hihat: new Array(16).fill(false),
  });
  
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

  const playSound = useCallback((type: string) => {
    initAudio();
    if (!audioCtxRef.current) return;
    const ctx = audioCtxRef.current;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    if (type === 'kick') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(150, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.5, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
    } else if (type === 'snare') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(250, ctx.currentTime);
      gain.gain.setValueAtTime(0.4, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
    } else {
      osc.type = 'square';
      osc.frequency.setValueAtTime(1000, ctx.currentTime);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);
    }
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.2);
  }, []);

  useEffect(() => {
    if (isPlaying) {
      const interval = (60 / bpm) * 1000 / 4; 
      timerRef.current = window.setInterval(() => {
        setCurrentStep((prev) => {
          const next = (prev + 1) % 16;
          Object.keys(grid).forEach(trackId => {
            if (grid[trackId][next]) playSound(trackId);
          });
          return next;
        });
      }, interval);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isPlaying, bpm, grid, playSound]);

  const toggleStep = (trackId: string, idx: number) => {
    initAudio();
    const newGrid = { ...grid };
    newGrid[trackId] = [...newGrid[trackId]];
    newGrid[trackId][idx] = !newGrid[trackId][idx];
    setGrid(newGrid);
    if (newGrid[trackId][idx]) playSound(trackId);
  };

  return (
    <div className={`fixed inset-0 z-[200] flex flex-col transition-colors duration-500 animate-in fade-in ${isDark ? 'bg-[#0a0f1e] text-slate-200' : 'bg-[#f0f4f8] text-slate-900'}`}>
      <header className={`p-8 border-b flex items-center justify-between transition-colors ${isDark ? 'bg-[#0f172a]/80 border-white/5 backdrop-blur-md' : 'bg-white border-slate-200'}`}>
        <div className="flex items-center gap-6">
          <button onClick={onBack} className={`p-4 rounded-2xl transition-all ${isDark ? 'bg-white/5 text-slate-400 hover:text-white border border-white/10' : 'bg-white text-slate-500 hover:text-blue-600 border'}`}>
            <X size={24} />
          </button>
          <div>
            <h2 className={`text-2xl font-black tracking-tight ${isDark ? 'text-white' : 'text-blue-950'}`}>节奏乐高工厂</h2>
            <p className="text-[10px] font-black text-blue-500 uppercase tracking-[0.3em] mt-1">L3 · RHYTHM LEGO LAB</p>
          </div>
        </div>
        <div className="flex items-center gap-8">
           <div className={`flex items-center gap-6 px-6 py-2.5 rounded-2xl border transition-colors ${isDark ? 'bg-black/30 border-white/10' : 'bg-white border-slate-200'}`}>
             <span className="text-[9px] font-black text-slate-500 uppercase">速度 (BPM)</span>
             <input type="range" min="60" max="180" value={bpm} onChange={(e) => setBpm(parseInt(e.target.value))} className="w-32 accent-blue-600 h-1.5" />
             <span className="font-fredoka text-lg w-8 text-blue-500">{bpm}</span>
           </div>
           <button 
             onClick={onComplete}
             className="px-8 py-3 bg-blue-600 rounded-xl font-black text-sm text-white hover:bg-blue-500 active:scale-95 transition-all flex items-center gap-2"
           >
             保存节奏 <Check size={18} />
           </button>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center p-8 overflow-y-auto scrollbar-hide">
        <div className="w-full max-w-7xl">
          <div className="text-center mb-12">
            <h3 className={`text-4xl font-fredoka mb-4 ${isDark ? 'text-white' : 'text-blue-950'}`}>拼接你的乐高节拍</h3>
            <p className="text-slate-500 text-lg max-w-2xl mx-auto font-medium">
              点击这些大大的彩色方块，像玩乐高一样拼出你的第一个 16 步节奏！
            </p>
          </div>

          <div className={`p-12 rounded-[4rem] border transition-all relative ${isDark ? 'bg-[#111827]/80 border-white/5' : 'bg-white border-slate-200'}`}>
            <div className="flex flex-col gap-8 relative z-10">
              {TRACKS.map((track) => (
                <div key={track.id} className="flex items-center gap-8 relative">
                  <div className={`w-44 h-24 rounded-[2rem] flex flex-col items-center justify-center gap-1 border-2 transition-all ${isDark ? 'bg-white/5 border-white/5' : 'bg-slate-50 border-slate-100'}`}>
                    <span className="text-3xl">{track.icon}</span>
                    <span className="text-[10px] font-black tracking-widest uppercase opacity-60">{track.name.split(' ')[0]}</span>
                  </div>
                  <div className="flex-1 grid grid-cols-8 lg:grid-cols-16 gap-3">
                    {grid[track.id].map((active, idx) => {
                      const isCurrent = currentStep === idx && isPlaying;
                      const isQuarter = idx % 4 === 0;
                      return (
                        <button
                          key={idx}
                          onClick={() => toggleStep(track.id, idx)}
                          className={`
                            relative aspect-square rounded-[1.2rem] transition-all duration-300 transform
                            ${active 
                              ? `${track.color} ${track.shadow} border-4 ${track.activeBorder} scale-110 -translate-y-1` 
                              : isDark 
                                ? `bg-white/5 border-2 border-white/5 hover:bg-white/10 ${isQuarter ? 'border-white/10' : ''}` 
                                : `bg-slate-100 border-2 border-slate-100 hover:bg-white hover:border-blue-100 ${isQuarter ? 'bg-slate-200 border-slate-200' : ''}`}
                            ${isCurrent ? 'ring-4 ring-blue-500/30 scale-105' : ''}
                          `}
                        >
                          <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full transition-all ${active ? 'bg-white/40' : 'bg-current opacity-10'}`} />
                          {isQuarter && !active && (
                            <div className={`absolute bottom-2 right-2 w-1.5 h-1.5 rounded-full ${isDark ? 'bg-white/10' : 'bg-slate-400/20'}`} />
                          )}
                          {isCurrent && active && (
                            <div className={`absolute inset-[-8px] border-4 ${track.activeBorder} rounded-[1.5rem] animate-ping opacity-20`} />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-center mt-12 gap-6">
              <button 
                onClick={() => { initAudio(); setIsPlaying(!isPlaying); }}
                className={`w-24 h-24 rounded-[2.5rem] flex items-center justify-center transition-all border-4 ${isPlaying ? 'bg-rose-500 border-rose-400' : 'bg-emerald-600 border-emerald-400'} text-white active:scale-90`}
              >
                {isPlaying ? <Pause size={36} fill="currentColor" /> : <Play size={36} fill="currentColor" className="ml-2" />}
              </button>
              <button 
                onClick={() => setGrid({ kick: new Array(16).fill(false), snare: new Array(16).fill(false), hihat: new Array(16).fill(false) })}
                className={`w-20 h-20 rounded-[2rem] flex items-center justify-center border-2 transition-all ${isDark ? 'bg-slate-800 border-white/10 text-slate-500' : 'bg-slate-100 border-slate-200 text-slate-400'} hover:text-rose-500 active:scale-90`}
              >
                <Trash2 size={28} />
              </button>
            </div>
          </div>

          <div className="mt-12 flex justify-center gap-10">
            {TRACKS.map(track => (
              <div key={track.id} className="flex items-center gap-3">
                <div className={`w-4 h-4 rounded-full ${track.color} ${track.shadow}`} />
                <span className="text-xs font-black uppercase tracking-widest opacity-60">{track.name}</span>
              </div>
            ))}
          </div>
        </div>
      </main>
      <footer className={`h-12 flex items-center justify-center transition-colors ${isDark ? 'bg-[#0f172a]/40' : 'bg-slate-200/30'}`}>
        <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.5em]">Jinrator Lego Lab · Audio Engine 2.0</p>
      </footer>
    </div>
  );
};

export default RhythmLegoProject;
