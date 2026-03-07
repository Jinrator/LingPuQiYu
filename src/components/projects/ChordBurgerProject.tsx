import React, { useState, useCallback } from 'react';
import { Layers, Trash2, X, Play } from 'lucide-react';
import { audioService } from '../../services/audioService';
import { NOTES } from '../../utils/musicNotes';
import { PALETTE } from '../../constants/palette';
import ProjectShell from './ProjectShell';

interface ChordBurgerProjectProps { onComplete: () => void; onBack: () => void; theme?: 'light' | 'dark'; }

const SCALE = [
  { name: 'C', note: NOTES.C4, label: '1' },
  { name: 'D', note: NOTES.D4, label: '2' },
  { name: 'E', note: NOTES.E4, label: '3' },
  { name: 'F', note: NOTES.F4, label: '4' },
];

const MAJOR_THIRDS = [NOTES.E4, NOTES.Fs4, NOTES.Gs4, NOTES.A4];
const MINOR_THIRDS = [NOTES.Ds4, NOTES.F4, NOTES.G4, NOTES.Gs4];
const FIFTHS = [NOTES.G4, NOTES.A4, NOTES.B4, NOTES.C5];

const ChordBurgerProject: React.FC<ChordBurgerProjectProps> = ({ onComplete, onBack }) => {
  const [bottomNote, setBottomNote] = useState<number | null>(null);
  const [middleNote, setMiddleNote] = useState<number | null>(null);
  const [topNote, setTopNote] = useState<number | null>(null);
  const [isMajor, setIsMajor] = useState(true);
  const [showExplanation, setShowExplanation] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);

  const playChord = useCallback(async () => {
    if (bottomNote === null) return;
    setIsPlaying(true);
    const notes = [SCALE[bottomNote].note];
    if (middleNote !== null) notes.push(isMajor ? MAJOR_THIRDS[bottomNote] : MINOR_THIRDS[bottomNote]);
    if (topNote !== null) notes.push(FIFTHS[bottomNote]);
    await audioService.playPianoChord(notes, 1.5, 0.7);
    setTimeout(() => setIsPlaying(false), 600);
  }, [bottomNote, middleNote, topNote, isMajor]);

  const handleBottomNote = (i: number) => {
    setBottomNote(i);
    audioService.playPianoNote(SCALE[i].note, 0.5, 0.8);
  };

  const handleMiddleNote = (major: boolean) => {
    setIsMajor(major);
    setMiddleNote(1);
    if (bottomNote !== null)
      audioService.playPianoNote(major ? MAJOR_THIRDS[bottomNote] : MINOR_THIRDS[bottomNote], 0.5, 0.8);
  };

  const handleTopNote = () => {
    setTopNote(1);
    if (bottomNote !== null)
      audioService.playPianoNote(FIFTHS[bottomNote], 0.5, 0.8);
  };

  const resetBurger = () => { setBottomNote(null); setMiddleNote(null); setTopNote(null); };
  const isComplete = bottomNote !== null && middleNote !== null && topNote !== null;

  const burger = (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
      <div style={{
        width: 220, height: 60, borderRadius: '9999px 9999px 0 0',
        background: PALETTE.orange.bg,
        border: '2px solid ' + PALETTE.orange.accent + '33',
        opacity: topNote !== null ? 1 : 0.15,
        transition: 'opacity 0.4s',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {topNote !== null && <span style={{ fontSize: 10, fontWeight: 700, color: PALETTE.orange.accent, letterSpacing: 2, textTransform: 'uppercase' }}>5th</span>}
      </div>
      <div style={{
        width: 240, height: 14, borderRadius: 9999,
        background: PALETTE.green.accent,
        opacity: topNote !== null ? 1 : 0,
        transition: 'opacity 0.4s',
      }} />
      <div style={{
        width: 196, height: 42, borderRadius: 10,
        background: isMajor ? PALETTE.yellow.accent : PALETTE.blue.accent,
        opacity: middleNote !== null ? 1 : 0,
        transition: 'opacity 0.4s, background 0.3s',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {middleNote !== null && <span style={{ fontSize: 10, fontWeight: 700, color: '#fff', letterSpacing: 2, textTransform: 'uppercase' }}>3rd {isMajor ? '大' : '小'}</span>}
      </div>
      <div style={{
        width: 220, height: 70, borderRadius: '0 0 20px 20px',
        background: PALETTE.orange.bg,
        border: '2px solid ' + PALETTE.orange.accent + '33',
        opacity: bottomNote !== null ? 1 : 0.15,
        transition: 'opacity 0.4s',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {bottomNote !== null
          ? <span style={{ fontSize: 20, fontWeight: 900, color: PALETTE.orange.accent }}>{SCALE[bottomNote].label}</span>
          : <span style={{ fontSize: 11, fontWeight: 600, color: PALETTE.orange.accent + '66' }}>Root</span>
        }
      </div>

      <div style={{ height: 28, display: 'flex', alignItems: 'center', marginTop: 8 }}>
        {isComplete && (
          <span style={{
            padding: '4px 12px', borderRadius: 9999, fontSize: 12, fontWeight: 600,
            background: isMajor ? PALETTE.yellow.bg : PALETTE.blue.bg,
            color: isMajor ? PALETTE.yellow.accent : PALETTE.blue.accent,
            border: '1px solid ' + (isMajor ? PALETTE.yellow.accent : PALETTE.blue.accent) + '33',
          }}>
            {isMajor ? '快乐大三和弦 ✨' : '忧郁小三和弦 🌧️'}
          </span>
        )}
      </div>

      <button
        onClick={playChord}
        disabled={bottomNote === null || isPlaying}
        style={{
          marginTop: 8,
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '8px 20px', borderRadius: 12,
          background: bottomNote === null ? '#E2E8F0' : PALETTE.orange.accent,
          color: bottomNote === null ? '#94A3B8' : '#fff',
          fontWeight: 600, fontSize: 13, border: 'none', cursor: bottomNote === null ? 'not-allowed' : 'pointer',
          transition: 'all 0.2s', opacity: isPlaying ? 0.7 : 1,
        }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><polygon points="5,3 19,12 5,21" /></svg>
        {isPlaying ? '播放中…' : '播放和弦'}
      </button>
    </div>
  );

  return (
    <ProjectShell
      lessonId={8} title="和弦叠叠乐" subtitle="CHORD BURGER LAB" color="orange"
      actionLabel="提交和弦汉堡" actionEnabled={isComplete} onAction={onComplete} onBack={onBack}
      footerText="Harmonic Stacking · Triad Mod 1.0"
    >
      {showExplanation && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-[0_1px_4px_rgba(0,0,0,0.02)] p-4 mb-4"
          style={{ borderLeftColor: PALETTE.orange.accent, borderLeftWidth: 3 }}>
          <div className="flex gap-3 items-start">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
              style={{ background: PALETTE.orange.bg }}>🍔</div>
            <div className="flex-1">
              <h3 className="text-sm font-bold text-slate-800 mb-0.5">声音的"叠罗汉"</h3>
              <p className="text-xs font-medium text-slate-500 leading-relaxed">
                底层选根音，中间选配料，顶层盖上生菜，再点"播放和弦"听听效果！
              </p>
            </div>
            <button onClick={() => setShowExplanation(false)} className="p-1 text-slate-300 hover:text-slate-500">
              <X size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Mobile: burger centered on top */}
      <div className="flex justify-center py-6 lg:hidden">
        {burger}
      </div>

      {/* Desktop: 3-column grid, burger in center */}
      <div className="hidden lg:grid gap-6 items-start" style={{ gridTemplateColumns: '1fr 260px 1fr' }}>

        {/* Left: controls */}
        <div className="space-y-3">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-[0_1px_4px_rgba(0,0,0,0.02)] p-4">
            <span className="text-[10px] font-semibold uppercase tracking-widest mb-2.5 block"
              style={{ color: PALETTE.orange.accent }}>底层：面包底 (Root)</span>
            <div className="grid grid-cols-4 gap-2">
              {SCALE.map((n, i) => (
                <button key={i} onClick={() => handleBottomNote(i)}
                  className="h-10 rounded-xl font-bold text-sm border transition-all hover:scale-[1.02] active:scale-95"
                  style={bottomNote === i
                    ? { background: PALETTE.orange.accent, borderColor: PALETTE.orange.accent, color: '#fff' }
                    : { background: '#F8FAFC', borderColor: '#E2E8F0', color: '#475569' }
                  }>{n.label}</button>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-[0_1px_4px_rgba(0,0,0,0.02)] p-4">
            <span className="text-[10px] font-semibold uppercase tracking-widest mb-2.5 block"
              style={{ color: PALETTE.orange.accent }}>中层：灵魂配料 (3rd)</span>
            <div className="flex gap-2">
              <button onClick={() => handleMiddleNote(true)}
                className="flex-1 h-14 rounded-xl flex flex-col items-center justify-center border-2 transition-all hover:scale-[1.02]"
                style={middleNote !== null && isMajor
                  ? { background: PALETTE.yellow.bg, borderColor: PALETTE.yellow.accent, color: PALETTE.yellow.accent }
                  : { background: '#F8FAFC', borderColor: '#E2E8F0', color: '#94A3B8' }
                }>
                <span className="text-lg">🧀</span>
                <span className="text-[10px] font-semibold uppercase tracking-widest mt-0.5">金黄芝士</span>
              </button>
              <button onClick={() => handleMiddleNote(false)}
                className="flex-1 h-14 rounded-xl flex flex-col items-center justify-center border-2 transition-all hover:scale-[1.02]"
                style={middleNote !== null && !isMajor
                  ? { background: PALETTE.blue.bg, borderColor: PALETTE.blue.accent, color: PALETTE.blue.accent }
                  : { background: '#F8FAFC', borderColor: '#E2E8F0', color: '#94A3B8' }
                }>
                <span className="text-lg">🫐</span>
                <span className="text-[10px] font-semibold uppercase tracking-widest mt-0.5">忧郁蓝莓</span>
              </button>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-[0_1px_4px_rgba(0,0,0,0.02)] p-4">
            <span className="text-[10px] font-semibold uppercase tracking-widest mb-2.5 block"
              style={{ color: PALETTE.orange.accent }}>顶层：生菜盖 (5th)</span>
            <button onClick={handleTopNote}
              className="w-full h-11 rounded-xl flex items-center justify-center gap-2 border-2 transition-all hover:scale-[1.02]"
              style={topNote !== null
                ? { background: PALETTE.green.bg, borderColor: PALETTE.green.accent, color: PALETTE.green.accent }
                : { background: '#F8FAFC', borderColor: '#E2E8F0', color: '#94A3B8' }
              }>
              <span className="text-base">🥬</span>
              <span className="text-xs font-semibold">新鲜生菜</span>
            </button>
          </div>

          <button onClick={resetBurger}
            className="flex items-center gap-1.5 text-slate-400 hover:text-red-400 transition-colors font-semibold text-xs">
            <Trash2 size={13} /> 重置汉堡
          </button>
        </div>

        {/* Center: burger */}
        <div className="flex flex-col items-center justify-start pt-2">
          {burger}
        </div>

        {/* Right: knowledge card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-[0_1px_4px_rgba(0,0,0,0.02)] p-4">
          <div className="flex items-center gap-2 mb-4">
            <Layers size={16} style={{ color: PALETTE.blue.accent }} />
            <h4 className="text-sm font-bold text-slate-700">和弦公式</h4>
          </div>
          <div className="space-y-3">
            {[
              { n: '1', label: '主音：汉堡的根基', color: PALETTE.orange },
              { n: '3', label: '三音：决定哭还是笑', color: isMajor ? PALETTE.yellow : PALETTE.blue },
              { n: '5', label: '五音：让声音更丰满', color: PALETTE.green },
            ].map(item => (
              <div key={item.n} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                  style={{ background: item.color.accent }}>{item.n}</div>
                <span className="text-xs font-medium text-slate-500">{item.label}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 p-3 rounded-xl border-2 border-dashed"
            style={{
              background: (isMajor ? PALETTE.yellow : PALETTE.blue).bg,
              borderColor: (isMajor ? PALETTE.yellow : PALETTE.blue).accent + '33',
            }}>
            <p className="text-[10px] font-medium leading-relaxed text-slate-400 italic">
              和弦就像调色盘，不同的组合能画出不同的心情。大和弦是明亮的阳光，小和弦是静谧的雨天。
            </p>
          </div>
        </div>
      </div>

      {/* Mobile: controls below burger */}
      <div className="lg:hidden space-y-3">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-[0_1px_4px_rgba(0,0,0,0.02)] p-4">
          <span className="text-[10px] font-semibold uppercase tracking-widest mb-2.5 block"
            style={{ color: PALETTE.orange.accent }}>底层：面包底 (Root)</span>
          <div className="grid grid-cols-4 gap-2">
            {SCALE.map((n, i) => (
              <button key={i} onClick={() => handleBottomNote(i)}
                className="h-10 rounded-xl font-bold text-sm border transition-all hover:scale-[1.02] active:scale-95"
                style={bottomNote === i
                  ? { background: PALETTE.orange.accent, borderColor: PALETTE.orange.accent, color: '#fff' }
                  : { background: '#F8FAFC', borderColor: '#E2E8F0', color: '#475569' }
                }>{n.label}</button>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-[0_1px_4px_rgba(0,0,0,0.02)] p-4">
          <span className="text-[10px] font-semibold uppercase tracking-widest mb-2.5 block"
            style={{ color: PALETTE.orange.accent }}>中层：灵魂配料 (3rd)</span>
          <div className="flex gap-2">
            <button onClick={() => handleMiddleNote(true)}
              className="flex-1 h-14 rounded-xl flex flex-col items-center justify-center border-2 transition-all hover:scale-[1.02]"
              style={middleNote !== null && isMajor
                ? { background: PALETTE.yellow.bg, borderColor: PALETTE.yellow.accent, color: PALETTE.yellow.accent }
                : { background: '#F8FAFC', borderColor: '#E2E8F0', color: '#94A3B8' }
              }>
              <span className="text-lg">🧀</span>
              <span className="text-[10px] font-semibold uppercase tracking-widest mt-0.5">金黄芝士</span>
            </button>
            <button onClick={() => handleMiddleNote(false)}
              className="flex-1 h-14 rounded-xl flex flex-col items-center justify-center border-2 transition-all hover:scale-[1.02]"
              style={middleNote !== null && !isMajor
                ? { background: PALETTE.blue.bg, borderColor: PALETTE.blue.accent, color: PALETTE.blue.accent }
                : { background: '#F8FAFC', borderColor: '#E2E8F0', color: '#94A3B8' }
              }>
              <span className="text-lg">🫐</span>
              <span className="text-[10px] font-semibold uppercase tracking-widest mt-0.5">忧郁蓝莓</span>
            </button>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-[0_1px_4px_rgba(0,0,0,0.02)] p-4">
          <span className="text-[10px] font-semibold uppercase tracking-widest mb-2.5 block"
            style={{ color: PALETTE.orange.accent }}>顶层：生菜盖 (5th)</span>
          <button onClick={handleTopNote}
            className="w-full h-11 rounded-xl flex items-center justify-center gap-2 border-2 transition-all hover:scale-[1.02]"
            style={topNote !== null
              ? { background: PALETTE.green.bg, borderColor: PALETTE.green.accent, color: PALETTE.green.accent }
              : { background: '#F8FAFC', borderColor: '#E2E8F0', color: '#94A3B8' }
            }>
            <span className="text-base">🥬</span>
            <span className="text-xs font-semibold">新鲜生菜</span>
          </button>
        </div>

        <button onClick={resetBurger}
          className="flex items-center gap-1.5 text-slate-400 hover:text-red-400 transition-colors font-semibold text-xs">
          <Trash2 size={13} /> 重置汉堡
        </button>
      </div>
    </ProjectShell>
  );
};

export default ChordBurgerProject;
