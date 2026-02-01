
import React, { useState, useEffect, useRef } from 'react';
import { Note } from '../../types';
import { ALL_NOTES } from '../../constants';
import { audioService } from '../../services/audioService';
import { Play, Square, Trash2 } from 'lucide-react';

interface PianoRollProps {
  onPlay: (notes: Note[]) => void;
}

const STEPS = 32; // Increased steps for more detail
// Full range from C3 to C6
const ROLL_NOTES = [...ALL_NOTES].reverse();

const PianoRoll: React.FC<PianoRollProps> = ({ theme_type, onPlay }) => {
  const [grid, setGrid] = useState<boolean[][]>(
    Array(ROLL_NOTES.length).fill(null).map(() => Array(STEPS).fill(false))
  );
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStep, setCurrentStep] = useState(-1);
  const [bpm, setBpm] = useState(120);

  const isDark = theme_type;
  
  const timerRef = useRef<number | null>(null);

  const toggleCell = (row: number, col: number) => {
    const newGrid = [...grid];
    newGrid[row] = [...newGrid[row]];
    newGrid[row][col] = !newGrid[row][col];
    setGrid(newGrid);
    
    // Preview note
    if (newGrid[row][col]) {
        onPlay([ROLL_NOTES[row]]);
    }
  };

  const clearGrid = () => {
    setGrid(Array(ROLL_NOTES.length).fill(null).map(() => Array(STEPS).fill(false)));
    stopSequencer();
  };

  const startSequencer = () => {
    if (isPlaying) {
        stopSequencer();
        return;
    }
    setIsPlaying(true);
    audioService.resume();
  };

  const stopSequencer = () => {
    setIsPlaying(false);
    setCurrentStep(-1);
    if (timerRef.current) {
        window.clearInterval(timerRef.current);
        timerRef.current = null;
    }
  };

  useEffect(() => {
    if (isPlaying) {
        const interval = (60 / bpm) * 1000 / 4; // 16th notes
        let step = currentStep;
        
        timerRef.current = window.setInterval(() => {
            step = (step + 1) % STEPS;
            setCurrentStep(step);
            
            // Collect notes at this step
            const notesToPlay: Note[] = [];
            grid.forEach((row, rowIndex) => {
                if (row[step]) {
                    notesToPlay.push(ROLL_NOTES[rowIndex]);
                }
            });

            if (notesToPlay.length > 0) {
                // Play chord
                notesToPlay.forEach(n => audioService.playNote(n.frequency, 0.2, 'triangle'));
            }

        }, interval);
    }
    return () => {
        if (timerRef.current) window.clearInterval(timerRef.current);
    };
  }, [isPlaying, bpm, grid]); 

  return (
    
   <div className={`flex flex-col space-y-4 ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
  {/* Controls */}
  <div className={`flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl shadow-lg border ${
    isDark 
      ? 'bg-gray-800 border-gray-700' 
      : 'bg-white border-gray-200'
  }`}>
    <div className="flex items-center gap-2">
      <button
        onClick={startSequencer}
        className={`flex items-center gap-2 px-6 py-2 rounded-full font-bold transition-all ${
          isPlaying 
          ? 'bg-rose-500 hover:bg-rose-600 text-white shadow-lg shadow-rose-500/30' 
          : 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/30'
        }`}
      >
        {isPlaying ? <><Square size={18} fill="currentColor" /> 停止 (Stop)</> : <><Play size={18} fill="currentColor" /> 播放 (Play)</>}
      </button>
      <button 
        onClick={clearGrid}
        className={`p-2 transition-colors ${
          isDark ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-700'
        }`}
        title="清除 (Clear)"
      >
        <Trash2 size={20} />
      </button>
    </div>
    
    <div className="flex items-center gap-4">
      <label className={`flex items-center gap-2 font-medium ${
        isDark ? 'text-gray-300' : 'text-gray-600'
      }`}>
        <span className="text-sm">速度 (BPM): {bpm}</span>
        <input 
          type="range" 
          min="60" 
          max="180" 
          value={bpm} 
          onChange={(e) => setBpm(Number(e.target.value))}
          className={`w-32 ${isDark ? 'accent-indigo-400' : 'accent-indigo-500'}`}
        />
      </label>
    </div>
  </div>

  {/* Piano Roll Grid Area */}
  <div className={`relative h-[600px] overflow-hidden rounded-xl border shadow-inner flex flex-col ${
    isDark ? 'bg-gray-900 border-gray-700' : 'bg-gray-100 border-gray-300'
  }`}>
    {/* Step Header */}
    <div className={`flex h-8 border-b ml-[80px] overflow-hidden ${
      isDark ? 'bg-gray-800 border-gray-700' : 'bg-gray-200 border-gray-300'
    }`}>
      <div className="flex w-full">
        {Array(STEPS).fill(0).map((_, i) => (
          <div 
            key={i} 
            className={`flex-1 border-r flex items-center justify-center text-[10px] ${
              currentStep === i 
                ? 'bg-indigo-500 text-white' 
                : isDark 
                  ? 'text-gray-500 border-gray-700' 
                  : 'text-gray-600 border-gray-300'
            }`}
          >
            {i + 1}
          </div>
        ))}
      </div>
    </div>

    {/* Scrollable Area */}
    <div className="flex-1 overflow-y-scroll overflow-x-hidden custom-scrollbar relative">
      <div className="flex">
        {/* Vertical Piano Keys (Left Axis) */}
        <div className="sticky left-0 w-[80px] z-20 shadow-xl">
          {ROLL_NOTES.map((note) => {
            const isBlack = note.name.includes('#');
            return (
              <div 
                key={note.full} 
                className={`
                  h-6 flex items-center justify-end pr-2 text-[10px] font-bold border-b relative w-[80px] bg-black bg-black text-gray-400
                  
                `}
              >
                <span className="z-10">{note.full}</span>
                {isBlack ? (
                  <div className={`absolute top-0 right-0 h-full w-[50px] border-b rounded-l-sm bg-black border-black`}></div>
                ) : (
                  <div className={`absolute top-0 right-0 h-full w-[80px] border-b bg-white border-gray-300 `}></div>
                )}
              </div>
            );
          })}
        </div>

        {/* The Grid */}
        <div className={`flex-1 min-w-[800px] relative ${
          isDark ? 'bg-[#131720]' : 'bg-gray-200'
        }`}>
          {ROLL_NOTES.map((note, rowIdx) => {
            const isBlack = note.name.includes('#');
            return (
              <div key={note.full} className={`flex h-6 w-full ${
                isBlack ? (isDark ? 'bg-gray-800/30' : 'bg-gray-300/50') : 'bg-transparent'
              }`}>
                {Array(STEPS).fill(0).map((_, colIdx) => {
                  const isActive = grid[rowIdx][colIdx];
                  const isCurrentStep = currentStep === colIdx;
                  const isBeat = colIdx % 4 === 0;
                  
                  return (
                    <div 
                      key={colIdx}
                      onMouseDown={() => toggleCell(rowIdx, colIdx)}
                      onMouseEnter={(e) => {
                        if(e.buttons === 1) toggleCell(rowIdx, colIdx);
                      }}
                      className={`
                        flex-1 border-r border-b cursor-pointer transition-none
                        ${isActive 
                          ? 'bg-indigo-500 border-indigo-400 shadow-[0_0_10px_rgba(99,102,241,0.5)]' 
                          : isDark 
                            ? 'hover:bg-white/5 border-gray-800/50 border-b-gray-800/30' 
                            : 'hover:bg-black/5 border-gray-400/50 border-b-gray-400/30'
                        }
                        ${isCurrentStep && !isActive ? (isDark ? 'bg-white/10' : 'bg-black/10') : ''}
                        ${isBeat && !isActive ? (isDark ? 'border-l border-l-gray-700/50' : 'border-l border-l-gray-400/50') : ''}
                      `}
                    >
                    </div>
                  );
                })}
              </div>
            );
          })}
          
          {/* Playhead Line */}
          {currentStep >= 0 && (
            <div 
    className={`absolute top-0 bottom-0 w-[2px] z-10 pointer-events-none transition-all duration-75 ${
      isDark ? 'bg-yellow-400' : 'bg-red-500'
    }`}
    style={{ left: `${(currentStep / STEPS) * 100}%` }}
  ></div>
          )}
        </div>
      </div>
    </div>
  </div>
</div>
  );
};

export default PianoRoll;
