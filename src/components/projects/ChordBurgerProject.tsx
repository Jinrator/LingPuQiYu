import React, { useState, useEffect, useCallback } from 'react';
import { Info, Layers, Trash2, X } from 'lucide-react';
import { audioService } from '../../services/audioService';
import { NOTES } from '../../utils/musicNotes';
import { PALETTE } from '../../constants/palette';
import ProjectShell from './ProjectShell';

interface ChordBurgerProjectProps { onComplete: () => void; onBack: () => void; theme?: 'light' | 'dark'; }

const SCALE = [
  { name: 'C', note: NOTES.C4, label: '1' }, { name: 'D', note: NOTES.D4, label: '2' },
  { name: 'E', note: NOTES.E4, label: '3' }, { name: 'F', note: NOTES.F4, label: '4' },
  { name: 'G', note: NOTES.G4, label: '5' }, { name: 'A', note: NOTES.A4, label: '6' },
  { name: 'B', note: NOTES.B4, label: '7' }, { name: 'C5', note: NOTES.C5, label: '8' },
];

const ChordBurgerProject: React.FC<ChordBurgerProjectProps> = ({ onComplete, onBack }) => {
  const [bottomNote, setBottomNote] = useState<number | null>(null);
  const [middleNote, setMiddleNote] = useState<number | null>(null);
  const [topNote, setTopNote] = useState<number | null>(null);
  const [isMajor, setIsMajor] = useState(true);
  const [showExplanation, setShowExplanation] = useState(true);

  const playChord = useCallback(() => {
    if (bottomNote === null) return;
    const chordNotes = [SCALE[bottomNote].note];
    if (middleNote !== null) {
      const majorThirds = [NOTES.E4, NOTES.Fs4, NOTES.Gs4, NOTES.A4];
      const minorThirds = [NOTES.Ds4, NOTES.F4, NOTES.G4, NOTES.Gs4];
      chordNotes.push(isMajor ? majorThirds[bottomNote] : minorThirds[bottomNote]);
    }
    if (topNote !== null) {
      const fifths = [NOTES.G4, NOTES.A4, NOTES.B4, NOTES.C5];
      chordNotes.push(fifths[bottomNote]);
    }
    audioService.playPianoChord(chordNotes, 1.5, 0.7);
  }, [bottomNote, middleNote, topNote, isMajor]);

  useEffect(() => { if (bottomNote !== null) playChord(); }, [bottomNote, middleNote, topNote, playChord]);

  const resetBurger = () => { setBottomNote(null); setMiddleNote(null); setTopNote(null); };
  const isComplete = bottomNote !== null && middleNote !== null && topNote !== null;

  return (
    <ProjectShell lessonId={8} title="和弦叠叠乐" subtitle="CHORD BURGER LAB" color="orange"
      actionLabel="提交和弦汉堡" actionEnabled={isComplete} onAction={onComplete} onBack={onBack} footerText="Harmonic Stacking · Triad Mod 1.0">

      {/* Explanation */}
      {showExplanation && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-[0_1px_4px_rgba(0,0,0,0.02)] p-4 sm:p-5 mb-4 relative"
          style={{ borderLeftColor: PALETTE.orange.accent, borderLeftWidth: 3 }}>
          <div className="flex gap-3 items-start">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0" style={{ background: PALETTE.orange.bg }}>🍔</div>
            <div className="flex-1">
              <h3 className="text-sm font-bold text-slate-800 mb-1">声音的"叠罗汉"</h3>
              <p className="text-xs font-medium text-slate-500 leading-relaxed">
                一个音符是单薄的小人。排队走是旋律，叠罗汉就是和弦。让我们亲手叠一个"和弦汉堡"：底层是面包，中间是灵魂配料，顶层合拢。
              </p>
            </div>
            <button onClick={() => setShowExplanation(false)} className="p-1 text-slate-300 hover:text-slate-500"><X size={14} /></button>
          </div>
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-4 sm:gap-6">
        {/* Left: ingredient shelf */}
        <div className="flex-1 space-y-4">
          {/* Bottom: Root */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-[0_1px_4px_rgba(0,0,0,0.02)] p-4 sm:p-5">
            <span className="text-[10px] font-semibold uppercase tracking-widest mb-3 block" style={{ color: PALETTE.orange.accent }}>底层：面包底 (Root)</span>
            <div className="grid grid-cols-4 gap-2">
              {SCALE.slice(0, 4).map((n, i) => (
                <button key={i} onClick={() => setBottomNote(i)}
                  className="h-10 rounded-xl font-bold text-sm border transition-all hover:scale-[1.02] active:scale-95"
                  style={bottomNote === i
                    ? { background: PALETTE.orange.accent, borderColor: PALETTE.orange.accent, color: '#fff' }
                    : { background: '#F8FAFC', borderColor: '#E2E8F0', color: '#475569' }
                  }>{n.label}</button>
              ))}
            </div>
          </div>

          {/* Middle: 3rd */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-[0_1px_4px_rgba(0,0,0,0.02)] p-4 sm:p-5">
            <span className="text-[10px] font-semibold uppercase tracking-widest mb-3 block" style={{ color: PALETTE.orange.accent }}>中层：灵魂配料 (3rd)</span>
            <div className="flex gap-3">
              <button onClick={() => { setIsMajor(true); setMiddleNote(1); }}
                className="flex-1 h-16 rounded-xl flex flex-col items-center justify-center border-2 transition-all hover:scale-[1.02]"
                style={middleNote !== null && isMajor
                  ? { background: PALETTE.yellow.bg, borderColor: PALETTE.yellow.accent, color: PALETTE.yellow.accent }
                  : { background: '#F8FAFC', borderColor: '#E2E8F0', color: '#94A3B8' }
                }>
                <span className="text-xl">🧀</span>
                <span className="text-[10px] font-semibold uppercase tracking-widest mt-1">金黄芝士</span>
              </button>
              <button onClick={() => { setIsMajor(false); setMiddleNote(1); }}
                className="flex-1 h-16 rounded-xl flex flex-col items-center justify-center border-2 transition-all hover:scale-[1.02]"
                style={middleNote !== null && !isMajor
                  ? { background: PALETTE.blue.bg, borderColor: PALETTE.blue.accent, color: PALETTE.blue.accent }
                  : { background: '#F8FAFC', borderColor: '#E2E8F0', color: '#94A3B8' }
                }>
                <span className="text-xl">🫐</span>
                <span className="text-[10px] font-semibold uppercase tracking-widest mt-1">忧郁蓝莓</span>
              </button>
            </div>
          </div>

          {/* Top: 5th */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-[0_1px_4px_rgba(0,0,0,0.02)] p-4 sm:p-5">
            <span className="text-[10px] font-semibold uppercase tracking-widest mb-3 block" style={{ color: PALETTE.orange.accent }}>顶层：生菜盖 (5th)</span>
            <button onClick={() => setTopNote(1)}
              className="w-full h-12 rounded-xl flex items-center justify-center gap-2 border-2 transition-all hover:scale-[1.02]"
              style={topNote !== null
                ? { background: PALETTE.green.bg, borderColor: PALETTE.green.accent, color: PALETTE.green.accent }
                : { background: '#F8FAFC', borderColor: '#E2E8F0', color: '#94A3B8' }
              }>
              <span className="text-lg">🥬</span>
              <span className="text-xs font-semibold">新鲜生菜</span>
            </button>
          </div>

          <button onClick={resetBurger} className="flex items-center justify-center gap-2 text-slate-400 hover:text-red-400 transition-colors font-semibold text-xs">
            <Trash2 size={14} /> 重置汉堡
          </button>
        </div>

        {/* Center: burger visualization */}
        <div className="flex flex-col items-center justify-center min-h-[280px] w-full lg:w-64">
          <div className="flex flex-col items-center gap-1">
            <div className={`w-36 h-10 rounded-t-full transition-all duration-500 ${topNote !== null ? 'opacity-100' : 'opacity-10'}`}
              style={{ background: PALETTE.orange.bg, border: `2px solid ${PALETTE.orange.accent}33` }} />
            <div className={`w-40 h-3 rounded-full transition-all duration-500 ${topNote !== null ? 'opacity-100' : 'opacity-0'}`}
              style={{ background: PALETTE.green.accent }} />
            <div className={`w-32 h-7 rounded-lg transition-all duration-500 ${middleNote !== null ? 'opacity-100' : 'opacity-0'}`}
              style={{ background: isMajor ? PALETTE.yellow.accent : PALETTE.blue.accent }} />
            <div className={`w-36 h-12 rounded-b-2xl transition-all duration-500 flex items-center justify-center ${bottomNote !== null ? 'opacity-100' : 'opacity-10'}`}
              style={{ background: PALETTE.orange.bg, border: `2px solid ${PALETTE.orange.accent}33` }}>
              {bottomNote !== null && <span className="text-sm font-bold" style={{ color: PALETTE.orange.accent }}>{SCALE[bottomNote].label}</span>}
            </div>
          </div>
          {isComplete && (
            <span className="mt-4 px-3 py-1 rounded-full text-xs font-semibold border"
              style={isMajor
                ? { background: PALETTE.yellow.bg, color: PALETTE.yellow.accent, borderColor: PALETTE.yellow.accent + '33' }
                : { background: PALETTE.blue.bg, color: PALETTE.blue.accent, borderColor: PALETTE.blue.accent + '33' }
              }>{isMajor ? '快乐大三和弦 ✨' : '忧郁小三和弦 🌧️'}</span>
          )}
        </div>

        {/* Right: knowledge card */}
        <div className="w-full lg:w-64 bg-white rounded-2xl border border-slate-200 shadow-[0_1px_4px_rgba(0,0,0,0.02)] p-4 sm:p-5">
          <div className="flex items-center gap-3 mb-4">
            <Layers size={18} style={{ color: PALETTE.blue.accent }} />
            <h4 className="text-sm font-bold text-slate-700">和弦公式</h4>
          </div>
          <div className="space-y-3">
            {[
              { n: '1', label: '主音：汉堡的根基', color: PALETTE.orange },
              { n: '3', label: '三音：决定哭还是笑', color: isMajor ? PALETTE.yellow : PALETTE.blue },
              { n: '5', label: '五音：让声音更丰满', color: PALETTE.green },
            ].map(item => (
              <div key={item.n} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold" style={{ background: item.color.accent }}>{item.n}</div>
                <span className="text-xs font-medium text-slate-500">{item.label}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 p-3 rounded-xl border-2 border-dashed transition-colors"
            style={{ background: (isMajor ? PALETTE.yellow : PALETTE.blue).bg, borderColor: (isMajor ? PALETTE.yellow : PALETTE.blue).accent + '33' }}>
            <p className="text-[10px] font-medium leading-relaxed text-slate-400 italic">
              和弦就像调色盘，不同的组合能画出不同的心情。大和弦是明亮的阳光，小和弦是静谧的雨天。
            </p>
          </div>
        </div>
      </div>
    </ProjectShell>
  );
};

export default ChordBurgerProject;
