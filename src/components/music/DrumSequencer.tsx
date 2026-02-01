
import React, { useState, useEffect, useRef } from 'react';
import { audioService } from '../../services/audioService';
import { DrumType } from '../../types';
import { Play, Square, Trash2 } from 'lucide-react';

const STEPS = 16;
const INSTRUMENTS: { id: DrumType; label: string; color: string }[] = [
    { id: 'kick', label: '底鼓 (Kick)', color: 'bg-indigo-600' },
    { id: 'snare', label: '军鼓 (Snare)', color: 'bg-rose-500' },
    { id: 'hihat', label: '闭镲 (Hi-hat)', color: 'bg-amber-400' },
    { id: 'openhat', label: '开放镲 (Open)', color: 'bg-amber-300' },
    { id: 'rimshot', label: '边击 (Rim)', color: 'bg-stone-400' },
    { id: 'clap', label: '拍手 (Clap)', color: 'bg-emerald-500' },
    { id: 'hightom', label: '高嗵 (Hi-Tom)', color: 'bg-violet-400' },
    { id: 'midtom', label: '中嗵 (Mid-Tom)', color: 'bg-violet-500' },
    { id: 'lowtom', label: '低嗵 (Low-Tom)', color: 'bg-violet-600' },
    { id: 'crash', label: '吊镲 (Crash)', color: 'bg-yellow-500' },
    { id: 'ride', label: '叮叮镲 (Ride)', color: 'bg-orange-400' },
];

const DrumSequencer: React.FC = ({theme_type}) => {
    const isDark = theme_type;
    const [grid, setGrid] = useState<boolean[][]>(
        INSTRUMENTS.map(() => Array(STEPS).fill(false))
    );
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentStep, setCurrentStep] = useState(-1);
    const [bpm, setBpm] = useState(100);
    const timerRef = useRef<number | null>(null);

    const toggleCell = (row: number, col: number) => {
        const newGrid = [...grid];
        newGrid[row] = [...newGrid[row]];
        newGrid[row][col] = !newGrid[row][col];
        setGrid(newGrid);

        if (newGrid[row][col]) {
            audioService.playDrum(INSTRUMENTS[row].id);
        }
    };

    const clearGrid = () => {
        setGrid(INSTRUMENTS.map(() => Array(STEPS).fill(false)));
        if(isPlaying) stop();
    };

    const stop = () => {
        setIsPlaying(false);
        setCurrentStep(-1);
        if (timerRef.current) {
            window.clearInterval(timerRef.current);
            timerRef.current = null;
        }
    };

    const play = () => {
        if (isPlaying) {
            stop();
            return;
        }
        setIsPlaying(true);
        audioService.resume();
    };

    useEffect(() => {
        if (isPlaying) {
            const interval = (60 / bpm) * 1000 / 4; // 16th notes
            let step = currentStep;

            timerRef.current = window.setInterval(() => {
                step = (step + 1) % STEPS;
                setCurrentStep(step);

                INSTRUMENTS.forEach((inst, idx) => {
                    if (grid[idx][step]) {
                        audioService.playDrum(inst.id);
                    }
                });

            }, interval);
        }
        return () => {
            if (timerRef.current) window.clearInterval(timerRef.current);
        };
    }, [isPlaying, bpm, grid]);

    return (
        <div className="flex flex-col space-y-4">
  {/* Controls */}
  <div className={`flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl shadow-lg border ${
    isDark 
      ? "bg-slate-800 border-slate-700"  // 黑夜：深灰背景，更深灰边框
      : "bg-white border-slate-200"     // 白天：纯白背景，浅灰边框
  }`}>
    <div className="flex items-center gap-2">
      {/* 播放/停止按钮颜色保持不变，因其为高亮操作按钮 */}
      <button
        onClick={play}
        className={`flex items-center gap-2 px-6 py-2 rounded-full font-bold transition-all ${
          isPlaying 
          ? 'bg-rose-500 hover:bg-rose-600 text-white shadow-lg shadow-rose-500/30' 
          : 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/30'
        }`}
      >
        {isPlaying ? <><Square size={18} fill="currentColor" /> 停止 (Stop)</> : <><Play size={18} fill="currentColor" /> 播放 (Play)</>}
      </button>
      {/* 修正清除按钮文字色 */}
      <button 
        onClick={clearGrid}
        className={`p-2 transition-colors ${
          isDark ? "text-slate-400 hover:text-white" : "text-slate-500 hover:text-slate-800"
        }`}
        title="清除 (Clear)"
      >
        <Trash2 size={20} />
      </button>
    </div>
    
    <div className="flex items-center gap-4">
      {/* 修正BPM标签文字色 */}
      <label className={`flex items-center gap-2 font-medium ${
        isDark ? "text-slate-300" : "text-slate-600"
      }`}>
        <span className="text-sm">速度 (BPM): {bpm}</span>
        <input 
          type="range" 
          min="60" 
          max="180" 
          value={bpm} 
          onChange={(e) => setBpm(Number(e.target.value))}
          className="w-32 accent-indigo-500"
        />
      </label>
    </div>
  </div>

  {/* Drum Grid */}
  {/* 修正鼓网格容器背景和边框色 */}
  <div className={`rounded-xl border p-4 shadow-inner overflow-x-auto custom-scrollbar ${
    isDark ? "bg-slate-900 border-slate-700" : "bg-white border-slate-200"
  }`}>
    <div className="min-w-[800px]">
      {/* Step Indicators */}
      <div className="flex mb-2 ml-36">
        {Array(STEPS).fill(0).map((_, i) => (
          <div 
            key={i} 
            className={`flex-1 text-center text-[10px] ${
              isDark ? "text-slate-500" : "text-slate-400"
            } ${Math.floor(i / 4) % 2 === 0 ? `${isDark ? "text-slate-400" : "text-slate-500"} font-bold` : ''}`}
          >
            {i + 1}
          </div>
        ))}
      </div>

      <div className="space-y-1">
        {INSTRUMENTS.map((inst, rowIdx) => (
          <div key={inst.id} className="flex items-center gap-2">
            {/* Label */}
            {/* 修正乐器标签文字色 */}
            <div className="w-36 flex-shrink-0 text-right pr-4 flex items-center justify-end gap-2">
              <div className={`w-3 h-3 rounded-full ${inst.color}`}></div>
              <span className={`text-xs font-bold ${
                isDark ? "text-slate-300" : "text-slate-700"
              }`}>
                {inst.label}
              </span>
            </div>
            
            {/* Row */}
            <div className="flex-1 flex gap-1 h-8">
              {Array(STEPS).fill(0).map((_, colIdx) => {
                const isActive = grid[rowIdx][colIdx];
                const isCurrent = currentStep === colIdx;
                const isBeatStart = colIdx % 4 === 0;

                return (
                  <button
                    key={colIdx}
                    onMouseDown={() => toggleCell(rowIdx, colIdx)}
                    className={`
                      flex-1 rounded-[2px] transition-all relative
                      ${isActive ? inst.color : isDark ? "bg-slate-800 hover:bg-slate-700" : "bg-slate-100 hover:bg-slate-200"}
                      ${isCurrent ? 'ring-1 ring-white brightness-150 z-10' : ''}
                      ${isBeatStart && !isActive ? `${isDark ? "bg-slate-750 border-l border-slate-600" : "bg-slate-50 border-l border-slate-300"}` : ''}
                    `}
                  />
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
</div>
    );
};

export default DrumSequencer;
