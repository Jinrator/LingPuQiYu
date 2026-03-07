import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, Trash2 } from 'lucide-react';
import { audioService } from '../../services/audioService';
import { DrumType } from '../../types';
import { PALETTE } from '../../constants/palette';
import ProjectShell from './ProjectShell';

interface RhythmLegoProjectProps {
  onComplete: () => void;
  onBack: () => void;
  theme?: 'light' | 'dark';
}

const TRACKS: { id: DrumType; name: string; icon: string; paletteKey: keyof typeof PALETTE }[] = [
  { id: 'hihat', name: '擦片 (Hi-hat)', icon: '✨', paletteKey: 'yellow' },
  { id: 'snare', name: '军鼓 (Snare)', icon: '👏', paletteKey: 'blue' },
  { id: 'kick',  name: '底鼓 (Kick)',  icon: '🥁', paletteKey: 'pink' },
];

const RhythmLegoProject: React.FC<RhythmLegoProjectProps> = ({ onComplete, onBack }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [bpm, setBpm] = useState(110);
  const [grid, setGrid] = useState<Record<string, boolean[]>>({
    kick: new Array(16).fill(false), snare: new Array(16).fill(false), hihat: new Array(16).fill(false),
  });
  const timerRef = useRef<number | null>(null);

  const playSound = useCallback((type: DrumType) => { audioService.playDrum(type); }, []);

  useEffect(() => {
    if (isPlaying) {
      const interval = (60 / bpm) * 1000 / 4;
      timerRef.current = window.setInterval(() => {
        setCurrentStep((prev) => {
          const next = (prev + 1) % 16;
          Object.keys(grid).forEach(trackId => { if (grid[trackId][next]) playSound(trackId as DrumType); });
          return next;
        });
      }, interval);
    } else { if (timerRef.current) clearInterval(timerRef.current); }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isPlaying, bpm, grid, playSound]);

  const toggleStep = (trackId: string, idx: number) => {
    const newGrid = { ...grid, [trackId]: [...grid[trackId]] };
    newGrid[trackId][idx] = !newGrid[trackId][idx];
    setGrid(newGrid);
    if (newGrid[trackId][idx]) playSound(trackId as DrumType);
  };

  return (
    <ProjectShell
      lessonId={3}
      title="节奏乐高工厂"
      subtitle="RHYTHM LEGO LAB"
      color="pink"
      actionLabel="保存节奏"
      actionEnabled={true}
      onAction={onComplete}
      onBack={onBack}
      footerText="Lego Lab · Audio Engine 2.0"
    >
      {/* Intro */}
      <div className="text-center mb-4 sm:mb-6">
        <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-800 mb-2">拼接你的乐高节拍</h3>
        <p className="text-sm font-medium text-slate-400 max-w-lg mx-auto">
          点击彩色方块，像玩乐高一样拼出你的第一个 16 步节奏
        </p>
      </div>

      {/* BPM */}
      <div className="flex items-center justify-center gap-4 mb-4 sm:mb-6">
        <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-white border border-slate-200 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
          <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">BPM</span>
          <input type="range" min="60" max="180" value={bpm} onChange={(e) => setBpm(parseInt(e.target.value))} className="w-24 sm:w-32 accent-[#F57EB6]" />
          <span className="text-sm font-bold text-slate-800 w-8">{bpm}</span>
        </div>
      </div>

      {/* Grid */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-[0_1px_4px_rgba(0,0,0,0.02)] p-3.5 sm:p-6">
        <div className="flex flex-col gap-4 sm:gap-5">
          {TRACKS.map((track) => {
            const color = PALETTE[track.paletteKey];
            return (
              <div key={track.id} className="flex items-center gap-3 sm:gap-4">
                <div className="w-20 sm:w-28 flex flex-col items-center justify-center gap-0.5 flex-shrink-0">
                  <span className="text-lg sm:text-xl">{track.icon}</span>
                  <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 hidden sm:block">{track.name.split(' ')[0]}</span>
                </div>
                <div className="flex-1 grid grid-cols-8 sm:grid-cols-16 gap-1 sm:gap-1.5">
                  {grid[track.id].map((active, idx) => {
                    const isCurrent = currentStep === idx && isPlaying;
                    const isQuarter = idx % 4 === 0;
                    return (
                      <button
                        key={idx}
                        onClick={() => toggleStep(track.id, idx)}
                        className={`aspect-square rounded-lg sm:rounded-xl transition-all border ${isCurrent ? 'ring-2' : ''}`}
                        style={
                          active
                            ? { background: color.accent, borderColor: color.accent + '66', ...(isCurrent ? { boxShadow: `0 0 0 3px ${color.accent}22` } : {}) }
                            : { background: isQuarter ? '#F0F4FF' : '#F8FAFC', borderColor: '#E2E8F0', ...(isCurrent ? { boxShadow: `0 0 0 3px ${color.accent}22` } : {}) }
                        }
                      >
                        {active && <div className="w-full h-full flex items-center justify-center"><div className="w-1.5 h-1.5 rounded-full bg-white/50" /></div>}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Controls */}
        <div className="flex justify-center gap-3 mt-5 sm:mt-6">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="w-14 h-14 rounded-xl flex items-center justify-center transition-all text-white active:scale-95"
            style={{ background: isPlaying ? '#ef4444' : '#1e293b' }}
          >
            {isPlaying ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" className="ml-1" />}
          </button>
          <button
            onClick={() => setGrid({ kick: new Array(16).fill(false), snare: new Array(16).fill(false), hihat: new Array(16).fill(false) })}
            className="w-14 h-14 rounded-xl flex items-center justify-center border border-slate-200 text-slate-400 bg-white hover:bg-slate-50 transition-all active:scale-95"
          >
            <Trash2 size={20} />
          </button>
        </div>
      </div>

      {/* Legend */}
      <div className="mt-4 flex justify-center gap-4 sm:gap-6 flex-wrap">
        {TRACKS.map(track => (
          <div key={track.id} className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ background: PALETTE[track.paletteKey].accent }} />
            <span className="text-xs font-semibold text-slate-400">{track.name}</span>
          </div>
        ))}
      </div>
    </ProjectShell>
  );
};

export default RhythmLegoProject;
