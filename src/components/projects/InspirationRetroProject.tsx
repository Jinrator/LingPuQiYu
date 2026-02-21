
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { X, Check, Upload, Play, Pause, Wand2, Music2, Sparkles, FileAudio, Trash2, Layers } from 'lucide-react';
import { audioService } from '../../services/audioService';
import { NOTES } from '../../utils/musicNotes';

interface InspirationRetroProjectProps {
  onComplete: () => void;
  onBack: () => void;
  theme?: 'light' | 'dark';
}

// 简洁的音阶定义 - 使用统一的音符系统
const SCALE = [
  { num: '1', name: 'C', note: NOTES.C4, color: 'bg-blue-500' },
  { num: '2', name: 'D', note: NOTES.D4, color: 'bg-sky-500' },
  { num: '3', name: 'E', note: NOTES.E4, color: 'bg-cyan-500' },
  { num: '4', name: 'F', note: NOTES.F4, color: 'bg-emerald-500' },
  { num: '5', name: 'G', note: NOTES.G4, color: 'bg-yellow-500' },
  { num: '6', name: 'A', note: NOTES.A4, color: 'bg-orange-500' },
  { num: '7', name: 'B', note: NOTES.B4, color: 'bg-rose-500' },
  { num: 'i', name: 'C5', note: NOTES.C5, color: 'bg-purple-500' },
];

const InspirationRetroProject: React.FC<InspirationRetroProjectProps> = ({ onComplete, onBack, theme = 'dark' }) => {
  const [audioFile, setAudioFile] = useState<string | null>(null);
  const [isConverting, setIsConverting] = useState(false);
  const [convertedGrid, setConvertedGrid] = useState<number[]>(new Array(16).fill(-1));
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStep, setCurrentStep] = useState(-1);
  const [conversionProgress, setConversionProgress] = useState(0);

  const timerRef = useRef<number | null>(null);
  const isDark = theme === 'dark';

  const playNote = useCallback((note: Note) => {
    audioService.playPianoNote(note, 0.5, 0.7);
  }, []);

  useEffect(() => {
    if (isPlaying) {
      timerRef.current = window.setInterval(() => {
        setCurrentStep(prev => {
          const next = (prev + 1) % 16;
          const noteIdx = convertedGrid[next];
          if (noteIdx !== -1) {
            playNote(SCALE[noteIdx].note);
          }
          return next;
        });
      }, 250);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      setCurrentStep(-1);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isPlaying, convertedGrid, playNote]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAudioFile(URL.createObjectURL(file));
      setConvertedGrid(new Array(16).fill(-1));
    }
  };

  const startConversion = () => {
    if (!audioFile) return;
    setIsConverting(true);
    setConversionProgress(0);

    const interval = setInterval(() => {
      setConversionProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          finishConversion();
          return 100;
        }
        return prev + 2;
      });
    }, 50);
  };

  const finishConversion = () => {
    // 模拟 AI 提取的旋律
    const newGrid = new Array(16).fill(-1).map((_, i) => {
      // 随机生成一段具有音乐感的旋律，或者模拟特定曲线
      if (i % 2 === 0) return Math.floor(Math.random() * 8);
      return -1;
    });
    setConvertedGrid(newGrid);
    setIsConverting(false);
  };

  const resetAll = () => {
    setAudioFile(null);
    setConvertedGrid(new Array(16).fill(-1));
    setIsPlaying(false);
    setConversionProgress(0);
  };

  return (
    <div className={`fixed inset-0 z-[200] flex flex-col transition-all duration-700 overflow-hidden ${isDark ? 'bg-[#020617]' : 'bg-[#f8fafc]'}`}>
      
      {/* 动态背景装饰 */}
      <div className="absolute inset-0 pointer-events-none opacity-20">
         <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(59,130,246,0.1)_0%,transparent_70%)] animate-pulse" />
      </div>

      <header className={`relative z-10 p-8 flex items-center justify-between transition-colors border-b backdrop-blur-xl ${isDark ? 'bg-slate-900/60 border-white/5' : 'bg-white/60 border-blue-100'}`}>
        <div className="flex items-center gap-6">
          <button onClick={onBack} className={`p-4 rounded-2xl transition-all ${isDark ? 'bg-white/5 text-slate-400' : 'bg-white border border-blue-100 text-blue-600'}`}>
            <X size={24} />
          </button>
          <div>
            <h2 className={`text-2xl font-black tracking-tight ${isDark ? 'text-white' : 'text-blue-950'}`}>L7 · 灵感回溯录</h2>
            <p className={`text-[10px] font-black uppercase tracking-[0.3em] mt-1 ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>AI MELODY TRANSCRIPTION</p>
          </div>
        </div>
        
        <button 
          disabled={convertedGrid.every(n => n === -1)}
          onClick={onComplete}
          className={`px-10 py-4 rounded-2xl font-black text-sm text-white transition-all ${!convertedGrid.every(n => n === -1) ? 'bg-emerald-600 hover:bg-emerald-500 scale-105' : 'bg-slate-400 opacity-50 cursor-not-allowed'}`}
        >
          保存灵感音符 <Check size={18} className="ml-2 inline" />
        </button>
      </header>

      <main className="flex-1 flex flex-col items-center p-8 relative z-10 gap-8 overflow-y-auto scrollbar-hide">
        
        {/* 上传区域 */}
        {!audioFile ? (
          <div className="flex-1 flex flex-col items-center justify-center w-full max-w-4xl">
             <div className={`w-full aspect-[21/9] rounded-[4rem] border-4 border-dashed flex flex-col items-center justify-center gap-6 transition-all group relative overflow-hidden ${isDark ? 'bg-white/5 border-white/10 hover:border-blue-500/50' : 'bg-white border-blue-100 hover:border-blue-300'}`}>
                <div className="w-24 h-24 rounded-3xl bg-blue-600 flex items-center justify-center text-white group-hover:scale-110 group-hover:rotate-6 transition-all">
                   <Upload size={40} />
                </div>
                <div className="text-center">
                   <h3 className={`text-2xl font-black mb-2 ${isDark ? 'text-white' : 'text-blue-900'}`}>上传你的哼唱灵感</h3>
                   <p className="text-sm font-bold text-slate-500">支持 WAV / MP3 / M4A 等音频格式</p>
                </div>
                <input type="file" accept="audio/*" onChange={handleFileUpload} className="absolute inset-0 opacity-0 cursor-pointer" />
             </div>
          </div>
        ) : (
          <div className="w-full max-w-7xl flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
             
             {/* 音频状态卡片 */}
             <div className={`p-8 rounded-[3rem] border flex items-center justify-between ${isDark ? 'bg-slate-900/60 border-white/5' : 'bg-white border-blue-50'}`}>
                <div className="flex items-center gap-6">
                   <div className="w-16 h-16 rounded-2xl bg-blue-500 flex items-center justify-center text-white">
                      <FileAudio size={32} />
                   </div>
                   <div>
                      <h4 className={`text-xl font-black ${isDark ? 'text-white' : 'text-blue-900'}`}>灵感已捕捉</h4>
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Inspiration Captured</p>
                   </div>
                </div>

                <div className="flex items-center gap-4">
                   {convertedGrid.every(n => n === -1) && !isConverting && (
                     <button 
                       onClick={startConversion}
                       className="px-8 py-4 bg-blue-600 text-white rounded-2xl font-black flex items-center gap-3 hover:bg-blue-500 active:scale-95 transition-all"
                     >
                       <Wand2 size={20} />
                       开始 AI 灵感转换
                     </button>
                   )}
                   <button onClick={resetAll} className="p-4 text-slate-500 hover:text-rose-500 transition-colors">
                      <Trash2 size={24} />
                   </button>
                </div>
             </div>

             {/* 转换进度条 */}
             {isConverting && (
               <div className="flex flex-col gap-4 px-8">
                  <div className="flex items-center justify-between">
                     <span className="text-xs font-black text-blue-500 uppercase tracking-[0.2em] animate-pulse">正在解析音频波形...</span>
                     <span className="font-fredoka text-blue-500">{conversionProgress}%</span>
                  </div>
                  <div className="w-full h-4 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden p-1">
                     <div className="h-full bg-blue-600 rounded-full transition-all duration-300" style={{ width: `${conversionProgress}%` }} />
                  </div>
               </div>
             )}

             {/* 正式音符网格 */}
             {!isConverting && !convertedGrid.every(n => n === -1) && (
               <div className={`p-10 rounded-[4rem] border flex flex-col gap-10 animate-in zoom-in-95 duration-700 ${isDark ? 'bg-slate-900/40 border-white/5' : 'bg-white border-blue-50'}`}>
                  
                  <div className="flex items-center justify-between">
                     <div className="flex items-center gap-4">
                        <Sparkles className="text-blue-500" size={28} />
                        <h3 className={`text-2xl font-black ${isDark ? 'text-white' : 'text-blue-900'}`}>正式音符网格</h3>
                     </div>
                     <button 
                       onClick={() => setIsPlaying(!isPlaying)}
                       className={`px-8 py-3 rounded-2xl font-black text-sm text-white transition-all flex items-center gap-3 ${isPlaying ? 'bg-rose-500' : 'bg-emerald-600'}`}
                     >
                       {isPlaying ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" />}
                       {isPlaying ? '停止回放' : '试听音符'}
                     </button>
                  </div>

                  <div className="flex gap-6 overflow-x-auto scrollbar-hide py-4">
                     {/* 纵轴标签 */}
                     <div className="flex flex-col gap-3 min-w-[80px]">
                        {[...SCALE].reverse().map((note) => (
                          <div key={note.name} className="h-12 flex flex-col items-center justify-center leading-none">
                             <span className="text-xs font-black text-blue-500">{note.num}</span>
                             <span className={`text-[10px] font-bold ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{note.name}</span>
                          </div>
                        ))}
                     </div>

                     {/* 网格核心 */}
                     <div className="flex-1 grid grid-cols-16 gap-3 min-w-[1000px]">
                        {[...Array(16)].map((_, stepIdx) => (
                          <div key={stepIdx} className={`flex flex-col gap-3 relative ${currentStep === stepIdx ? 'after:content-[""] after:absolute after:inset-x-[-8px] after:-top-4 after:-bottom-4 after:bg-blue-500/10 after:rounded-2xl after:z-0' : ''}`}>
                             {[...SCALE].reverse().map((note, pitchIdx) => {
                               const pitch = 7 - pitchIdx;
                               const isActive = convertedGrid[stepIdx] === pitch;
                               return (
                                 <div
                                   key={pitchIdx}
                                   className={`h-12 rounded-xl border-2 flex items-center justify-center transition-all ${isActive ? `${note.color} border-white scale-110 z-10` : isDark ? 'bg-white/5 border-white/5 opacity-20' : 'bg-slate-50 border-slate-100 opacity-20'}`}
                                 >
                                   {isActive && (
                                     <div className="flex flex-col items-center leading-none">
                                        <span className="text-[10px] font-black text-white">{note.num}</span>
                                        <span className="text-[8px] font-bold text-white/60">{note.name}</span>
                                     </div>
                                   )}
                                 </div>
                               );
                             })}
                          </div>
                        ))}
                     </div>
                  </div>
               </div>
             )}
          </div>
        )}

        {/* 提示信息 */}
        <div className="flex items-center gap-6 bg-white/5 p-6 rounded-[2.5rem] border border-white/5 backdrop-blur-md max-w-4xl w-full">
           <Music2 className="text-blue-500" size={32} />
           <p className={`text-sm font-medium leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              <b>关于 AI 转换:</b> 灵感精灵会分析你录音中的音高和节奏，并将其对应到网格里的<b>简谱 (123...)</b> 和 <b>音名 (CDE...)</b>。你可以试听这些音符，如果不满意，可以尝试重新上传！
           </p>
        </div>
      </main>

      <footer className={`h-14 flex items-center justify-center transition-colors border-t ${isDark ? 'bg-black/40 border-white/5' : 'bg-white border-blue-100'}`}>
         <div className="flex items-center gap-3 opacity-30">
            <Layers size={14} />
            <p className="text-[9px] font-black uppercase tracking-[0.8em]">Audio-to-Note Translation Engine · L7 Project</p>
         </div>
      </footer>
    </div>
  );
};

export default InspirationRetroProject;
