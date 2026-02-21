import React, { useState, useRef, useEffect, useCallback } from 'react';
import { X, Check, ArrowRightLeft, Play, Pause, HelpCircle, Trash2, ArrowUp, ArrowDown, MoveRight } from 'lucide-react';
import { audioService } from '../../services/audioService';
import { NOTES } from '../../utils/musicNotes';

interface MelodyMirrorProjectProps {
  onComplete: () => void;
  onBack: () => void;
  theme?: 'light' | 'dark';
}

// 简洁的音阶定义 - 使用统一的音符系统
const SCALE_NOTES = [
  NOTES.C4, NOTES.D4, NOTES.E4, NOTES.F4, 
  NOTES.G4, NOTES.A4, NOTES.B4, NOTES.C5
];

const NOTE_LABELS = ['1', '2', '3', '4', '5', '6', '7', 'i'];

const MelodyMirrorProject: React.FC<MelodyMirrorProjectProps> = ({ onComplete, onBack, theme = 'dark' }) => {
  const [questionGrid, setQuestionGrid] = useState<number[]>(new Array(4).fill(-1));
  const [answerGrid, setAnswerGrid] = useState<number[]>(new Array(4).fill(-1));
  const [playMode, setPlayMode] = useState<'none' | 'full' | 'question' | 'answer'>('none');
  const [currentStep, setCurrentStep] = useState(-1);
  const [showExplanation, setShowExplanation] = useState(true);
  const [activeMagic, setActiveMagic] = useState<string | null>(null);

  const timerRef = useRef<number | null>(null);
  const isDark = theme === 'dark';

  const playNote = useCallback((note) => {
    audioService.playPianoNote(note, 0.5, 0.7);
  }, []);

  useEffect(() => {
    if (playMode !== 'none') {
      timerRef.current = window.setInterval(() => {
        setCurrentStep(prev => {
          let next = prev + 1;
          let start = 0, end = 7;
          if (playMode === 'question') { start = 0; end = 3; }
          if (playMode === 'answer') { start = 4; end = 7; }
          if (next > end || next < start) next = start;

          const isQuestion = next < 4;
          const grid = isQuestion ? questionGrid : answerGrid;
          const noteIdx = grid[next % 4];
          
          if (noteIdx !== -1) {
            playNote(SCALE_NOTES[noteIdx]);
          }
          return next;
        });
      }, 600);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      setCurrentStep(-1);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [playMode, questionGrid, answerGrid, playNote]);

  const toggleNote = (grid: 'question' | 'answer', step: number, pitch: number) => {
    if (grid === 'question') {
      const newGrid = [...questionGrid];
      newGrid[step] = newGrid[step] === pitch ? -1 : pitch;
      setQuestionGrid(newGrid);
    } else {
      const newGrid = [...answerGrid];
      newGrid[step] = newGrid[step] === pitch ? -1 : pitch;
      setAnswerGrid(newGrid);
    }
    if (pitch !== -1) playNote(SCALE_NOTES[pitch]);
  };

  const applyMagic = (type: 'up' | 'down' | 'mirror') => {
    setActiveMagic(type);
    setTimeout(() => setActiveMagic(null), 1000);

    const hasNotes = questionGrid.some(n => n !== -1);
    if (!hasNotes) return;

    let nextAnswer = [...questionGrid];

    if (type === 'up') {
      nextAnswer = nextAnswer.map(n => (n === -1 ? -1 : Math.min(n + 1, 7)));
    } else if (type === 'down') {
      nextAnswer = nextAnswer.map(n => (n === -1 ? -1 : Math.max(n - 1, 0)));
    } else if (type === 'mirror') {
      nextAnswer = [...questionGrid].reverse();
    }

    // 确保最后一个音符回到主音
    let lastNoteIdx = -1;
    for (let i = nextAnswer.length - 1; i >= 0; i--) {
      if (nextAnswer[i] !== -1) {
        lastNoteIdx = i;
        break;
      }
    }

    if (lastNoteIdx !== -1) {
      nextAnswer[lastNoteIdx] = 0; 
    }

    setAnswerGrid(nextAnswer);
    handleTogglePlay('answer');
  };

  const handleTogglePlay = (mode: 'full' | 'question' | 'answer') => {
    if (playMode === mode) setPlayMode('none');
    else {
      setPlayMode(mode);
      setCurrentStep(-1);
    }
  };

  return (
    <div className={`fixed inset-0 z-[200] flex flex-col transition-all duration-700 overflow-hidden ${isDark ? 'bg-[#020617]' : 'bg-[#f8fafc]'}`}>
      
      {/* Background Effects */}
      <div className="absolute inset-0 pointer-events-none opacity-20">
         <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(59,130,246,0.1)_0%,transparent_70%)] animate-pulse" />
      </div>

      {/* Header */}
      <header className={`relative z-10 p-8 flex items-center justify-between transition-colors border-b backdrop-blur-xl ${isDark ? 'bg-slate-900/60 border-white/5' : 'bg-white/60 border-blue-100'}`}>
        <div className="flex items-center gap-6">
          <button onClick={onBack} className={`p-4 rounded-2xl transition-all ${isDark ? 'bg-white/5 text-slate-400' : 'bg-white border border-blue-100 text-blue-600'}`}>
            <X size={24} />
          </button>
          <div>
            <h2 className={`text-2xl font-black tracking-tight ${isDark ? 'text-white' : 'text-blue-950'}`}>L6 · 旋律对对子</h2>
            <p className={`text-[10px] font-black uppercase tracking-[0.3em] mt-1 ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>MAGIC MELODY EXPERIMENT</p>
          </div>
        </div>
        
        <div className="flex items-center gap-6">
           <button onClick={() => setShowExplanation(!showExplanation)} className={`p-4 rounded-2xl transition-all ${showExplanation ? 'bg-blue-600 text-white' : isDark ? 'bg-white/5 text-slate-400' : 'bg-white border border-blue-100 text-slate-400'}`}>
             <HelpCircle size={24} />
           </button>
           <button onClick={onComplete} className="px-10 py-4 rounded-2xl font-black text-sm text-white bg-blue-600 hover:bg-blue-500 active:scale-95 transition-all">
             保存魔法旋律 <Check size={18} className="ml-2 inline" />
           </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center p-8 relative z-10 gap-8">
        
        {/* Explanation Panel */}
        {showExplanation && (
          <div className={`max-w-4xl w-full p-8 rounded-[3rem] border animate-in slide-in-from-top-10 duration-500 relative overflow-hidden ${isDark ? 'bg-slate-900 border-white/5' : 'bg-white border-blue-100'}`}>
            <div className="flex gap-8 items-start">
              <div className="w-24 h-24 rounded-3xl bg-blue-600 flex flex-col items-center justify-center text-4xl border-4 border-white/10 flex-shrink-0 animate-bounce-subtle">🐰</div>
              <div>
                <h3 className={`text-xl font-black mb-2 ${isDark ? 'text-white' : 'text-blue-950'}`}>旋律的"镜像"与"重力"</h3>
                <p className={`text-sm leading-relaxed font-medium ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  左边是你的"提问"。使用中间的<b>魔法转换工具</b>，你可以让旋律向上爬坡、向下坠落或者整个翻转！观察右边的"答句"发生了什么变化，听一听它们之间的新关系。
                </p>
              </div>
              <button onClick={() => setShowExplanation(false)} className="absolute top-6 right-6 p-2 text-slate-500 hover:text-rose-500 transition-colors"><X size={20} /></button>
            </div>
          </div>
        )}

        {/* Main Grid Layout */}
        <div className="flex flex-col lg:flex-row items-stretch gap-6 w-full max-w-7xl relative">
           
           {/* Question Grid */}
           <div className={`flex-1 rounded-[3.5rem] p-10 flex flex-col gap-6 border transition-all duration-700 relative overflow-hidden ${isDark ? 'bg-slate-900/40 border-white/5' : 'bg-white border-blue-50'}`}>
              <div className="flex items-center justify-between relative z-10">
                 <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-black text-2xl ring-4 ring-blue-500/10">?</div>
                    <div>
                      <span className={`text-sm font-black uppercase tracking-widest ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>问句 (Question)</span>
                    </div>
                 </div>
                 <div className="flex items-center gap-2">
                    <button 
                      onClick={() => handleTogglePlay('question')}
                      className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${playMode === 'question' ? 'bg-rose-500 text-white' : 'bg-blue-100 text-blue-600 hover:bg-blue-200'}`}
                    >
                      {playMode === 'question' ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" className="ml-1" />}
                    </button>
                    <button onClick={() => setQuestionGrid(new Array(4).fill(-1))} className="p-3 text-slate-400 hover:text-rose-500 transition-colors"><Trash2 size={18} /></button>
                 </div>
              </div>

              <div className="flex-1 grid grid-cols-4 gap-4 min-h-[320px]">
                 {[...Array(4)].map((_, stepIdx) => (
                   <div key={stepIdx} className={`flex flex-col gap-2 relative ${currentStep === stepIdx ? 'after:content-[""] after:absolute after:inset-x-[-8px] after:-top-4 after:-bottom-4 after:bg-blue-500/10 after:rounded-[2rem] after:z-0' : ''}`}>
                      {[...Array(8)].reverse().map((_, pitchIdx) => {
                        const pitch = 7 - pitchIdx;
                        const isActive = questionGrid[stepIdx] === pitch;
                        return (
                          <button
                            key={pitchIdx}
                            onClick={() => toggleNote('question', stepIdx, pitch)}
                            className={`flex-1 rounded-xl transition-all relative z-10 border-2 ${isActive ? 'bg-blue-600 border-white scale-110' : isDark ? 'bg-white/5 border-white/5 hover:bg-white/10' : 'bg-slate-50 border-slate-100 hover:bg-blue-50'}`}
                          >
                            {isActive && <span className="text-[10px] font-black text-white">{NOTE_LABELS[pitch]}</span>}
                            {!isActive && pitch === 0 && <div className="w-1.5 h-1.5 rounded-full bg-current opacity-20 mx-auto" />}
                          </button>
                        );
                      })}
                   </div>
                 ))}
              </div>
           </div>

           {/* Magic Controls */}
           <div className="flex flex-col items-center justify-center gap-4 px-4 min-w-[140px]">
              <div className="flex flex-col gap-3 bg-white/5 p-4 rounded-[2.5rem] border border-white/5 backdrop-blur-md">
                 
                 <button 
                   onClick={() => applyMagic('up')}
                   className={`group w-20 h-20 rounded-3xl flex flex-col items-center justify-center gap-1 transition-all border-2 ${activeMagic === 'up' ? 'bg-orange-500 border-white scale-110 text-white' : 'bg-white/10 border-white/10 hover:bg-white/20 text-blue-500'}`}
                 >
                    <ArrowUp className="group-hover:-translate-y-1 transition-transform" size={28} />
                    <span className="text-[8px] font-black uppercase tracking-tighter">向上走</span>
                 </button>

                 <button 
                   onClick={() => applyMagic('down')}
                   className={`group w-20 h-20 rounded-3xl flex flex-col items-center justify-center gap-1 transition-all border-2 ${activeMagic === 'down' ? 'bg-blue-500 border-white scale-110 text-white' : 'bg-white/10 border-white/10 hover:bg-white/20 text-blue-500'}`}
                 >
                    <ArrowDown className="group-hover:translate-y-1 transition-transform" size={28} />
                    <span className="text-[8px] font-black uppercase tracking-tighter">向下走</span>
                 </button>

                 <button 
                   onClick={() => applyMagic('mirror')}
                   className={`group w-20 h-20 rounded-3xl flex flex-col items-center justify-center gap-1 transition-all border-2 ${activeMagic === 'mirror' ? 'bg-purple-600 border-white scale-110 text-white' : 'bg-white/10 border-white/10 hover:bg-white/20 text-blue-500'}`}
                 >
                    <ArrowRightLeft className="group-hover:rotate-180 transition-transform duration-700" size={28} />
                    <span className="text-[8px] font-black uppercase tracking-tighter">倒着走</span>
                 </button>

              </div>
              <div className="flex items-center justify-center text-slate-500 animate-pulse">
                 <MoveRight size={24} />
              </div>
           </div>

           {/* Answer Grid */}
           <div className={`flex-1 rounded-[3.5rem] p-10 flex flex-col gap-6 border transition-all duration-700 relative overflow-hidden ${isDark ? 'bg-slate-900/40 border-white/5' : 'bg-white border-blue-50'}`}>
              <div className="flex items-center justify-between relative z-10">
                 <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-500 text-white flex items-center justify-center font-black text-2xl ring-4 ring-emerald-500/10">!</div>
                    <div>
                      <span className={`text-sm font-black uppercase tracking-widest ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>答句 (Answer)</span>
                    </div>
                 </div>
                 <div className="flex items-center gap-2">
                    <button 
                      onClick={() => handleTogglePlay('answer')}
                      className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${playMode === 'answer' ? 'bg-rose-500 text-white' : 'bg-emerald-100 text-emerald-600 hover:bg-emerald-200'}`}
                    >
                      {playMode === 'answer' ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" className="ml-1" />}
                    </button>
                    <button onClick={() => setAnswerGrid(new Array(4).fill(-1))} className="p-3 text-slate-400 hover:text-rose-500 transition-colors"><Trash2 size={18} /></button>
                 </div>
              </div>

              <div className="flex-1 grid grid-cols-4 gap-4 min-h-[320px]">
                 {[...Array(4)].map((_, stepIdx) => (
                   <div key={stepIdx} className={`flex flex-col gap-2 relative ${currentStep === stepIdx + 4 ? 'after:content-[""] after:absolute after:inset-x-[-8px] after:-top-4 after:-bottom-4 after:bg-emerald-500/10 after:rounded-[2rem] after:z-0' : ''}`}>
                      {[...Array(8)].reverse().map((_, pitchIdx) => {
                        const pitch = 7 - pitchIdx;
                        const isActive = answerGrid[stepIdx] === pitch;
                        return (
                          <button
                            key={pitchIdx}
                            onClick={() => toggleNote('answer', stepIdx, pitch)}
                            className={`flex-1 rounded-xl transition-all relative z-10 border-2 ${isActive ? 'bg-emerald-500 border-white scale-110' : isDark ? 'bg-white/5 border-white/5 hover:bg-white/10' : 'bg-slate-50 border-slate-100 hover:bg-emerald-50'}`}
                          >
                            {isActive && <span className="text-[10px] font-black text-white">{NOTE_LABELS[pitch]}</span>}
                            {!isActive && pitch === 0 && <div className="w-1.5 h-1.5 rounded-full bg-current opacity-20 mx-auto" />}
                          </button>
                        );
                      })}
                   </div>
                 ))}
              </div>
              
              {activeMagic && (
                <div className="absolute inset-0 bg-emerald-500/5 animate-pulse pointer-events-none z-0" />
              )}
           </div>
        </div>
      </main>

    </div>
  );
};

export default MelodyMirrorProject;