import React, { useState, useEffect, useRef } from 'react';
import { Note } from '../../types';
import { ALL_NOTES } from '../../constants';
import { audioService } from '../../services/audioService';
import { Play, Square, Trash2 } from 'lucide-react';

interface PianoRollProps {
  onPlay: (notes: Note[]) => void;
}

const STEPS = 32;
const PIANO_KEY_WIDTH = 80;
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

  const toggleCell = async (row: number, col: number) => {
    const newGrid = [...grid];
    newGrid[row] = [...newGrid[row]];
    newGrid[row][col] = !newGrid[row][col];
    setGrid(newGrid);
    
    if (newGrid[row][col]) {
        audioService.playPianoNote(ROLL_NOTES[row], 0.3, 0.7);
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
        const interval = (60 / bpm) * 1000 / 4;
        let step = currentStep;
        
        timerRef.current = window.setInterval(() => {
            step = (step + 1) % STEPS;
            setCurrentStep(step);
            
            const notesToPlay: Note[] = [];
            grid.forEach((row, rowIndex) => {
                if (row[step]) {
                    notesToPlay.push(ROLL_NOTES[rowIndex]);
                }
            });

            if (notesToPlay.length > 0) {
                audioService.playPianoChord(notesToPlay, 0.2, 0.7);
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
      <div className={`flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl border ${
        isDark 
          ? 'bg-gray-800 border-gray-700' 
          : 'bg-white border-gray-200'
      }`}>
        <div className="flex items-center gap-2">
          <button
            onClick={startSequencer}
            className={`flex items-center gap-2 px-6 py-2 rounded-full font-bold transition-all ${
              isPlaying 
              ? 'bg-rose-500 hover:bg-rose-600 text-white' 
              : 'bg-emerald-500 hover:bg-emerald-600 text-white'
            }`}
          >
            {isPlaying ? <><Square size={18} fill="currentColor" /> 停止</> : <><Play size={18} fill="currentColor" /> 播放</>}
          </button>
          <button 
            onClick={clearGrid}
            className={`p-2 transition-colors ${
              isDark ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-700'
            }`}
            title="清除"
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

      {/* Piano Roll Grid */}
      <div className={`rounded-xl border overflow-auto ${
        isDark ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'
      }`}>
        <div className="min-w-[800px] p-4">
          {/* Step Indicators */}
          <div className="flex mb-2">
            <div className="flex-shrink-0" style={{ width: PIANO_KEY_WIDTH }}></div>
            <div className="flex-1 flex">
              {Array(STEPS).fill(0).map((_, i) => (
                <div 
                  key={i} 
                  className={`flex-1 text-center text-[10px] transition-all duration-200 ${
                  currentStep === i 
                    ? 'text-rose-500 font-bold scale-110' 
                    : isDark 
                      ? 'text-gray-500' 
                      : 'text-gray-400'
                } ${i % 4 === 0 ? (isDark ? 'text-gray-400 font-bold' : 'text-gray-500 font-bold') : ''}`}
                >
                  {i + 1}
                </div>
              ))}
            </div>
          </div>

          {/* Piano Keys + Grid Rows */}
          <div className="space-y-0">
            {ROLL_NOTES.map((note, rowIdx) => {
              const isBlack = note.name.includes('#');
              return (
                <div key={note.full} className="flex items-center">
                  {/* Piano Key */}
                  <div 
                    className={`flex-shrink-0 h-6 flex items-center justify-end pr-2 text-[10px] font-bold border-b relative ${
                      isBlack 
                        ? 'bg-gray-900 text-white border-gray-700' 
                        : isDark
                          ? 'bg-gradient-to-b from-gray-100 to-gray-200 text-gray-800'
                          : 'bg-gradient-to-b from-white to-gray-50 text-gray-800 border-gray-200'
                    }`}
                    style={{ width: PIANO_KEY_WIDTH }}
                  >
                    <span className="z-10">{note.full}</span>
                  </div>
                  
                  {/* Grid Row */}
                  <div className="flex-1 flex h-6">
                    {Array(STEPS).fill(0).map((_, colIdx) => {
                      const isActive = grid[rowIdx][colIdx];
                      const isCurrentStep = currentStep === colIdx;
                      
                      return (
                        <button
                          key={colIdx}
                          onMouseDown={() => toggleCell(rowIdx, colIdx)}
                          onMouseEnter={(e) => {
                            if(e.buttons === 1) toggleCell(rowIdx, colIdx);
                          }}
                          className={`flex-1 border-r border-b transition-all duration-200 relative ${
                            isActive 
                              ? (isCurrentStep
                                  ? (isBlack 
                                      ? 'bg-gradient-to-br from-violet-400 via-indigo-500 to-purple-600' 
                                      : 'bg-gradient-to-br from-rose-300 via-pink-500 to-rose-500')
                                  : (isBlack 
                                      ? 'bg-gradient-to-br from-violet-600 via-indigo-600 to-purple-700' 
                                      : 'bg-gradient-to-br from-rose-400 via-pink-500 to-rose-600'))
                              : isCurrentStep
                                ? (isBlack 
                                    ? 'bg-gray-200' 
                                    : 'bg-gray-200')
                                : (isBlack 
                                    ? (isDark ? 'bg-gray-800/50' : 'bg-gray-100') 
                                    : (isDark ? 'bg-gray-800' : 'bg-white'))
                          } ${isCurrentStep ? 'z-10' : ''}`}
                          style={{
                            boxShadow: isActive && isCurrentStep
                              ? isBlack
                                ? '0 2px 8px rgba(139, 92, 246, 0.5)'
                                : '0 2px 8px rgba(244, 63, 94, 0.5)'
                              : isActive
                                ? isBlack
                                  ? '0 2px 4px rgba(139, 92, 246, 0.3)'
                                  : '0 2px 4px rgba(244, 63, 94, 0.3)'
                                : 'none',
                          }}
                        />
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PianoRoll;
