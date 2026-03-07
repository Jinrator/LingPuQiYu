import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ArrowRightLeft, Play, Pause, Trash2, ArrowUp, ArrowDown, MoveRight, X, Wand2 } from 'lucide-react';
import { audioService } from '../../services/audioService';
import { NOTES } from '../../utils/musicNotes';
import { PALETTE } from '../../constants/palette';
import ProjectShell from './ProjectShell';

interface MelodyMirrorProjectProps { onComplete: () => void; onBack: () => void; theme?: 'light' | 'dark'; }

const SCALE_NOTES = [NOTES.C4, NOTES.D4, NOTES.E4, NOTES.F4, NOTES.G4, NOTES.A4, NOTES.B4, NOTES.C5];
const NOTE_LABELS = ['1','2','3','4','5','6','7','i'];

const MelodyMirrorProject: React.FC<MelodyMirrorProjectProps> = ({ onComplete, onBack }) => {
  const [questionGrid, setQuestionGrid] = useState<number[]>(new Array(4).fill(-1));
  const [answerGrid, setAnswerGrid] = useState<number[]>(new Array(4).fill(-1));
  const [playMode, setPlayMode] = useState<'none'|'full'|'question'|'answer'>('none');
  const [currentStep, setCurrentStep] = useState(-1);
  const [showExplanation, setShowExplanation] = useState(true);
  const [activeMagic, setActiveMagic] = useState<string | null>(null);
  const timerRef = useRef<number | null>(null);

  const playNote = useCallback((note: any) => { audioService.playPianoNote(note, 0.5, 0.7); }, []);

  useEffect(() => {
    if (playMode !== 'none') {
      timerRef.current = window.setInterval(() => {
        setCurrentStep(prev => {
          let next = prev + 1;
          let start = 0, end = 7;
          if (playMode === 'question') { start = 0; end = 3; }
          if (playMode === 'answer') { start = 4; end = 7; }
          if (next > end || next < start) next = start;
          const isQ = next < 4;
          const grid = isQ ? questionGrid : answerGrid;
          const noteIdx = grid[next % 4];
          if (noteIdx !== -1) playNote(SCALE_NOTES[noteIdx]);
          return next;
        });
      }, 600);
    } else { if (timerRef.current) clearInterval(timerRef.current); setCurrentStep(-1); }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [playMode, questionGrid, answerGrid, playNote]);

  const toggleNote = (grid: 'question'|'answer', step: number, pitch: number) => {
    if (grid === 'question') { const g = [...questionGrid]; g[step] = g[step] === pitch ? -1 : pitch; setQuestionGrid(g); }
    else { const g = [...answerGrid]; g[step] = g[step] === pitch ? -1 : pitch; setAnswerGrid(g); }
    if (pitch !== -1) playNote(SCALE_NOTES[pitch]);
  };

  const applyMagic = (type: 'up'|'down'|'mirror') => {
    setActiveMagic(type); setTimeout(() => setActiveMagic(null), 800);
    if (!questionGrid.some(n => n !== -1)) return;
    let next = [...questionGrid];
    if (type === 'up') next = next.map(n => n === -1 ? -1 : Math.min(n+1, 7));
    else if (type === 'down') next = next.map(n => n === -1 ? -1 : Math.max(n-1, 0));
    else next = [...questionGrid].reverse();
    let last = -1;
    for (let i = next.length-1; i >= 0; i--) { if (next[i] !== -1) { last = i; break; } }
    if (last !== -1) next[last] = 0;
    setAnswerGrid(next);
    handleTogglePlay('answer');
  };

  const handleTogglePlay = (mode: 'full'|'question'|'answer') => {
    if (playMode === mode) setPlayMode('none'); else { setPlayMode(mode); setCurrentStep(-1); }
  };

  const renderGrid = (type: 'question'|'answer', grid: number[], color: typeof PALETTE[keyof typeof PALETTE]) => (
    <div className="flex-1 bg-white rounded-2xl border border-slate-200 shadow-[0_1px_4px_rgba(0,0,0,0.02)] p-3.5 sm:p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-bold" style={{ background: color.accent }}>
            {type === 'question' ? '?' : '!'}
          </div>
          <span className="text-xs font-semibold" style={{ color: color.accent }}>
            {type === 'question' ? '问句 (Question)' : '答句 (Answer)'}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => handleTogglePlay(type)}
            className="w-8 h-8 rounded-xl flex items-center justify-center transition-all text-white active:scale-95"
            style={{ background: playMode === type ? '#ef4444' : color.accent }}
          >
            {playMode === type ? <Pause size={14} fill="currentColor" /> : <Play size={14} fill="currentColor" className="ml-0.5" />}
          </button>
          <button
            onClick={() => type === 'question' ? setQuestionGrid(new Array(4).fill(-1)) : setAnswerGrid(new Array(4).fill(-1))}
            className="p-1.5 text-slate-300 hover:text-red-400 transition-colors"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
      <div className="grid grid-cols-4 gap-1.5 sm:gap-2 h-48 sm:h-56">
        {[...Array(4)].map((_, stepIdx) => {
          const isCurrentCol = currentStep === (type === 'question' ? stepIdx : stepIdx + 4);
          return (
            <div key={stepIdx} className={`flex flex-col gap-1 rounded-xl transition-all ${isCurrentCol ? 'bg-slate-50' : ''}`}>
              {[...Array(8)].reverse().map((_, pitchIdx) => {
                const pitch = 7 - pitchIdx;
                const isActive = grid[stepIdx] === pitch;
                return (
                  <button
                    key={pitchIdx}
                    onClick={() => toggleNote(type, stepIdx, pitch)}
                    className="flex-1 rounded-lg transition-all border flex items-center justify-center hover:scale-[1.02] active:scale-95"
                    style={isActive
                      ? { background: color.accent, borderColor: color.accent + '66' }
                      : { background: '#F8FAFC', borderColor: '#E2E8F0' }
                    }
                  >
                    {isActive && <span className="text-[10px] font-semibold text-white">{NOTE_LABELS[pitch]}</span>}
                  </button>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );

  return (
    <ProjectShell lessonId={6} title="旋律对对子" subtitle="MELODY MIRROR" color="blue"
      actionLabel="保存魔法旋律" actionEnabled={true} onAction={onComplete} onBack={onBack} footerText="Melody Mirror · L6">

      {/* Intro */}
      <div className="text-center mb-4 sm:mb-6">
        <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-800 mb-1.5">旋律的镜像与重力</h3>
        <p className="text-sm font-medium text-slate-400 max-w-lg mx-auto">
          在左边写下你的"提问"，用中间的魔法工具让旋律变形，右边自动生成"答句"
        </p>
      </div>

      {/* Explanation banner */}
      {showExplanation && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-[0_1px_4px_rgba(0,0,0,0.02)] p-4 sm:p-5 mb-4">
          <div className="flex gap-3 items-start">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: PALETTE.blue.bg }}>
              <Wand2 size={16} style={{ color: PALETTE.blue.accent }} />
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-bold text-slate-800 mb-1">三种魔法变换</h4>
              <p className="text-xs font-medium text-slate-500 leading-relaxed">
                <span style={{ color: PALETTE.blue.accent }} className="font-semibold">向上</span> 让每个音升高一级，
                <span style={{ color: PALETTE.orange.accent }} className="font-semibold"> 向下</span> 让每个音降低一级，
                <span style={{ color: PALETTE.green.accent }} className="font-semibold"> 翻转</span> 把旋律顺序倒过来——观察答句的变化。
              </p>
            </div>
            <button onClick={() => setShowExplanation(false)} className="p-1 text-slate-300 hover:text-slate-500 transition-colors">
              <X size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Main grid area */}
      <div className="flex flex-col lg:flex-row items-stretch gap-3 sm:gap-4">
        {renderGrid('question', questionGrid, PALETTE.blue)}

        {/* Magic controls */}
        <div className="flex lg:flex-col items-center justify-center gap-2 px-1">
          {([
            { type: 'up' as const, icon: ArrowUp, label: '向上', color: PALETTE.blue },
            { type: 'down' as const, icon: ArrowDown, label: '向下', color: PALETTE.orange },
            { type: 'mirror' as const, icon: ArrowRightLeft, label: '翻转', color: PALETTE.green },
          ]).map(({ type, icon: Icon, label, color }) => (
            <button
              key={type}
              onClick={() => applyMagic(type)}
              className={`w-12 h-12 sm:w-14 sm:h-14 rounded-xl flex flex-col items-center justify-center gap-0.5 transition-all border ${activeMagic === type ? 'scale-110' : 'hover:scale-[1.02] active:scale-95'}`}
              style={activeMagic === type
                ? { background: color.accent, borderColor: color.accent + '66', color: '#fff' }
                : { background: color.bg, borderColor: color.accent + '33', color: color.accent }
              }
            >
              <Icon size={18} />
              <span className="text-[10px] font-semibold uppercase tracking-widest">{label}</span>
            </button>
          ))}
          <MoveRight size={16} className="text-slate-300 hidden lg:block mt-1" />
        </div>

        {renderGrid('answer', answerGrid, PALETTE.green)}
      </div>
    </ProjectShell>
  );
};

export default MelodyMirrorProject;
