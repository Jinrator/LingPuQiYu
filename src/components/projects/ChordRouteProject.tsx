
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { X, Check, Map, Compass, Play, Pause, Sparkles, MessageCircle, ArrowRight, Heart, Star, Cloud, Ghost } from 'lucide-react';

interface Chord {
  name: string;
  freqs: number[];
}

interface Route {
  id: string;
  name: string;
  desc: string;
  icon: React.ReactNode;
  color: string;
  bgClass: string;
  progression: Chord[];
}

const CHORDS_MAP: Record<string, Chord> = {
  '1': { name: 'C', freqs: [261.63, 329.63, 392.00] },
  '5': { name: 'G', freqs: [196.00, 246.94, 293.66] },
  '6': { name: 'Am', freqs: [220.00, 261.63, 329.63] },
  '4': { name: 'F', freqs: [174.61, 220.00, 261.63] },
};

const ROUTES: Route[] = [
  { 
    id: 'A', 
    name: '无敌幸运星', 
    desc: '英雄出发，充满希望与力量', 
    icon: <Star size={24} />, 
    color: 'bg-yellow-500', 
    bgClass: 'from-amber-400/20 to-orange-500/10',
    progression: [CHORDS_MAP['1'], CHORDS_MAP['5'], CHORDS_MAP['6'], CHORDS_MAP['4']] 
  },
  { 
    id: 'B', 
    name: '甜甜圈派对', 
    desc: '甜美可爱，像好朋友在野餐', 
    icon: <Heart size={24} />, 
    color: 'bg-pink-500', 
    bgClass: 'from-pink-400/20 to-rose-500/10',
    progression: [CHORDS_MAP['1'], CHORDS_MAP['6'], CHORDS_MAP['4'], CHORDS_MAP['5']] 
  },
  { 
    id: 'C', 
    name: '神秘森林', 
    desc: '酷酷的忧伤，带点神秘感', 
    icon: <Ghost size={24} />, 
    color: 'bg-indigo-600', 
    bgClass: 'from-indigo-600/30 to-slate-900/40',
    progression: [CHORDS_MAP['6'], CHORDS_MAP['4'], CHORDS_MAP['1'], CHORDS_MAP['5']] 
  },
];

const MELODY_FREQS = [392.00, 440.00, 493.88, 523.25]; // 简单的辅助旋律

const ChordRouteProject: React.FC<{ onComplete: () => void; onBack: () => void; theme?: 'light' | 'dark' }> = ({ onComplete, onBack, theme = 'dark' }) => {
  const [selectedRoute, setSelectedRoute] = useState<Route | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStep, setCurrentStep] = useState(-1);
  const [showAIQuestion, setShowAIQuestion] = useState(false);
  const [hasTestedTension, setHasTestedTension] = useState(false);
  const isDark = theme === 'dark';

  const audioCtxRef = useRef<AudioContext | null>(null);
  const timerRef = useRef<number | null>(null);

  const initAudio = () => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
  };

  const playChord = useCallback((chord: Chord) => {
    initAudio();
    const ctx = audioCtxRef.current!;
    if (ctx.state === 'suspended') ctx.resume();

    chord.freqs.forEach(freq => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.15, ctx.currentTime + 0.1);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.2);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 1.2);
    });

    // 同时播放一个对应旋律音
    const mOsc = ctx.createOscillator();
    const mGain = ctx.createGain();
    mOsc.type = 'sine';
    mOsc.frequency.setValueAtTime(MELODY_FREQS[Math.floor(Math.random() * 4)], ctx.currentTime);
    mGain.gain.setValueAtTime(0, ctx.currentTime);
    mGain.gain.linearRampToValueAtTime(0.2, ctx.currentTime + 0.05);
    mGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
    mOsc.connect(mGain);
    mGain.connect(ctx.destination);
    mOsc.start();
    mOsc.stop(ctx.currentTime + 0.6);
  }, []);

  useEffect(() => {
    if (isPlaying && selectedRoute) {
      timerRef.current = window.setInterval(() => {
        setCurrentStep(prev => {
          const next = (prev + 1) % 4;
          
          // 悬念测试：在准备跳回第1个和弦（next=0）且刚刚放完第4个（prev=3）时，如果没测试过，则触发AI中断
          if (next === 0 && prev === 3 && !hasTestedTension) {
            setIsPlaying(false);
            setShowAIQuestion(true);
            setHasTestedTension(true);
            return 3;
          }

          playChord(selectedRoute.progression[next]);
          return next;
        });
      }, 1200);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isPlaying, selectedRoute, playChord, hasTestedTension]);

  const handleSelectRoute = (route: Route) => {
    setSelectedRoute(route);
    setCurrentStep(-1);
    setIsPlaying(true);
    setShowAIQuestion(false);
  };

  const handleGoHome = () => {
    setShowAIQuestion(false);
    setIsPlaying(true);
    // 立即播放第一个和弦，增强反馈感
    if (selectedRoute) {
      playChord(selectedRoute.progression[0]);
      setCurrentStep(0);
    }
  };

  return (
    <div className={`fixed inset-0 z-[200] flex flex-col transition-all duration-1000 overflow-hidden ${selectedRoute ? selectedRoute.bgClass : isDark ? 'bg-slate-950' : 'bg-slate-50'}`}>
      
      <header className={`relative z-10 p-8 flex items-center justify-between transition-colors border-b backdrop-blur-xl ${isDark ? 'bg-slate-900/60 border-white/5' : 'bg-white/60 border-blue-100'}`}>
        <div className="flex items-center gap-6">
          <button onClick={onBack} className={`p-4 rounded-2xl transition-all ${isDark ? 'bg-white/5 text-slate-400 hover:text-white border border-white/10' : 'bg-white border border-blue-100 text-blue-600'}`}>
            <X size={24} />
          </button>
          <div>
            <h2 className={`text-2xl font-black tracking-tight ${isDark ? 'text-white' : 'text-blue-950'}`}>L9 · 音乐探险路线</h2>
            <p className={`text-[10px] font-black uppercase tracking-[0.3em] mt-1 ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>CHORD PROGRESSION ROUTES</p>
          </div>
        </div>
        
        <button 
          disabled={!selectedRoute}
          onClick={onComplete}
          className={`px-10 py-4 rounded-2xl font-black text-sm text-white transition-all ${selectedRoute ? 'bg-emerald-600 scale-105 hover:bg-emerald-500' : 'bg-slate-400 opacity-50 cursor-not-allowed'}`}
        >
          铺设歌曲骨架 <Check size={18} className="ml-2 inline" />
        </button>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center p-8 relative z-10 gap-12">
        
        {/* AI 助教提示层 */}
        <div className={`max-w-4xl w-full p-8 rounded-[3.5rem] border transition-all duration-500 relative overflow-hidden flex gap-8 items-start ${isDark ? 'bg-slate-900 border-white/5' : 'bg-white border-blue-100'}`}>
           <div className="w-20 h-20 rounded-3xl bg-blue-600 flex items-center justify-center text-4xl flex-shrink-0 animate-bounce-subtle">🤖</div>
           <div className="flex-1">
              <h3 className={`text-xl font-black mb-2 ${isDark ? 'text-white' : 'text-blue-950'}`}>AI 助教：离家去远航</h3>
              <p className={`text-sm leading-relaxed font-medium ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                一直待在家里（1级和弦）虽然舒服，但没有故事。我们需要出门旅行，最后再回到家。这就是音乐的故事！<br/>
                <b>请尝试按下不同的探险路线，听听哪一个最适合你的旋律。</b>
              </p>
           </div>
        </div>

        {/* 探险路线选择器 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-6xl">
           {ROUTES.map((route) => (
             <button 
               key={route.id}
               onClick={() => handleSelectRoute(route)}
               className={`group relative p-8 rounded-[3rem] border-4 transition-all duration-500 flex flex-col items-center gap-6 overflow-hidden ${selectedRoute?.id === route.id ? `${route.color} border-white scale-105 text-white` : isDark ? 'bg-white/5 border-white/5 text-slate-400' : 'bg-white border-blue-100 text-blue-900'}`}
             >
                <div className={`w-20 h-20 rounded-full flex items-center justify-center transition-transform duration-500 ${selectedRoute?.id === route.id ? 'bg-white/20' : 'bg-blue-100 text-blue-600 group-hover:rotate-12'}`}>
                   {route.icon}
                </div>
                <div className="text-center">
                   <h4 className="text-2xl font-black mb-1">{route.name}</h4>
                   <p className={`text-[10px] font-bold uppercase tracking-widest ${selectedRoute?.id === route.id ? 'text-white/70' : 'text-slate-500'}`}>Route {route.id}</p>
                </div>
                <p className={`text-sm font-medium text-center ${selectedRoute?.id === route.id ? 'text-white/80' : 'text-slate-500'}`}>{route.desc}</p>
                
                {selectedRoute?.id === route.id && isPlaying && (
                   <div className="absolute bottom-0 left-0 h-1.5 bg-white/40 transition-all duration-1200 linear" style={{ width: `${((currentStep + 1) / 4) * 100}%` }} />
                )}
             </button>
           ))}
        </div>

        {/* 动态可视化路段 */}
        <div className="w-full max-w-5xl flex items-center gap-4 px-10">
           {[0, 1, 2, 3].map((s) => (
             <div key={s} className="flex-1 flex flex-col items-center gap-3">
                <div className={`w-full h-24 rounded-3xl border-2 transition-all duration-500 flex flex-col items-center justify-center ${currentStep === s ? 'bg-white scale-110 border-blue-400' : isDark ? 'bg-white/5 border-white/5 opacity-30' : 'bg-slate-200 border-slate-300 opacity-30'}`}>
                   {selectedRoute && (
                     <>
                        <span className={`text-xl font-black ${currentStep === s ? 'text-blue-600' : ''}`}>{selectedRoute.progression[s].name}</span>
                        <span className="text-[10px] font-bold opacity-50">{s === 0 ? '家 (Tonic)' : s === 3 ? '悬念 (Dominant)' : '出发'}</span>
                     </>
                   )}
                </div>
                <div className={`w-3 h-3 rounded-full transition-all ${currentStep === s ? 'bg-blue-500 scale-150' : 'bg-slate-500/20'}`} />
             </div>
           ))}
        </div>

        {/* AI 悬念测试弹窗 */}
        {showAIQuestion && (
           <div className="fixed inset-0 z-[150] backdrop-blur-md bg-black/40 flex items-center justify-center p-6 animate-in zoom-in duration-300">
              <div className="bg-white rounded-[3.5rem] p-12 max-w-xl w-full border-4 border-blue-500 flex flex-col items-center gap-8 text-center">
                 <div className="w-24 h-24 rounded-full bg-blue-100 flex items-center justify-center text-5xl">🤔</div>
                 <div className="space-y-4">
                    <h3 className="text-3xl font-black text-blue-950">AI：听出这种“悬念”了吗？</h3>
                    <p className="text-lg font-medium text-slate-600 leading-relaxed">
                       现在的音乐停在第 4 个和弦。你觉得它舒服吗？是不是有一种<b>“没说完，急着想回第一个音（家）”</b>的感觉？
                    </p>
                 </div>
                 <button 
                   onClick={handleGoHome}
                   className="px-12 py-5 bg-blue-600 text-white rounded-3xl font-black text-xl hover:scale-105 active:scale-95 transition-all flex items-center gap-3"
                 >
                    让它回“家”！ <ArrowRight size={24} />
                 </button>
              </div>
           </div>
        )}

      </main>

      <footer className={`h-14 flex items-center justify-center transition-colors border-t ${isDark ? 'bg-black/40 border-white/5' : 'bg-white border-blue-100'}`}>
         <div className="flex items-center gap-3 opacity-30">
            <Compass size={14} />
            <p className="text-[9px] font-black uppercase tracking-[0.8em]">Harmonic Route Engine v1.5 · Tension Analysis Active</p>
         </div>
      </footer>
    </div>
  );
};

export default ChordRouteProject;
