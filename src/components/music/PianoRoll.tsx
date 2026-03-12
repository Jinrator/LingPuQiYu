import React, { useState, useEffect, useRef } from 'react';
import { Note } from '../../types';
import { ALL_NOTES } from '../../constants';
import { audioService } from '../../services/audioService';
import { Play, Square, Trash2 } from 'lucide-react';

interface PianoRollNoteEvent {
  note: Note;
  duration: number;
}

interface PianoRollBlock {
  id: string;
  row: number;
  note: Note;
  startStep: number;
  durationSteps: number;
}

interface DragState {
  row: number;
  anchorStep: number;
  currentStep: number;
  hasMoved: boolean;
}

interface PianoRollProps {
  theme_type?: boolean;
  onPlay: (notes: PianoRollNoteEvent[]) => void;
}

const STEPS = 32;
const STEPS_PER_BEAT = 4;
const PIANO_KEY_WIDTH = 80;
const ROLL_NOTES = [...ALL_NOTES].reverse();
const NOTE_DURATION_OPTIONS = [
  { label: '1/4拍', steps: 1 },
  { label: '1/2拍', steps: 2 },
  { label: '1拍', steps: 4 },
  { label: '2拍', steps: 8 },
  { label: '4拍', steps: 16 },
];

const DEFAULT_MELODY_PATTERN = [
  { note: 'C4', step: 0, durationSteps: 3 },
  { note: 'D#4', step: 3, durationSteps: 1 },
  { note: 'G4', step: 5, durationSteps: 3 },
  { note: 'A#4', step: 8, durationSteps: 2 },
  { note: 'G4', step: 11, durationSteps: 1 },
  { note: 'F4', step: 12, durationSteps: 4 },
  { note: 'D#4', step: 18, durationSteps: 2 },
  { note: 'G4', step: 20, durationSteps: 2 },
  { note: 'A#4', step: 22, durationSteps: 2 },
  { note: 'C5', step: 25, durationSteps: 1 },
  { note: 'G4', step: 26, durationSteps: 2 },
  { note: 'D#4', step: 28, durationSteps: 2 },
  { note: 'C4', step: 30, durationSteps: 2 },
];

const clampDurationSteps = (startStep: number, durationSteps: number) => (
  Math.max(1, Math.min(durationSteps, STEPS - startStep))
);

const createDefaultMelodyBlocks = (): PianoRollBlock[] => {
  const blocks: PianoRollBlock[] = [];

  DEFAULT_MELODY_PATTERN.forEach(({ note, step, durationSteps }, index) => {
    const rowIndex = ROLL_NOTES.findIndex((item) => item.full === note);
    if (rowIndex >= 0 && step < STEPS) {
      blocks.push({
        id: `default-${index}`,
        row: rowIndex,
        note: ROLL_NOTES[rowIndex],
        startStep: step,
        durationSteps: clampDurationSteps(step, durationSteps),
      });
    }
  });

  return blocks;
};

const getBlockEndStep = (block: Pick<PianoRollBlock, 'startStep' | 'durationSteps'>) => (
  block.startStep + block.durationSteps - 1
);

const rangesOverlap = (startA: number, endA: number, startB: number, endB: number) => (
  startA <= endB && startB <= endA
);

const PianoRoll: React.FC<PianoRollProps> = ({ theme_type, onPlay }) => {
  const [noteBlocks, setNoteBlocks] = useState<PianoRollBlock[]>(() => createDefaultMelodyBlocks());
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStep, setCurrentStep] = useState(-1);
  const [bpm, setBpm] = useState(92);
  const [selectedDurationSteps, setSelectedDurationSteps] = useState(4);
  const [dragState, setDragState] = useState<DragState | null>(null);

  const isDark = theme_type;
  
  const timerRef = useRef<number | null>(null);
  const nextBlockIdRef = useRef(DEFAULT_MELODY_PATTERN.length);

  const getBlockAtCell = (row: number, step: number) => (
    noteBlocks.find((block) => block.row === row && step >= block.startStep && step <= getBlockEndStep(block)) ?? null
  );

  const previewNote = (row: number, durationSteps: number) => {
    const previewDuration = (60 / bpm) * (durationSteps / STEPS_PER_BEAT);
    audioService.playPianoNote(ROLL_NOTES[row], Math.max(0.12, previewDuration * 0.95), 0.7);
  };

  const placeBlock = (row: number, startStep: number, durationSteps: number) => {
    const safeStartStep = Math.max(0, Math.min(startStep, STEPS - 1));
    const safeDurationSteps = clampDurationSteps(safeStartStep, durationSteps);
    const nextBlock: PianoRollBlock = {
      id: `note-${nextBlockIdRef.current++}`,
      row,
      note: ROLL_NOTES[row],
      startStep: safeStartStep,
      durationSteps: safeDurationSteps,
    };

    setNoteBlocks((prev) => {
      const filtered = prev.filter((block) => {
        if (block.row !== row) {
          return true;
        }

        return !rangesOverlap(
          block.startStep,
          getBlockEndStep(block),
          safeStartStep,
          safeStartStep + safeDurationSteps - 1
        );
      });

      return [...filtered, nextBlock].sort((left, right) => {
        if (left.row !== right.row) {
          return left.row - right.row;
        }
        return left.startStep - right.startStep;
      });
    });

    previewNote(row, safeDurationSteps);
  };

  const removeBlock = (blockId: string) => {
    setNoteBlocks((prev) => prev.filter((block) => block.id !== blockId));
  };

  const finalizeDragPlacement = (activeDragState: DragState) => {
    const { row, anchorStep, currentStep, hasMoved } = activeDragState;

    if (hasMoved) {
      placeBlock(row, Math.min(anchorStep, currentStep), Math.abs(currentStep - anchorStep) + 1);
      return;
    }

    placeBlock(row, anchorStep, selectedDurationSteps);
  };

  const handleCellMouseDown = (row: number, col: number) => {
    const activeBlock = getBlockAtCell(row, col);

    if (activeBlock) {
      removeBlock(activeBlock.id);
      setDragState(null);
      return;
    }

    setDragState({
      row,
      anchorStep: col,
      currentStep: col,
      hasMoved: false,
    });
  };

  const handleCellMouseEnter = (row: number, col: number, isPrimaryButtonPressed: boolean) => {
    if (!isPrimaryButtonPressed) {
      return;
    }

    setDragState((prev) => {
      if (!prev || prev.row !== row) {
        return prev;
      }

      return {
        ...prev,
        currentStep: col,
        hasMoved: prev.hasMoved || prev.anchorStep !== col,
      };
    });
  };

  const clearGrid = () => {
    setNoteBlocks([]);
    setDragState(null);
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
        const interval = (60 / bpm) * 1000 / STEPS_PER_BEAT;
        const stepDuration = interval / 1000;
        let step = currentStep;
        
        timerRef.current = window.setInterval(() => {
            step = (step + 1) % STEPS;
            setCurrentStep(step);
            
            const notesToPlay = noteBlocks
              .filter((block) => block.startStep === step)
              .map((block) => ({
                note: block.note,
                duration: block.durationSteps * stepDuration,
              }));

            if (notesToPlay.length > 0) {
              onPlay(notesToPlay);
            }

        }, interval);
    }
    return () => {
        if (timerRef.current) window.clearInterval(timerRef.current);
    };
  }, [isPlaying, bpm, noteBlocks, onPlay, currentStep]);

  useEffect(() => {
    if (!dragState) {
      return;
    }

    const handleMouseUp = () => {
      finalizeDragPlacement(dragState);
      setDragState(null);
    };

    window.addEventListener('mouseup', handleMouseUp);
    return () => window.removeEventListener('mouseup', handleMouseUp);
  }, [dragState, selectedDurationSteps, bpm]);

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
        
        <div className="flex flex-wrap items-center justify-end gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`text-xs font-medium ${
              isDark ? 'text-gray-400' : 'text-gray-500'
            }`}>
              音符时值
            </span>
            {NOTE_DURATION_OPTIONS.map((option) => {
              const isSelected = selectedDurationSteps === option.steps;

              return (
                <button
                  key={option.steps}
                  type="button"
                  onClick={() => setSelectedDurationSteps(option.steps)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                    isSelected
                      ? 'text-white shadow-[0_6px_18px_rgba(99,102,241,0.24)]'
                      : isDark
                        ? 'bg-gray-700 text-gray-200 hover:bg-gray-600'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                  style={isSelected ? { background: 'linear-gradient(135deg, #6366F1, #8B5CF6)' } : undefined}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
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
        <div className={`w-full text-xs ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>
          点一下按所选时值放置音符，横向拖动会画出一个自定义长音，点击已有音符可整块删除。
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
                      const activeBlock = getBlockAtCell(rowIdx, colIdx);
                      const draftStart = dragState && dragState.row === rowIdx
                        ? Math.min(dragState.anchorStep, dragState.currentStep)
                        : -1;
                      const draftEnd = dragState && dragState.row === rowIdx
                        ? Math.max(dragState.anchorStep, dragState.currentStep)
                        : -1;
                      const isDraftActive = dragState?.row === rowIdx && colIdx >= draftStart && colIdx <= draftEnd;
                      const isActive = Boolean(activeBlock) || isDraftActive;
                      const isCurrentStep = currentStep === colIdx;
                      const isPreviewOnly = isDraftActive && !activeBlock;
                      const isBlockInterior = Boolean(activeBlock) && colIdx < getBlockEndStep(activeBlock);
                      const isDraftInterior = isPreviewOnly && colIdx < draftEnd;
                      const hideRightBorder = isBlockInterior || isDraftInterior;
                      
                      return (
                        <button
                          key={colIdx}
                          type="button"
                          onMouseDown={() => handleCellMouseDown(rowIdx, colIdx)}
                          onMouseEnter={(e) => {
                            handleCellMouseEnter(rowIdx, colIdx, e.buttons === 1);
                          }}
                          className={`flex-1 border-r border-b transition-all duration-200 relative ${
                            isActive 
                              ? (isPreviewOnly
                                  ? 'bg-gradient-to-br from-sky-200 via-indigo-200 to-violet-200 opacity-75'
                                  : isCurrentStep
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
                            borderRightColor: hideRightBorder ? 'transparent' : undefined,
                            boxShadow: isPreviewOnly
                              ? '0 0 0 1px rgba(99, 102, 241, 0.2) inset'
                              : isActive && isCurrentStep
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
