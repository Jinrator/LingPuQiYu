
import React, { useState, useRef, useCallback } from 'react';
import { X, Check, ArrowUp, Music, Sparkles, ChevronRight } from 'lucide-react';
import { audioService } from '../../services/audioService';
import { NOTES } from '../../utils/musicNotes';

interface NoteData {
  id: number;
  num: string;
  sol: string;
  pitch: string;
  note: any; // 简化类型
  color: string;
  isLow?: boolean;
}

interface RhythmBar {
  notes: { num: string; isLow?: boolean; id: number }[];
  text: string;
}

// 简洁的音符定义 - 使用统一的音符系统
const LADDER_NOTES: NoteData[] = [
  { id: 0, num: '5', sol: 'sol', pitch: 'G3', note: NOTES.G3, color: 'bg-indigo-700', isLow: true },
  { id: 1, num: '6', sol: 'la', pitch: 'A3', note: NOTES.A3, color: 'bg-blue-800', isLow: true },
  { id: 2, num: '7', sol: 'si', pitch: 'B3', note: NOTES.B3, color: 'bg-sky-800', isLow: true },
  { id: 3, num: '1', sol: 'do', pitch: 'C4', note: NOTES.C4, color: 'bg-blue-500' },
  { id: 4, num: '2', sol: 're', pitch: 'D4', note: NOTES.D4, color: 'bg-sky-400' },
  { id: 5, num: '3', sol: 'mi', pitch: 'E4', note: NOTES.E4, color: 'bg-cyan-400' },
  { id: 6, num: '4', sol: 'fa', pitch: 'F4', note: NOTES.F4, color: 'bg-emerald-400' },
  { id: 7, num: '5', sol: 'sol', pitch: 'G4', note: NOTES.G4, color: 'bg-yellow-400' },
  { id: 8, num: '6', sol: 'la', pitch: 'A4', note: NOTES.A4, color: 'bg-orange-500' },
  { id: 9, num: '7', sol: 'si', pitch: 'B4', note: NOTES.B4, color: 'bg-rose-500' },
  { id: 10, num: 'i', sol: 'do\'', pitch: 'C5', note: NOTES.C5, color: 'bg-purple-500' },
];

const TWO_TIGERS_FULL_SCORE: RhythmBar[] = [
  { notes: [{id: 3, num: '1'}, {id: 4, num: '2'}, {id: 5, num: '3'}, {id: 3, num: '1'}], text: '两只老虎' },
  { notes: [{id: 3, num: '1'}, {id: 4, num: '2'}, {id: 5, num: '3'}, {id: 3, num: '1'}], text: '两只老虎' },
  { notes: [{id: 5, num: '3'}, {id: 6, num: '4'}, {id: 7, num: '5'}], text: '跑得快' },
  { notes: [{id: 5, num: '3'}, {id: 6, num: '4'}, {id: 7, num: '5'}], text: '跑得快' },
  { notes: [{id: 7, num: '5'}, {id: 8, num: '6'}, {id: 7, num: '5'}, {id: 6, num: '4'}, {id: 5, num: '3'}, {id: 3, num: '1'}], text: '一只没有耳朵' },
  { notes: [{id: 7, num: '5'}, {id: 8, num: '6'}, {id: 7, num: '5'}, {id: 6, num: '4'}, {id: 5, num: '3'}, {id: 3, num: '1'}], text: '一只没有尾巴' },
  { notes: [{id: 4, num: '2'}, {id: 0, num: '5', isLow: true}, {id: 3, num: '1'}], text: '真奇怪' },
  { notes: [{id: 4, num: '2'}, {id: 0, num: '5', isLow: true}, {id: 3, num: '1'}], text: '真奇怪' },
];

interface PitchLadderProjectProps {
  onComplete: () => void;
  onBack: () => void;
  theme?: 'light' | 'dark';
}

const PitchLadderProject: React.FC<PitchLadderProjectProps> = ({ onComplete, onBack, theme = 'dark' }) => {
  const [currentIndex, setCurrentIndex] = useState(3);
  const isDark = theme === 'dark';

  const playNote = useCallback((note) => {
    audioService.playPianoNote(note, 0.8, 0.7);
  }, []);

  const handleJump = (index: number) => {
    const safeIndex = Math.max(0, Math.min(LADDER_NOTES.length - 1, index));
    setCurrentIndex(safeIndex);
    playNote(LADDER_NOTES[safeIndex].note);
  };

  const getArea = (id: number) => {
    if (id >= 10) return 'high';
    if (id >= 3) return 'mid';
    return 'low';
  };

  const currentArea = getArea(currentIndex);

  return (
    <div className={`fixed inset-0 z-[200] flex flex-col transition-colors duration-500 animate-in fade-in ${isDark ? 'bg-slate-950 text-white' : 'bg-[#f0f9ff] text-blue-950'}`}>
      
      <header className={`p-8 border-b flex items-center justify-between transition-colors ${isDark ? 'bg-slate-900/80 border-white/5 backdrop-blur-md' : 'bg-white border-blue-100'}`}>
        <div className="flex items-center gap-6">
          <button onClick={onBack} className={`p-4 rounded-2xl transition-all ${isDark ? 'bg-white/5 text-slate-400 hover:text-white border border-white/10' : 'bg-white text-slate-500 hover:text-blue-600 border'}`}>
            <X size={24} />
          </button>
          <div>
            <h2 className="text-2xl font-black tracking-tight">L4 · 音高登天梯</h2>
            <p className="text-[10px] font-black text-blue-500 uppercase tracking-[0.3em] mt-1">PITCH LADDER ADVENTURE</p>
          </div>
        </div>
        
        <button 
          onClick={onComplete}
          className="px-8 py-3 bg-blue-600 rounded-xl font-black text-sm text-white hover:bg-blue-500 active:scale-95 transition-all flex items-center gap-2"
        >
          完成挑战 <Check size={18} />
        </button>
      </header>

      <main className="flex-1 flex flex-col lg:flex-row items-center justify-center p-8 overflow-hidden relative gap-12 lg:gap-24">
        
        {/* 音阶梯核心区域 */}
        <div className="relative h-[65vh] lg:h-[80vh] w-full max-w-xl flex items-stretch py-10">
          
          {/* 左侧：音区指示标识 (新增) */}
          <div className="w-24 mr-8 flex flex-col justify-between py-2 relative">
             {/* 区域背景轨道 */}
             <div className="absolute inset-y-0 right-4 w-1 bg-blue-500/5 rounded-full" />

             {/* 高音区 */}
             <div className={`flex-initial h-[9%] flex flex-col items-center justify-center transition-all duration-500 rounded-2xl border-2 border-dashed ${currentArea === 'high' ? 'bg-purple-500/20 border-purple-400/50 scale-105' : 'border-transparent opacity-20'}`}>
                <span className="[writing-mode:vertical-lr] font-black text-[10px] tracking-widest text-purple-500 uppercase">High 高音区</span>
             </div>

             {/* 中音区 */}
             <div className={`flex-[7] my-4 flex flex-col items-center justify-center transition-all duration-500 rounded-2xl border-2 border-dashed ${currentArea === 'mid' ? 'bg-blue-500/20 border-blue-400/50 scale-105' : 'border-transparent opacity-20'}`}>
                <span className="[writing-mode:vertical-lr] font-black text-[10px] tracking-widest text-blue-500 uppercase">Mid 中音区</span>
             </div>

             {/* 低音区 */}
             <div className={`flex-[3] flex flex-col items-center justify-center transition-all duration-500 rounded-2xl border-2 border-dashed ${currentArea === 'low' ? 'bg-indigo-500/20 border-indigo-400/50 scale-105' : 'border-transparent opacity-20'}`}>
                <span className="[writing-mode:vertical-lr] font-black text-[10px] tracking-widest text-indigo-500 uppercase">Low 低音区</span>
             </div>

             {/* 当前音区指示点 */}
             <div 
               className="absolute right-3.5 w-2 h-2 rounded-full bg-blue-500 transition-all duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)]"
               style={{ bottom: `calc((${currentIndex} / 10) * 100%)` }}
             />
          </div>

          <div className="flex-1 relative flex flex-col justify-between">
            <div className={`absolute left-1/2 -translate-x-1/2 w-4 top-0 bottom-0 rounded-full transition-colors ${isDark ? 'bg-white/5' : 'bg-blue-100'}`} />

            {[...LADDER_NOTES].reverse().map((note) => (
              <button
                key={note.id}
                onClick={() => handleJump(note.id)}
                className="relative z-10 flex items-center justify-center gap-6 lg:gap-10 w-full group transition-all duration-500"
              >
                <div className={`flex-1 text-right font-fredoka text-2xl lg:text-3xl transition-all ${currentIndex === note.id ? 'text-blue-500 scale-125' : 'opacity-20 hover:opacity-100'}`}>
                  {note.sol}
                </div>

                <div className={`w-9 h-9 rounded-full border-4 transition-all duration-500 ${currentIndex === note.id ? `${note.color} border-white scale-110` : isDark ? 'bg-slate-800 border-white/10' : 'bg-white border-blue-100'}`} />

                <div className={`flex-1 text-left flex items-center gap-2 transition-all ${currentIndex === note.id ? 'text-blue-500 scale-125' : 'opacity-20 hover:opacity-100'}`}>
                  <div className="relative flex flex-col items-center">
                    <span className="font-black text-2xl lg:text-3xl leading-none">{note.num}</span>
                    {note.isLow && <div className="w-1.5 h-1.5 rounded-full bg-current mt-1" />}
                  </div>
                  <span className="font-fredoka text-lg lg:text-xl ml-2">{note.pitch}</span>
                </div>
              </button>
            ))}

            <div 
              className="absolute left-1/2 -translate-x-1/2 w-16 h-16 rounded-full bg-gradient-to-br from-white via-blue-100 to-blue-500 z-20 transition-all duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)] flex items-center justify-center"
              style={{ bottom: `calc((100% / 10) * ${currentIndex} - 2rem)` }}
            >
               <div className="w-8 h-8 rounded-full bg-white/30 blur-sm absolute top-2 left-2" />
               <Sparkles className="text-white animate-pulse" size={24} />
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-6 max-w-md w-full overflow-y-auto max-h-full pr-4 scrollbar-hide pb-20 lg:pb-0">
           <div className={`p-8 rounded-[2.5rem] border transition-all ${isDark ? 'bg-white/5 border-white/5' : 'bg-white border-blue-100'}`}>
              <div className="flex items-center gap-4 mb-4">
                <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white">
                  <ArrowUp size={20} />
                </div>
                <h3 className="text-xl font-black">音区大不同</h3>
              </div>
              <p className="text-slate-500 text-sm leading-relaxed font-medium">
                观察左侧的三个区域：<br/>
                <span className="text-indigo-500 font-black">低音区 (Low)</span> 听起来像大象的脚步；<br/>
                <span className="text-blue-500 font-black">中音区 (Mid)</span> 是我们平时唱歌最舒服的地方；<br/>
                <span className="text-purple-500 font-black">高音区 (High)</span> 像清脆的小铃铛。
              </p>
           </div>
           
           <div className={`p-8 rounded-[2.5rem] border transition-all ${isDark ? 'bg-white/5 border-white/5' : 'bg-white border-blue-100'}`}>
              <div className="flex items-center gap-4 mb-6">
                <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white">
                  <Music size={20} />
                </div>
                <h4 className="text-xl font-black">完整曲谱：两只老虎</h4>
              </div>

              <div className="flex flex-col gap-5">
                 {TWO_TIGERS_FULL_SCORE.map((bar, barIdx) => (
                   <div key={barIdx}>
                     <div className="flex items-center justify-between mb-2 px-1">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{bar.text}</span>
                     </div>
                     <div className="flex gap-2 flex-wrap">
                       {bar.notes.map((note, noteIdx) => (
                         <button
                           key={noteIdx}
                           onClick={() => handleJump(note.id)}
                           className={`
                            relative w-12 h-12 rounded-xl font-black text-lg flex flex-col items-center justify-center transition-all border-2
                            ${isDark 
                              ? 'bg-slate-800 border-white/5 text-blue-400 hover:bg-white/10 hover:border-blue-500/30' 
                              : 'bg-blue-50 border-blue-100 text-blue-600 hover:bg-white hover:border-blue-400'}
                            active:scale-90
                           `}
                         >
                           <span className="leading-none">{note.num}</span>
                           {note.isLow && <div className="w-1 h-1 rounded-full bg-current absolute bottom-1.5" />}
                         </button>
                       ))}
                     </div>
                   </div>
                 ))}
              </div>
           </div>
        </div>
      </main>
    </div>
  );
};

export default PitchLadderProject;
