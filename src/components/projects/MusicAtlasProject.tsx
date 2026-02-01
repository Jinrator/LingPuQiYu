
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { X, Check, Map, Compass, Play, Pause, Sparkles, MessageCircle, ArrowRight, Wind, Zap, Sun, Volume2, Info } from 'lucide-react';

interface MusicAtlasProjectProps {
  onComplete: () => void;
  onBack: () => void;
  theme?: 'light' | 'dark';
}

const MusicAtlasProject: React.FC<MusicAtlasProjectProps> = ({ onComplete, onBack, theme = 'dark' }) => {
  const [activeSection, setActiveSection] = useState<'A' | 'B'>('A');
  const [isPlaying, setIsPlaying] = useState(false);
  const [energy, setEnergy] = useState(30); // 0-100
  const [showAITip, setShowAITip] = useState(false);
  const isDark = theme === 'dark';

  const audioCtxRef = useRef<AudioContext | null>(null);
  const timerRef = useRef<number | null>(null);
  const currentStepRef = useRef(0);

  const initAudio = () => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
  };

  const playSound = useCallback((freq: number, gainValue: number, type: OscillatorType = 'sine', decay = 0.5) => {
    initAudio();
    const ctx = audioCtxRef.current!;
    if (ctx.state === 'suspended') ctx.resume();

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    
    // 软化包络：增加 0.02s 的淡入，避免瞬态刺耳
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(gainValue, ctx.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + decay);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.start();
    osc.stop(ctx.currentTime + decay);
  }, []);

  const runSequence = useCallback(() => {
    const step = currentStepRef.current % 8;
    
    // 主歌 A: 稀疏且极其柔和
    if (activeSection === 'A') {
      if (step === 0 || step === 4) playSound(261.63, 0.15, 'sine', 0.8); // C4
      if (step === 2) playSound(329.63, 0.1, 'sine', 0.6); // E4
    } 
    // 副歌 B: 密集但不再刺耳
    else {
      // 1. 稳重的底鼓 (Triangle 波形比 Sine 更厚实但不尖锐)
      if (step % 2 === 0) playSound(60, 0.4, 'triangle', 0.3); 
      
      // 2. 密集的动感音 (改用 Sine 波，频率随能量变化更平滑)
      // 使用更和谐的倍数，能量越高声音越清脆，而非刺耳
      const hiFreq = 523.25 * (1 + (energy / 200)); 
      if (step % 1 === 0) {
        // 偶数步稍微强一点，奇数步弱一点，形成律动
        const stepGain = step % 2 === 0 ? 0.08 : 0.04;
        playSound(hiFreq, stepGain * (energy / 50), 'sine', 0.15);
      }
      
      // 3. 支撑和弦 (使用 Sine，持续时间略长)
      if (step === 0 || step === 4) {
          playSound(261.63, 0.1, 'sine', 1.0);
          playSound(329.63, 0.1, 'sine', 1.0);
          playSound(392.00, 0.1, 'sine', 1.0);
      }
    }

    currentStepRef.current++;
  }, [activeSection, energy, playSound]);

  useEffect(() => {
    if (isPlaying) {
      timerRef.current = window.setInterval(runSequence, 200);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isPlaying, runSequence]);

  const handleSwitch = (section: 'A' | 'B') => {
    if (section === 'B' && activeSection === 'A') {
      setShowAITip(true);
      setEnergy(80);
    } else if (section === 'A') {
      setEnergy(30);
    }
    setActiveSection(section);
  };

  return (
    <div className={`fixed inset-0 z-[200] flex flex-col transition-all duration-1000 overflow-hidden ${activeSection === 'A' ? (isDark ? 'bg-slate-950' : 'bg-blue-50') : (isDark ? 'bg-indigo-950' : 'bg-orange-50')}`}>
      
      {/* 动态地图背景装饰 */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
         {activeSection === 'A' ? (
           <div className="absolute inset-0 opacity-40">
              <Wind className="absolute top-20 left-20 text-blue-400/20 animate-pulse" size={200} />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] border border-blue-400/10 rounded-full animate-spin-slow" />
           </div>
         ) : (
           <div className="absolute inset-0 opacity-60">
              <Zap className="absolute bottom-20 right-20 text-orange-400/20 animate-bounce" size={240} />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(249,115,22,0.1)_0%,transparent_70%)] animate-pulse" />
           </div>
         )}
      </div>

      <header className={`relative z-10 p-8 flex items-center justify-between transition-colors border-b backdrop-blur-xl ${isDark ? 'bg-slate-900/60 border-white/5' : 'bg-white/60 border-blue-100'}`}>
        <div className="flex items-center gap-6">
          <button onClick={onBack} className={`p-4 rounded-2xl transition-all shadow-sm ${isDark ? 'bg-white/5 text-slate-400' : 'bg-white border border-blue-100 text-blue-600'}`}>
            <X size={24} />
          </button>
          <div>
            <h2 className={`text-2xl font-black tracking-tight ${isDark ? 'text-white' : 'text-blue-950'}`}>L11 · 音乐地图册</h2>
            <p className={`text-[10px] font-black uppercase tracking-[0.3em] mt-1 ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>AB STRUCTURE ATLAS</p>
          </div>
        </div>
        
        <button 
          onClick={onComplete}
          className={`px-10 py-4 rounded-2xl font-black text-sm text-white shadow-xl transition-all bg-emerald-600 hover:bg-emerald-500 active:scale-95`}
        >
          绘制完成 <Check size={18} className="ml-2 inline" />
        </button>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center p-8 relative z-10 gap-12">
        
        {/* 顶部段落切换器 */}
        <div className={`p-3 rounded-[3rem] flex gap-3 shadow-2xl transition-all duration-500 ${isDark ? 'bg-white/5 border border-white/10' : 'bg-white border border-blue-100'}`}>
           <button 
             onClick={() => handleSwitch('A')}
             className={`px-12 py-5 rounded-[2.5rem] flex items-center gap-4 transition-all duration-500 ${activeSection === 'A' ? 'bg-blue-600 text-white shadow-lg scale-105' : 'text-slate-400 hover:bg-white/5'}`}
           >
              <Wind size={24} />
              <div className="text-left">
                 <div className="font-black text-lg leading-none">主歌段 (A)</div>
                 <div className="text-[9px] font-bold uppercase tracking-widest opacity-60">Verse Island</div>
              </div>
           </button>
           <button 
             onClick={() => handleSwitch('B')}
             className={`px-12 py-5 rounded-[2.5rem] flex items-center gap-4 transition-all duration-500 ${activeSection === 'B' ? 'bg-orange-500 text-white shadow-lg scale-105' : 'text-slate-400 hover:bg-white/5'}`}
           >
              <Zap size={24} />
              <div className="text-left">
                 <div className="font-black text-lg leading-none">副歌段 (B)</div>
                 <div className="text-[9px] font-bold uppercase tracking-widest opacity-60">Chorus peak</div>
              </div>
           </button>
        </div>

        {/* 核心对比画布 */}
        <div className="flex flex-col lg:flex-row items-center justify-center gap-16 w-full max-w-7xl">
           
           {/* 地图视觉容器 */}
           <div className={`relative flex-1 aspect-square max-w-[500px] rounded-[4rem] border-4 transition-all duration-1000 flex flex-col items-center justify-center overflow-hidden ${activeSection === 'A' ? 'bg-blue-400/10 border-blue-400/20' : 'bg-orange-500/10 border-orange-500/20 shadow-[0_0_100px_rgba(249,115,22,0.2)]'}`}>
              
              {/* 地图元素 A: 安静的小径 */}
              <div className={`absolute inset-0 transition-opacity duration-1000 ${activeSection === 'A' ? 'opacity-100' : 'opacity-0'}`}>
                 <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3/4 h-3/4 border-2 border-dashed border-blue-400/30 rounded-full" />
                 <div className="absolute top-20 right-20 w-12 h-12 bg-blue-400/20 rounded-full animate-pulse" />
                 <div className="absolute bottom-40 left-20 w-8 h-8 bg-blue-400/20 rounded-full animate-bounce" />
                 <div className="absolute inset-0 flex flex-col items-center justify-center text-blue-500/40">
                    <Sun size={80} className="mb-4" />
                    <span className="font-black uppercase tracking-[0.5em] text-xs">平 静 叙 事</span>
                 </div>
              </div>

              {/* 地图元素 B: 爆发的山峰 */}
              <div className={`absolute inset-0 transition-opacity duration-1000 ${activeSection === 'B' ? 'opacity-100' : 'opacity-0'}`}>
                 {[...Array(8)].map((_, i) => (
                    <div 
                      key={i} 
                      className="absolute bg-orange-500/40 rounded-full animate-ping"
                      style={{ 
                        width: Math.random() * 50 + 20, 
                        height: Math.random() * 50 + 20, 
                        top: Math.random() * 100 + '%', 
                        left: Math.random() * 100 + '%',
                        animationDuration: (Math.random() * 2 + 1) + 's'
                      }}
                    />
                 ))}
                 <div className="absolute inset-0 flex flex-col items-center justify-center text-orange-600">
                    <Zap size={100} className="mb-4 animate-bounce" />
                    <span className="font-black uppercase tracking-[0.5em] text-xs">高 潮 爆 发</span>
                 </div>
              </div>

              {/* 实时能量核心 */}
              <div 
                className={`absolute w-32 h-32 rounded-full blur-2xl transition-all duration-500 ${activeSection === 'A' ? 'bg-blue-400/20' : 'bg-orange-500/50 scale-150'}`} 
                style={{ opacity: isPlaying ? 1 : 0.3 }}
              />
           </div>

           {/* 右侧：结构升级器面板 */}
           <div className={`w-96 p-10 rounded-[3.5rem] border shadow-2xl transition-all duration-700 ${isDark ? 'bg-slate-900 border-white/5' : 'bg-white border-blue-100'}`}>
              <div className="flex items-center gap-4 mb-8">
                 <div className={`p-3 rounded-2xl ${activeSection === 'A' ? 'bg-blue-600' : 'bg-orange-500'} text-white shadow-lg transition-colors`}>
                    <Volume2 size={24} />
                 </div>
                 <h4 className={`text-xl font-black ${isDark ? 'text-white' : 'text-blue-900'}`}>能量拉杆</h4>
              </div>

              <div className="space-y-12">
                 <div className="relative pt-12">
                    <div className="absolute top-0 left-0 w-full flex justify-between px-2 text-[10px] font-black uppercase text-slate-500 tracking-tighter">
                       <span>散漫</span>
                       <span>密集</span>
                    </div>
                    <input 
                      type="range" 
                      min="10" max="100" 
                      value={energy} 
                      onChange={(e) => setEnergy(parseInt(e.target.value))}
                      className={`w-full h-4 rounded-full appearance-none cursor-pointer transition-all ${activeSection === 'A' ? 'accent-blue-600 bg-blue-100' : 'accent-orange-500 bg-orange-100'}`}
                    />
                    <div className="mt-4 flex justify-between items-end">
                       <span className="text-3xl font-fredoka text-blue-500">{energy}</span>
                       <span className={`text-[10px] font-black uppercase tracking-widest ${energy > 70 ? 'text-orange-500 animate-pulse' : 'text-slate-400'}`}>
                          {energy > 70 ? '能量溢出!' : '状态稳定'}
                       </span>
                    </div>
                 </div>

                 <div className={`p-6 rounded-3xl border-2 border-dashed transition-all ${activeSection === 'B' ? 'bg-orange-50 border-orange-200' : 'bg-blue-50 border-blue-100'}`}>
                    <div className="flex items-start gap-4">
                       <Info className={activeSection === 'B' ? 'text-orange-500' : 'text-blue-500'} size={20} />
                       <p className={`text-xs font-bold leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                          {activeSection === 'A' ? '主歌是在讲故事，保持安静和整齐，让听众听清你的话。' : '副歌是你的呐喊！把音量加大，节奏加密，让大家和你一起跳！'}
                       </p>
                    </div>
                 </div>

                 <button 
                   onClick={() => { initAudio(); setIsPlaying(!isPlaying); }}
                   className={`w-full py-6 rounded-3xl font-black text-xl text-white shadow-2xl transition-all active:scale-95 ${isPlaying ? 'bg-rose-500' : 'bg-blue-600 hover:bg-blue-500'}`}
                 >
                   {isPlaying ? '停止预览' : '开启航行'}
                 </button>
              </div>
           </div>
        </div>

        {/* AI 助教悬浮提示 */}
        {showAITip && (
          <div className="fixed bottom-12 left-1/2 -translate-x-1/2 z-[300] animate-in slide-in-from-bottom-20 duration-500">
             <div className={`px-10 py-6 rounded-[2.5rem] bg-slate-900 border-4 border-orange-500 shadow-2xl flex items-center gap-6 max-w-2xl`}>
                <div className="w-16 h-16 rounded-2xl bg-orange-500 flex items-center justify-center text-4xl shadow-xl flex-shrink-0">🤖</div>
                <div className="flex-1">
                   <h5 className="text-white font-black text-lg mb-1">AI 助教：发现高潮！</h5>
                   <p className="text-slate-400 text-sm font-medium">副歌部分能量爆棚！我已经自动帮你把<b>底鼓加密</b>了，听听看，是不是更有那种“大声喊出来”的感觉？</p>
                </div>
                <button onClick={() => setShowAITip(false)} className="text-white/40 hover:text-white"><X size={24} /></button>
             </div>
          </div>
        )}

      </main>

      <footer className={`h-14 flex items-center justify-center transition-colors border-t ${isDark ? 'bg-black/40 border-white/5' : 'bg-white border-blue-100'}`}>
         <div className="flex items-center gap-3 opacity-30">
            <Map size={14} />
            <p className="text-[9px] font-black uppercase tracking-[0.8em]">Musical Structure Atlas · AB Engine v2.0</p>
         </div>
      </footer>
    </div>
  );
};

export default MusicAtlasProject;
