import React, { useState, useCallback } from 'react';
import { ArrowUp, Music } from 'lucide-react';
import { audioService } from '../../services/audioService';
import { NOTES } from '../../utils/musicNotes';
import { PALETTE } from '../../constants/palette';
import ProjectShell from './ProjectShell';

interface NoteData {
  id: number; num: string; sol: string; pitch: string; note: any; isLow?: boolean;
}

interface RhythmBar {
  notes: { num: string; isLow?: boolean; id: number }[];
  text: string;
}

const LADDER_NOTES: NoteData[] = [
  // 低音区 (5 notes: id 0–4)
  { id: 0, num: '3', sol: 'mi', pitch: 'E3', note: NOTES.C3, isLow: true },
  { id: 1, num: '4', sol: 'fa', pitch: 'F3', note: NOTES.F3, isLow: true },
  { id: 2, num: '5', sol: 'sol', pitch: 'G3', note: NOTES.G3, isLow: true },
  { id: 3, num: '6', sol: 'la', pitch: 'A3', note: NOTES.A3, isLow: true },
  { id: 4, num: '7', sol: 'si', pitch: 'B3', note: NOTES.B3, isLow: true },
  // 中音区 (5 notes: id 5–9)
  { id: 5, num: '1', sol: 'do', pitch: 'C4', note: NOTES.C4 },
  { id: 6, num: '2', sol: 're', pitch: 'D4', note: NOTES.D4 },
  { id: 7, num: '3', sol: 'mi', pitch: 'E4', note: NOTES.E4 },
  { id: 8, num: '4', sol: 'fa', pitch: 'F4', note: NOTES.F4 },
  { id: 9, num: '5', sol: 'sol', pitch: 'G4', note: NOTES.G4 },
  // 高音区 (5 notes: id 10–14)
  { id: 10, num: '6', sol: 'la', pitch: 'A4', note: NOTES.A4 },
  { id: 11, num: '7', sol: 'si', pitch: 'B4', note: NOTES.B4 },
  { id: 12, num: 'ì', sol: "do'", pitch: 'C5', note: NOTES.C5 },
  { id: 13, num: '2̇', sol: "re'", pitch: 'D5', note: NOTES.D5 },
  { id: 14, num: '3̇', sol: "mi'", pitch: 'E5', note: NOTES.E5 },
];

const TWO_TIGERS: RhythmBar[] = [
  { notes: [{id:5,num:'1'},{id:6,num:'2'},{id:7,num:'3'},{id:5,num:'1'}], text: '两只老虎' },
  { notes: [{id:5,num:'1'},{id:6,num:'2'},{id:7,num:'3'},{id:5,num:'1'}], text: '两只老虎' },
  { notes: [{id:7,num:'3'},{id:8,num:'4'},{id:9,num:'5'}], text: '跑得快' },
  { notes: [{id:7,num:'3'},{id:8,num:'4'},{id:9,num:'5'}], text: '跑得快' },
  { notes: [{id:9,num:'5'},{id:10,num:'6'},{id:9,num:'5'},{id:8,num:'4'},{id:7,num:'3'},{id:5,num:'1'}], text: '一只没有耳朵' },
  { notes: [{id:9,num:'5'},{id:10,num:'6'},{id:9,num:'5'},{id:8,num:'4'},{id:7,num:'3'},{id:5,num:'1'}], text: '一只没有尾巴' },
  { notes: [{id:6,num:'2'},{id:2,num:'5',isLow:true},{id:5,num:'1'}], text: '真奇怪' },
  { notes: [{id:6,num:'2'},{id:2,num:'5',isLow:true},{id:5,num:'1'}], text: '真奇怪' },
];

interface PitchLadderProjectProps {
  onComplete: () => void;
  onBack: () => void;
  theme?: 'light' | 'dark';
}

const PitchLadderProject: React.FC<PitchLadderProjectProps> = ({ onComplete, onBack }) => {
  const [currentIndex, setCurrentIndex] = useState(5);
  const playNote = useCallback((note: any) => { audioService.playPianoNote(note, 0.8, 0.7); }, []);
  const handleJump = (index: number) => {
    const i = Math.max(0, Math.min(LADDER_NOTES.length - 1, index));
    setCurrentIndex(i);
    playNote(LADDER_NOTES[i].note);
  };
  const getArea = (id: number) => id >= 10 ? 'high' : id >= 5 ? 'mid' : 'low';
  const currentArea = getArea(currentIndex);

  return (
    <ProjectShell lessonId={4} title="音高登天梯" subtitle="PITCH LADDER ADVENTURE" color="orange"
      actionLabel="完成挑战" actionEnabled={true} onAction={onComplete} onBack={onBack} footerText="Pitch Ladder · L4">
      <div className="flex flex-col lg:flex-row gap-4 sm:gap-6">
        {/* Ladder */}
        <div className="flex-1 bg-white rounded-2xl border border-slate-200 shadow-[0_1px_4px_rgba(0,0,0,0.02)] p-4 sm:p-6">
          <div className="flex gap-3 sm:gap-4">
            {/* Zone indicators — aligned to note rows via identical grid */}
            <div className="w-20 sm:w-24 grid py-2 gap-1.5" style={{ gridTemplateRows: `repeat(15, 1fr)`, minHeight: '540px' }}>
              {/* High zone: rows 1–5 (note id=14 down to id=10) */}
              <div className="flex items-center justify-center rounded-xl border-2 border-dashed transition-all"
                style={{ gridRow: '1 / 6', ...(currentArea === 'high'
                  ? { background: PALETTE.pink.bg, borderColor: PALETTE.pink.accent + '55', transform: 'scale(1.05)' }
                  : { borderColor: 'transparent', opacity: 0.2 }) }}>
                <span className="[writing-mode:vertical-lr] text-xs font-bold tracking-wider"
                  style={{ color: currentArea === 'high' ? PALETTE.pink.accent : '#94A3B8' }}>High 高音</span>
              </div>
              {/* Mid zone: rows 6–10 (note id=9 down to id=5) */}
              <div className="flex items-center justify-center rounded-xl border-2 border-dashed transition-all"
                style={{ gridRow: '6 / 11', ...(currentArea === 'mid'
                  ? { background: PALETTE.blue.bg, borderColor: PALETTE.blue.accent + '55', transform: 'scale(1.05)' }
                  : { borderColor: 'transparent', opacity: 0.2 }) }}>
                <span className="[writing-mode:vertical-lr] text-xs font-bold tracking-wider"
                  style={{ color: currentArea === 'mid' ? PALETTE.blue.accent : '#94A3B8' }}>Mid 中音</span>
              </div>
              {/* Low zone: rows 11–15 (note id=4 down to id=0) */}
              <div className="flex items-center justify-center rounded-xl border-2 border-dashed transition-all"
                style={{ gridRow: '11 / 16', ...(currentArea === 'low'
                  ? { background: PALETTE.orange.bg, borderColor: PALETTE.orange.accent + '55', transform: 'scale(1.05)' }
                  : { borderColor: 'transparent', opacity: 0.2 }) }}>
                <span className="[writing-mode:vertical-lr] text-xs font-bold tracking-wider"
                  style={{ color: currentArea === 'low' ? PALETTE.orange.accent : '#94A3B8' }}>Low 低音</span>
              </div>
            </div>
            {/* Note ladder */}
            <div className="flex-1 grid relative py-2" style={{ gridTemplateRows: `repeat(15, 1fr)`, minHeight: '540px' }}>
              <div className="absolute left-1/2 -translate-x-1/2 w-3.5 top-0 bottom-0 rounded-full bg-slate-100" />
              {[...LADDER_NOTES].reverse().map((note) => (
                <button key={note.id} onClick={() => handleJump(note.id)} className="relative z-10 flex items-center justify-center gap-3 sm:gap-5 w-full transition-all">
                  <div className={`flex-1 text-right text-sm sm:text-base font-bold transition-all ${currentIndex === note.id ? 'scale-110' : 'opacity-20'}`}
                    style={{ color: currentIndex === note.id ? PALETTE.blue.accent : '#94A3B8' }}>{note.sol}</div>
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full border-2 transition-all"
                    style={currentIndex === note.id ? { background: PALETTE.orange.accent, borderColor: '#fff', transform: 'scale(1.1)' } : { background: '#F8FAFC', borderColor: '#E2E8F0' }} />
                  <div className={`flex-1 text-left flex items-center gap-1.5 transition-all ${currentIndex === note.id ? 'scale-110' : 'opacity-20'}`}>
                    <span className="font-bold text-sm sm:text-base" style={{ color: currentIndex === note.id ? PALETTE.orange.accent : '#94A3B8' }}>{note.num}</span>
                    {note.isLow && <div className="w-1.5 h-1.5 rounded-full" style={{ background: currentIndex === note.id ? PALETTE.orange.accent : '#94A3B8' }} />}
                    <span className="text-xs sm:text-sm font-medium text-slate-400 ml-1">{note.pitch}</span>
                  </div>
                </button>
              ))}

            </div>
          </div>
        </div>
        {/* Right panel */}
        <div className="w-full lg:w-80 flex flex-col gap-3 sm:gap-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-[0_1px_4px_rgba(0,0,0,0.02)] p-4 sm:p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: PALETTE.blue.bg }}><ArrowUp size={16} style={{ color: PALETTE.blue.accent }} /></div>
              <h3 className="text-sm font-bold text-slate-700">音区大不同</h3>
            </div>
            <p className="text-xs font-medium text-slate-500 leading-relaxed">
              <span style={{ color: PALETTE.orange.accent }} className="font-bold">低音区</span> 像大象的脚步；
              <span style={{ color: PALETTE.blue.accent }} className="font-bold"> 中音区</span> 是唱歌最舒服的地方；
              <span style={{ color: PALETTE.pink.accent }} className="font-bold"> 高音区</span> 像清脆的小铃铛。
            </p>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 shadow-[0_1px_4px_rgba(0,0,0,0.02)] p-4 sm:p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: PALETTE.orange.bg }}><Music size={16} style={{ color: PALETTE.orange.accent }} /></div>
              <h3 className="text-sm font-bold text-slate-700">曲谱：两只老虎</h3>
            </div>
            <div className="flex flex-col gap-3">
              {TWO_TIGERS.map((bar, i) => (
                <div key={i}>
                  <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-300 mb-1 block">{bar.text}</span>
                  <div className="flex gap-1.5 flex-wrap">
                    {bar.notes.map((n, j) => (
                      <button key={j} onClick={() => handleJump(n.id)}
                        className="w-9 h-9 rounded-lg font-bold text-sm flex items-center justify-center border transition-all hover:scale-[1.02] active:scale-95 relative"
                        style={{ background: PALETTE.blue.bg, borderColor: PALETTE.blue.accent + '33', color: PALETTE.blue.accent }}>
                        {n.num}
                        {n.isLow && <div className="w-0.5 h-0.5 rounded-full bg-current absolute bottom-1" />}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </ProjectShell>
  );
};

export default PitchLadderProject;
