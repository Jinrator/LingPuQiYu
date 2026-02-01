
import React, { useState, useRef, useEffect } from 'react';
import { X, Check, Upload, Play, Pause, Wand2, Mic, Headphones, Sparkles, FileAudio, Trash2, Cpu, BarChart3, Activity } from 'lucide-react';

interface AIRecordingStudioProjectProps {
  onComplete: () => void;
  onBack: () => void;
  theme?: 'light' | 'dark';
}

const AIRecordingStudioProject: React.FC<AIRecordingStudioProjectProps> = ({ onComplete, onBack, theme = 'dark' }) => {
  const [audioFile, setAudioFile] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeStep, setActiveStep] = useState(0);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const isDark = theme === 'dark';

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAudioFile(URL.createObjectURL(file));
      setIsComplete(false);
      setProgress(0);
    }
  };

  const startProcessing = () => {
    if (!audioFile) return;
    setIsProcessing(true);
    setProgress(0);
    
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsProcessing(false);
          setIsComplete(true);
          return 100;
        }
        return prev + 1;
      });
    }, 40);
  };

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) audioRef.current.pause();
      else audioRef.current.play();
      setIsPlaying(!isPlaying);
    }
  };

  const reset = () => {
    setAudioFile(null);
    setIsComplete(false);
    setProgress(0);
    setIsPlaying(false);
  };

  return (
    <div className={`fixed inset-0 z-[200] flex flex-col transition-all duration-700 overflow-hidden ${isDark ? 'bg-[#020617]' : 'bg-[#f8fafc]'}`}>
      <audio ref={audioRef} src={audioFile || ''} onEnded={() => setIsPlaying(false)} />
      
      {/* 动态数字背景 */}
      <div className="absolute inset-0 pointer-events-none opacity-10">
         <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(59,130,246,0.1)_0%,transparent_70%)] animate-pulse" />
         {isProcessing && (
           <div className="flex flex-wrap gap-4 p-10 font-mono text-[10px] text-blue-500 animate-pulse overflow-hidden h-full">
             {[...Array(200)].map((_, i) => <span key={i}>{Math.random().toString(16).slice(2, 8)}</span>)}
           </div>
         )}
      </div>

      <header className={`relative z-10 p-8 flex items-center justify-between transition-colors border-b backdrop-blur-xl ${isDark ? 'bg-slate-900/60 border-white/5' : 'bg-white/60 border-blue-100'}`}>
        <div className="flex items-center gap-6">
          <button onClick={onBack} className={`p-4 rounded-2xl transition-all shadow-sm ${isDark ? 'bg-white/5 text-slate-400' : 'bg-white border border-blue-100 text-blue-600'}`}>
            <X size={24} />
          </button>
          <div>
            <h2 className={`text-2xl font-black tracking-tight ${isDark ? 'text-white' : 'text-blue-950'}`}>L14 · AI 录音棚</h2>
            <p className={`text-[10px] font-black uppercase tracking-[0.3em] mt-1 ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>AI INTELLIGENT MASTERING</p>
          </div>
        </div>
        
        <button 
          disabled={!isComplete}
          onClick={onComplete}
          className={`px-10 py-4 rounded-2xl font-black text-sm text-white shadow-xl transition-all ${isComplete ? 'bg-emerald-600 scale-105 hover:bg-emerald-500' : 'bg-slate-400 opacity-50 cursor-not-allowed'}`}
        >
          发布我的单曲 <Check size={18} className="ml-2 inline" />
        </button>
      </header>

      <main className="flex-1 flex flex-col items-center p-8 relative z-10 gap-8 overflow-y-auto scrollbar-hide">
        
        {!audioFile ? (
          <div className="flex-1 flex flex-col items-center justify-center w-full max-w-4xl">
             <div className={`w-full aspect-[21/9] rounded-[4rem] border-4 border-dashed flex flex-col items-center justify-center gap-8 transition-all group relative overflow-hidden ${isDark ? 'bg-white/5 border-white/10 hover:border-blue-500/50 shadow-2xl' : 'bg-white border-blue-100 hover:border-blue-300 shadow-xl'}`}>
                <div className="w-24 h-24 rounded-[2rem] bg-blue-600 flex items-center justify-center text-white shadow-2xl group-hover:scale-110 group-hover:rotate-6 transition-all ring-8 ring-blue-500/10">
                   <Upload size={40} />
                </div>
                <div className="text-center">
                   <h3 className={`text-3xl font-black mb-4 ${isDark ? 'text-white' : 'text-blue-900'}`}>上传你的灵感声轨</h3>
                   <p className="text-base font-bold text-slate-500 max-w-sm mx-auto">请先在“灵感精灵”录制个人哼唱，下载后再上传到这里进行大师混音。</p>
                </div>
                <input type="file" accept="audio/*" onChange={handleFileUpload} className="absolute inset-0 opacity-0 cursor-pointer" />
             </div>
          </div>
        ) : (
          <div className="w-full max-w-7xl flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
             
             {/* 状态展示区 */}
             <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* 左侧：文件信息 */}
                <div className={`p-8 rounded-[3rem] border flex flex-col gap-6 ${isDark ? 'bg-slate-900/60 border-white/5' : 'bg-white border-blue-50 shadow-lg'}`}>
                   <div className="flex items-center gap-5">
                      <div className="w-14 h-14 rounded-2xl bg-blue-500/20 flex items-center justify-center text-blue-500">
                         <FileAudio size={28} />
                      </div>
                      <div>
                         <h4 className={`text-lg font-black ${isDark ? 'text-white' : 'text-blue-900'}`}>待处理音轨</h4>
                         <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Raw Vocal Track</p>
                      </div>
                   </div>
                   
                   <div className="h-24 bg-black/20 rounded-2xl flex items-end gap-1 px-4 py-2 overflow-hidden">
                      {[...Array(20)].map((_, i) => (
                        <div 
                          key={i} 
                          className="flex-1 bg-blue-500/40 rounded-t-sm" 
                          style={{ height: `${Math.random() * 80 + 10}%`, transition: 'height 0.2s' }} 
                        />
                      ))}
                   </div>

                   <button onClick={reset} className="flex items-center justify-center gap-2 text-slate-500 hover:text-rose-500 font-black text-xs uppercase tracking-widest mt-2">
                      <Trash2 size={16} /> 重新上传
                   </button>
                </div>

                {/* 中间：AI 处理台 */}
                <div className={`p-8 rounded-[3.5rem] border flex flex-col items-center justify-center text-center gap-6 relative overflow-hidden ${isDark ? 'bg-slate-900/80 border-white/5 shadow-2xl' : 'bg-white border-blue-100 shadow-xl'}`}>
                   {!isComplete && !isProcessing && (
                     <>
                        <div className="w-20 h-20 rounded-full bg-blue-600 flex items-center justify-center text-white shadow-xl animate-pulse">
                           <Cpu size={32} />
                        </div>
                        <h4 className={`text-xl font-black ${isDark ? 'text-white' : 'text-blue-900'}`}>准备 AI 混音</h4>
                        <button 
                          onClick={startProcessing}
                          className="px-10 py-4 bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-2xl font-black shadow-xl hover:scale-105 transition-all"
                        >
                          开始母带优化
                        </button>
                     </>
                   )}

                   {isProcessing && (
                     <div className="w-full space-y-6">
                        <div className="relative w-28 h-28 mx-auto">
                           <div className="absolute inset-0 border-8 border-blue-500/20 rounded-full" />
                           <div className="absolute inset-0 border-8 border-blue-500 rounded-full border-t-transparent animate-spin" />
                           <div className="absolute inset-0 flex items-center justify-center font-fredoka text-blue-500 text-2xl">{progress}%</div>
                        </div>
                        <div className="space-y-2">
                           <h4 className={`text-lg font-black animate-pulse ${isDark ? 'text-white' : 'text-blue-900'}`}>
                             {progress < 30 ? '解析谐波结构...' : progress < 70 ? '优化均衡器参数...' : '应用多带压缩...'}
                           </h4>
                           <p className="text-xs text-slate-500 font-medium">Jin-Bot 正在为你的声音注入魔力</p>
                        </div>
                     </div>
                   )}

                   {isComplete && (
                     <div className="animate-in zoom-in-95 duration-500">
                        <div className="w-20 h-20 rounded-full bg-emerald-500 flex items-center justify-center text-white shadow-[0_0_30px_rgba(16,185,129,0.4)] mx-auto mb-4">
                           <Headphones size={36} />
                        </div>
                        <h4 className={`text-2xl font-black text-emerald-500`}>混音大功告成！</h4>
                        <p className="text-xs text-slate-500 mt-2">CD 级解析度 · 动态增强 100%</p>
                     </div>
                   )}
                </div>

                {/* 右侧：母带监测器 */}
                <div className={`p-8 rounded-[3rem] border flex flex-col gap-6 ${isDark ? 'bg-slate-900/60 border-white/5' : 'bg-white border-blue-50 shadow-lg'}`}>
                   <div className="flex items-center gap-5">
                      <div className="w-14 h-14 rounded-2xl bg-indigo-500/20 flex items-center justify-center text-indigo-500">
                         <Activity size={28} />
                      </div>
                      <div>
                         <h4 className={`text-lg font-black ${isDark ? 'text-white' : 'text-blue-900'}`}>母带监测器</h4>
                         <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Mastering Stats</p>
                      </div>
                   </div>

                   <div className="space-y-5">
                      {[
                        { label: '清晰度 Clarity', val: isComplete ? '98%' : '52%', color: 'bg-blue-500' },
                        { label: '饱满度 Fullness', val: isComplete ? '95%' : '44%', color: 'bg-indigo-500' },
                        { label: '响度 LUFS', val: isComplete ? '-14dB' : '-24dB', color: 'bg-emerald-500' },
                      ].map(stat => (
                        <div key={stat.label}>
                           <div className="flex justify-between text-[10px] font-black uppercase mb-1">
                              <span className="text-slate-400">{stat.label}</span>
                              <span className={isDark ? 'text-white' : 'text-blue-950'}>{stat.val}</span>
                           </div>
                           <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                              <div className={`h-full ${stat.color} transition-all duration-1000`} style={{ width: stat.val.replace(/[^\d]/g, '') + '%' }} />
                           </div>
                        </div>
                      ))}
                   </div>
                </div>
             </div>

             {/* 主控制台 */}
             <div className={`p-12 rounded-[4rem] border flex flex-col items-center gap-10 ${isDark ? 'bg-slate-900/40 border-white/5' : 'bg-white border-blue-50 shadow-2xl'}`}>
                
                {/* 实时波形可视化 */}
                <div className="w-full h-40 flex items-center justify-center gap-1 px-10 relative">
                   <div className={`absolute inset-x-0 h-[2px] ${isDark ? 'bg-white/5' : 'bg-blue-100'}`} />
                   {[...Array(60)].map((_, i) => (
                     <div 
                       key={i} 
                       className={`flex-1 rounded-full transition-all duration-300 ${isPlaying ? isComplete ? 'bg-blue-500 animate-pulse' : 'bg-slate-500 animate-pulse' : 'bg-slate-700/20'}`} 
                       style={{ 
                         height: isPlaying ? `${Math.random() * (isComplete ? 90 : 40) + 5}%` : '4px',
                         opacity: isPlaying ? 1 : 0.2
                       }} 
                     />
                   ))}
                </div>

                <div className="flex items-center gap-12">
                   <button 
                     onClick={togglePlay}
                     className={`w-24 h-24 rounded-[3rem] flex items-center justify-center shadow-2xl transition-all border-4 ${isPlaying ? 'bg-rose-500 border-rose-400' : 'bg-blue-600 border-blue-400'} text-white active:scale-95`}
                   >
                     {isPlaying ? <Pause size={40} fill="currentColor" /> : <Play size={40} fill="currentColor" className="ml-2" />}
                   </button>

                   <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-3">
                         <div className={`w-3 h-3 rounded-full ${isComplete ? 'bg-emerald-500 shadow-[0_0_10px_#10b981]' : 'bg-slate-500'}`} />
                         <span className={`font-black text-sm uppercase tracking-widest ${isDark ? 'text-white' : 'text-blue-900'}`}>
                           {isComplete ? '大师混音模式 (Mastered)' : '原始声轨模式 (Raw)'}
                         </span>
                      </div>
                      <p className="text-xs text-slate-500 font-medium italic">
                        {isComplete ? '你现在的听感拥有 CD 级别的宽广声场和细腻的高音。' : '当前为录音直出状态，细节较暗，动态范围较窄。'}
                      </p>
                   </div>
                </div>
             </div>
          </div>
        )}

        {/* 知识卡片 */}
        <div className="flex items-center gap-6 bg-white/5 p-8 rounded-[3rem] border border-white/5 backdrop-blur-md max-w-4xl w-full">
           <BarChart3 className="text-blue-500" size={32} />
           <div className="flex-1">
              <h5 className="text-sm font-black text-blue-500 uppercase tracking-widest mb-1">什么是混音与母带？</h5>
              <p className={`text-xs font-medium leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                混音 (Mixing) 就像是在做菜时调整各种调料的比例。而母带 (Mastering) 则是最后的摆盘和打光，它让你的歌曲在所有的播放器上听起来都一样响亮、清晰且震撼。
              </p>
           </div>
        </div>
      </main>

      <footer className={`h-14 flex items-center justify-center transition-colors border-t ${isDark ? 'bg-black/40 border-white/5' : 'bg-white border-blue-100'}`}>
         <div className="flex items-center gap-3 opacity-30">
            <Sparkles size={14} />
            <p className="text-[9px] font-black uppercase tracking-[0.8em]">AI Audio Engineering Engine v3.0 · Mastering Mod active</p>
         </div>
      </footer>
    </div>
  );
};

export default AIRecordingStudioProject;
