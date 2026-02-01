
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { X, Check, Utensils, Sparkles, Music, Trash2, Info, Layers, CloudRain, Sun } from 'lucide-react';

interface ChordBurgerProjectProps {
  onComplete: () => void;
  onBack: () => void;
  theme?: 'light' | 'dark';
}

const SCALE = [
  { name: 'C', freq: 261.63, label: '1' },
  { name: 'D', freq: 293.66, label: '2' },
  { name: 'E', freq: 329.63, label: '3' },
  { name: 'F', freq: 349.23, label: '4' },
  { name: 'G', freq: 392.00, label: '5' },
  { name: 'A', freq: 440.00, label: '6' },
  { name: 'B', freq: 493.88, label: '7' },
  { name: 'C5', freq: 523.25, label: 'i' },
];

const ChordBurgerProject: React.FC<ChordBurgerProjectProps> = ({ onComplete, onBack, theme = 'dark' }) => {
  const [bottomNote, setBottomNote] = useState<number | null>(null);
  const [middleNote, setMiddleNote] = useState<number | null>(null);
  const [topNote, setTopNote] = useState<number | null>(null);
  const [isMajor, setIsMajor] = useState(true);
  const [showExplanation, setShowExplanation] = useState(true);
  
  const audioCtxRef = useRef<AudioContext | null>(null);
  const isDark = theme === 'dark';

  const initAudio = () => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
  };

  const playChord = useCallback(() => {
    initAudio();
    const ctx = audioCtxRef.current!;
    if (ctx.state === 'suspended') ctx.resume();

    const playSingle = (freq: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.2, ctx.currentTime + 0.1);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.5);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 1.5);
    };

    if (bottomNote !== null) playSingle(SCALE[bottomNote].freq);
    if (middleNote !== null) {
      // Logic for Major/Minor 3rd
      const baseFreq = SCALE[bottomNote!].freq;
      const thirdFreq = isMajor ? baseFreq * 1.25 : baseFreq * 1.2;
      playSingle(thirdFreq);
    }
    if (topNote !== null) {
      const fifthFreq = SCALE[bottomNote!].freq * 1.5;
      playSingle(fifthFreq);
    }
  }, [bottomNote, middleNote, topNote, isMajor]);

  useEffect(() => {
    if (bottomNote !== null && middleNote !== null && topNote !== null) {
      playChord();
    }
  }, [bottomNote, middleNote, topNote, playChord]);

  const resetBurger = () => {
    setBottomNote(null);
    setMiddleNote(null);
    setTopNote(null);
  };

  const isComplete = bottomNote !== null && middleNote !== null && topNote !== null;

  return (
    <div className={`fixed inset-0 z-[200] flex flex-col transition-all duration-1000 overflow-hidden ${isComplete ? (isMajor ? 'bg-amber-50' : 'bg-blue-50') : isDark ? 'bg-slate-950' : 'bg-slate-50'}`}>
      
      {/* 动态氛围背景 */}
      <div className="absolute inset-0 pointer-events-none">
         {isComplete && isMajor && (
           <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(251,191,36,0.2)_0%,transparent_70%)] animate-pulse" />
         )}
         {isComplete && !isMajor && (
           <div className="absolute inset-0">
              {[...Array(20)].map((_, i) => (
                <div 
                  key={i} 
                  className="absolute bg-blue-400/20 w-[1px] h-12 rounded-full animate-rain-drop"
                  style={{ left: `${Math.random() * 100}%`, top: `-10%`, animationDelay: `${Math.random() * 2}s` }}
                />
              ))}
           </div>
         )}
      </div>

      <header className={`relative z-10 p-8 flex items-center justify-between transition-colors border-b backdrop-blur-xl ${isDark ? 'bg-slate-900/60 border-white/5' : 'bg-white/60 border-blue-100'}`}>
        <div className="flex items-center gap-6">
          <button onClick={onBack} className={`p-4 rounded-2xl transition-all ${isDark ? 'bg-white/5 text-slate-400' : 'bg-white border border-blue-100 text-blue-600'}`}>
            <X size={24} />
          </button>
          <div>
            <h2 className={`text-2xl font-black tracking-tight ${isDark ? 'text-white' : 'text-blue-950'}`}>L8 · 和弦叠叠乐</h2>
            <p className={`text-[10px] font-black uppercase tracking-[0.3em] mt-1 ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>CHORD BURGER LAB</p>
          </div>
        </div>
        
        <div className="flex items-center gap-6">
           <button onClick={() => setShowExplanation(!showExplanation)} className={`p-4 rounded-2xl transition-all ${showExplanation ? 'bg-blue-600 text-white' : isDark ? 'bg-white/5 text-slate-400' : 'bg-white border border-blue-100 text-slate-400'}`}>
             <Info size={24} />
           </button>
           <button 
             disabled={!isComplete}
             onClick={onComplete} 
             className={`px-10 py-4 rounded-2xl font-black text-sm text-white transition-all ${isComplete ? 'bg-emerald-600 scale-105 active:scale-95' : 'bg-slate-400 opacity-50 cursor-not-allowed'}`}
           >
             提交和弦汉堡 <Check size={18} className="ml-2 inline" />
           </button>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center p-8 relative z-10 gap-12">
        
        {showExplanation && (
          <div className={`max-w-3xl w-full p-8 rounded-[3rem] border animate-in slide-in-from-top-10 duration-500 relative overflow-hidden ${isDark ? 'bg-slate-900 border-white/5' : 'bg-white border-blue-100'}`}>
            <div className="flex gap-8 items-start">
              <div className="w-20 h-20 rounded-3xl bg-amber-500 flex flex-col items-center justify-center text-4xl border-4 border-white/10 flex-shrink-0">🍔</div>
              <div>
                <h3 className={`text-xl font-black mb-2 ${isDark ? 'text-white' : 'text-blue-950'}`}>声音的“叠罗汉”</h3>
                <p className={`text-sm leading-relaxed font-medium ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  一个音符是单薄的小人。排队走是旋律，<b>叠罗汉</b>就是和弦！<br/>
                  让我们亲手叠一个“和弦汉堡”：底层是面包，中间是灵魂配料，顶层合拢。看看到底是“金黄芝士”开心，还是“忧郁蓝莓”伤心？
                </p>
              </div>
              <button onClick={() => setShowExplanation(false)} className="absolute top-6 right-6 p-2 text-slate-500 hover:text-rose-500 transition-colors"><X size={20} /></button>
            </div>
          </div>
        )}

        <div className="flex flex-col lg:flex-row items-center justify-center gap-24 w-full max-w-7xl">
           
           {/* 左侧：配料架 */}
           <div className="flex flex-col gap-8 w-80">
              {/* 底层：面包 */}
              <div className="space-y-4">
                 <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest px-4">底层：面包底 (Root)</span>
                 <div className="grid grid-cols-4 gap-2">
                    {SCALE.slice(0, 4).map((n, i) => (
                      <button 
                        key={i} 
                        onClick={() => { setBottomNote(i); initAudio(); }}
                        className={`h-12 rounded-xl font-black border-2 transition-all ${bottomNote === i ? 'bg-orange-600 text-white border-orange-400' : isDark ? 'bg-white/5 border-white/5 text-slate-400' : 'bg-white border-slate-100 text-slate-600'}`}
                      >
                        {n.label}
                      </button>
                    ))}
                 </div>
              </div>

              {/* 中层：灵魂配料 */}
              <div className="space-y-4">
                 <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest px-4">中层：灵魂配料 (3rd)</span>
                 <div className="flex gap-4">
                    <button 
                      onClick={() => { setIsMajor(true); setMiddleNote(1); initAudio(); }}
                      className={`flex-1 h-20 rounded-2xl flex flex-col items-center justify-center border-4 transition-all ${middleNote !== null && isMajor ? 'bg-amber-400 border-white scale-105' : 'bg-slate-200/20 border-transparent grayscale opacity-40'}`}
                    >
                       <span className="text-2xl">🧀</span>
                       <span className="text-[9px] font-black uppercase tracking-tighter mt-1">金黄芝士</span>
                    </button>
                    <button 
                      onClick={() => { setIsMajor(false); setMiddleNote(1); initAudio(); }}
                      className={`flex-1 h-20 rounded-2xl flex flex-col items-center justify-center border-4 transition-all ${middleNote !== null && !isMajor ? 'bg-blue-500 border-white scale-105' : 'bg-slate-200/20 border-transparent grayscale opacity-40'}`}
                    >
                       <span className="text-2xl">🫐</span>
                       <span className="text-[9px] font-black uppercase tracking-tighter mt-1">忧郁蓝莓</span>
                    </button>
                 </div>
              </div>

              {/* 顶层：生菜 */}
              <div className="space-y-4">
                 <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest px-4">顶层：生菜盖 (5th)</span>
                 <button 
                   onClick={() => { setTopNote(1); initAudio(); }}
                   className={`w-full h-16 rounded-2xl flex items-center justify-center gap-3 border-4 transition-all ${topNote !== null ? 'bg-emerald-500 border-white' : 'bg-slate-200/20 border-transparent grayscale opacity-40'}`}
                 >
                    <span className="text-2xl">🥬</span>
                    <span className="text-sm font-black text-white">新鲜生菜</span>
                 </button>
              </div>

              <button onClick={resetBurger} className="mt-4 flex items-center justify-center gap-2 text-slate-500 hover:text-rose-500 transition-colors font-black text-xs uppercase">
                 <Trash2 size={16} /> 重置汉堡
              </button>
           </div>

           {/* 中间：汉堡可视化 */}
           <div className="relative flex flex-col items-center justify-center min-h-[400px] w-[300px]">
              
              {/* 叠罗汉的人 (视觉层) */}
              <div className={`absolute -bottom-10 transition-all duration-700 ${isComplete ? 'scale-110' : 'scale-90 opacity-20'}`}>
                 <div className="flex flex-col items-center">
                    {/* Top Person */}
                    <div className={`w-12 h-12 rounded-full bg-emerald-500 border-4 border-white flex items-center justify-center text-xl transition-all duration-500 ${topNote !== null ? 'translate-y-0 opacity-100' : '-translate-y-20 opacity-0'}`}>🥕</div>
                    {/* Middle Person */}
                    <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-2xl border-4 border-white transition-all duration-500 ${middleNote !== null ? 'translate-y-0 opacity-100' : '-translate-y-10 opacity-0'} ${isMajor ? 'bg-amber-400' : 'bg-blue-500'}`}>🥩</div>
                    {/* Bottom Person */}
                    <div className={`w-20 h-20 rounded-3xl bg-orange-600 border-4 border-white flex items-center justify-center text-3xl transition-all duration-500 ${bottomNote !== null ? 'opacity-100' : 'opacity-0 scale-50'}`}>🥯</div>
                 </div>
              </div>

              {/* 汉堡层 (叠加层) */}
              <div className="flex flex-col items-center gap-1 z-10">
                 {/* Top Bun */}
                 <div className={`w-48 h-12 bg-orange-200 rounded-t-full border-b-4 border-orange-800/10 transition-all duration-500 ${topNote !== null ? 'translate-y-0 opacity-100' : '-translate-y-40 opacity-0'}`} />
                 
                 {/* Lettuce */}
                 <div className={`w-52 h-4 bg-emerald-400 rounded-full transition-all duration-500 delay-75 ${topNote !== null ? 'scale-100 opacity-100' : 'scale-0 opacity-0'}`} />

                 {/* Middle Ingredient */}
                 <div className={`w-44 h-8 rounded-lg transition-all duration-500 ${middleNote !== null ? 'scale-100 opacity-100' : 'scale-0 opacity-0'} ${isMajor ? 'bg-amber-300' : 'bg-blue-600'}`}>
                    {middleNote !== null && isMajor && <div className="absolute inset-0 bg-white/20 animate-pulse rounded-lg" />}
                 </div>

                 {/* Bottom Bun */}
                 <div className={`w-48 h-16 bg-orange-300 rounded-b-3xl transition-all duration-500 ${bottomNote !== null ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0'}`}>
                    {bottomNote !== null && <div className="absolute inset-0 flex items-center justify-center font-black text-orange-900/40 text-2xl">{SCALE[bottomNote].label}</div>}
                 </div>
              </div>

              {isComplete && (
                <div className="absolute -top-12 animate-bounce">
                  <div className={`px-6 py-2 rounded-2xl font-black text-sm border-2 ${isMajor ? 'bg-amber-400 text-amber-900 border-white' : 'bg-blue-600 text-white border-blue-400'}`}>
                    {isMajor ? '快乐大三和弦！✨' : '忧郁小三和弦... 🌧️'}
                  </div>
                </div>
              )}
           </div>

           {/* 右侧：知识卡片 */}
           <div className={`w-80 p-8 rounded-[2.5rem] border transition-all ${isDark ? 'bg-slate-900 border-white/5' : 'bg-white border-blue-100'}`}>
              <div className="flex items-center gap-4 mb-6">
                 <Layers className="text-blue-500" size={24} />
                 <h4 className="font-black text-lg">和弦公式</h4>
              </div>
              
              <div className="space-y-6">
                 <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-orange-600 flex items-center justify-center text-white font-black">1</div>
                    <span className="text-xs font-bold text-slate-500">主音：汉堡的根基</span>
                 </div>
                 <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white font-black ${isMajor ? 'bg-amber-400' : 'bg-blue-500'}`}>3</div>
                    <span className="text-xs font-bold text-slate-500">三音：决定是哭还是笑</span>
                 </div>
                 <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center text-white font-black">5</div>
                    <span className="text-xs font-bold text-slate-500">五音：让声音更丰满</span>
                 </div>
              </div>

              <div className={`mt-10 p-4 rounded-2xl border-2 border-dashed transition-colors ${isMajor ? 'bg-amber-400/5 border-amber-400/20' : 'bg-blue-500/5 border-blue-500/20'}`}>
                 <p className="text-[10px] font-medium leading-relaxed italic text-slate-400">
                    和弦就像调色盘，不同的组合能画出不同的心情。大和弦是明亮的阳光，小和弦是静谧的雨天。
                 </p>
              </div>
           </div>
        </div>
      </main>

      <footer className={`h-14 flex items-center justify-center transition-colors border-t ${isDark ? 'bg-black/40 border-white/5' : 'bg-white border-blue-100'}`}>
         <div className="flex items-center gap-3 opacity-30">
            <Utensils size={14} />
            <p className="text-[9px] font-black uppercase tracking-[0.8em]">Harmonic Stacking Logic · Triad Mod 1.0</p>
         </div>
      </footer>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes rain-drop { to { transform: translateY(110vh); } }
        .animate-rain-drop { animation: rain-drop linear infinite; }
      `}} />
    </div>
  );
};

export default ChordBurgerProject;
