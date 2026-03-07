import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, Trash2, Check } from 'lucide-react';
import { audioService } from '../../services/audioService';
import { PALETTE } from '../../constants/palette';
import ProjectShell from './ProjectShell';

interface RhythmColoringProjectProps {
  onComplete: () => void;
  onBack: () => void;
  theme?: 'light' | 'dark';
}

const RhythmColoringProject: React.FC<RhythmColoringProjectProps> = ({ onComplete, onBack }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [bpm, setBpm] = useState(100);
  const [grid, setGrid] = useState<boolean[]>(new Array(16).fill(false));
  const timerRef = useRef<number | null>(null);

  const playClick = useCallback(() => { audioService.playDrum('hihat'); }, []);

  useEffect(() => {
    if (isPlaying) {
      const interval = (60 / bpm) * 1000 / 4;
      timerRef.current = window.setInterval(() => {
        setCurrentStep((prev) => {
          const next = (prev + 1) % 16;
          if (grid[next]) playClick();
          return next;
        });
      }, interval);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isPlaying, bpm, grid, playClick]);

  const toggleStep = (idx: number) => {
    const newGrid = [...grid];
    newGrid[idx] = !newGrid[idx];
    setGrid(newGrid);
    if (newGrid[idx]) playClick();
  };

  return (
    <ProjectShell
      lessonId={2}
      title="律动填色游戏"
      subtitle="RHYTHM COLORING PROJECT"
      color="blue"
      actionLabel="完成挑战"
      actionEnabled={true}
      onAction={onComplete}
      onBack={onBack}
      footerText="Rhythm Grid Engine · L2 Project"
    >
      {/* Intro */}
      <div className="text-center mb-5 sm:mb-8">
        <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-800 mb-2">填涂你的节拍</h3>
        <p className="text-sm font-medium text-slate-400 max-w-lg mx-auto">
          把杂乱的声响变成整齐的节奏。在大格子（正拍）和小格子（弱拍）中填入颜色，创造你的第一个 Loop
        </p>
      </div>

      {/* BPM control */}
      <div className="flex items-center justify-center gap-4 mb-5 sm:mb-6">
        <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-white border border-slate-200 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
          <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">速度</span>
          <input type="range" min="60" max="180" value={bpm} onChange={(e) => setBpm(parseInt(e.target.value))} className="w-24 sm:w-32 accent-[#5BA4F5]" />
          <span className="text-sm font-bold text-slate-800 w-8">{bpm}</span>
        </div>
      </div>

      {/* Grid */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-[0_1px_4px_rgba(0,0,0,0.02)] p-4 sm:p-8">
        {/* Controls */}
        <div className="flex justify-center gap-3 mb-5 sm:mb-8">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl flex items-center justify-center transition-all text-white active:scale-95"
            style={{ background: isPlaying ? '#ef4444' : PALETTE.blue.accent }}
          >
            {isPlaying ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" className="ml-1" />}
          </button>
          <button
            onClick={() => setGrid(new Array(16).fill(false))}
            className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl flex items-center justify-center border border-slate-200 text-slate-400 bg-white hover:bg-slate-50 transition-all active:scale-95"
          >
            <Trash2 size={20} />
          </button>
        </div>

        {/* Step grid */}
        <div className="grid grid-cols-8 gap-2 sm:gap-3">
          {grid.map((active, idx) => {
            const isQuarter = idx % 4 === 0;
            const isCurrent = currentStep === idx && isPlaying;
            return (
              <div key={idx} className="flex flex-col items-center gap-2">
                <button
                  onClick={() => toggleStep(idx)}
                  className={`relative transition-all rounded-xl border-2 ${isQuarter ? 'w-full aspect-square' : 'w-[90%] aspect-square'}`}
                  style={
                    active
                      ? { background: PALETTE.blue.accent, borderColor: PALETTE.blue.accent + '66' }
                      : { background: '#F8FAFC', borderColor: '#E2E8F0' }
                  }
                >
                  {active && <div className="absolute inset-0 flex items-center justify-center"><div className="w-2 h-2 rounded-full bg-white/60" /></div>}
                  {isCurrent && <div className="absolute inset-[-4px] rounded-xl border-2 opacity-40" style={{ borderColor: PALETTE.blue.accent }} />}
                  {isQuarter && !active && <div className="absolute bottom-1.5 right-1.5 w-1 h-1 rounded-full bg-slate-300" />}
                </button>
                <span className={`text-[10px] font-semibold uppercase tracking-widest transition-all ${isCurrent ? 'text-slate-600' : 'text-slate-300'}`}>
                  {isQuarter ? 'Beat' : '·'}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </ProjectShell>
  );
};

export default RhythmColoringProject;
