import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Note } from '../../types';
import { ALL_NOTES } from '../../constants';
import { audioService } from '../../services/audioService';
import { Play, Square, Download } from 'lucide-react';
import { DetectedNote } from '../../services/pitchDetectionService';
import { exportToMidi, downloadMidi } from '../../services/midiExportService';

interface TranscriptionPianoRollProps {
  detectedNotes: DetectedNote[];
  duration: number;
  bpm: number;
  theme?: 'light' | 'dark';
}

interface NoteBlock {
  note: DetectedNote;
  rowIndex: number;
  startStep: number;
  endStep: number;
}

interface ViewState {
  offsetX: number;
  offsetY: number;
  scale: number;
  isDragging: boolean;
  lastMouseX: number;
  lastMouseY: number;
}

const MIDI_MIN = 21;
const MIDI_MAX = 108;
const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

const getNoteName = (midi: number): string => {
  const noteIndex = midi % 12;
  const octave = Math.floor(midi / 12) - 1;
  return `${NOTE_NAMES[noteIndex]}${octave}`;
};

const isBlackKey = (midi: number): boolean => {
  const noteIndex = midi % 12;
  return [1, 3, 6, 8, 10].includes(noteIndex);
};

const TranscriptionPianoRoll: React.FC<TranscriptionPianoRollProps> = ({
  detectedNotes,
  duration,
  bpm,
  theme = 'dark'
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStep, setCurrentStep] = useState(-1);
  const [noteBlocks, setNoteBlocks] = useState<NoteBlock[]>([]);
  const [localBpm, setLocalBpm] = useState(bpm || 120);
  const [autoScroll, setAutoScroll] = useState(true);
  const [viewState, setViewState] = useState<ViewState>({
    offsetX: 0,
    offsetY: 0,
    scale: 1,
    isDragging: false,
    lastMouseX: 0,
    lastMouseY: 0
  });
  const [hoveredNote, setHoveredNote] = useState<DetectedNote | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  
  const timerRef = useRef<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDark = theme === 'dark';
  
  const beatsPerBar = 4;
  const barsCount = Math.max(4, Math.ceil(duration / (60 / bpm) / beatsPerBar));
  const STEPS = barsCount * beatsPerBar * 4;
  const beatDuration = 60 / bpm;
  const stepDuration = beatDuration / 4;
  
  const PIANO_WIDTH = 70;
  const NOTE_HEIGHT = 16;
  const TIME_SCALE = 100;
  const HEADER_HEIGHT = 30;

  const allNotes = detectedNotes;
  
  const minMidi = MIDI_MIN;
  const maxMidi = MIDI_MAX;
  const midiRange = maxMidi - minMidi + 1;

  const defaultViewMidi = allNotes.length > 0 
    ? {
        min: Math.max(MIDI_MIN, Math.min(...allNotes.map(n => n.midiNumber)) - 2),
        max: Math.min(MIDI_MAX, Math.max(...allNotes.map(n => n.midiNumber)) + 2)
      }
    : { min: 60, max: 72 };

  useEffect(() => {
    const blocks: NoteBlock[] = [];
    
    for (const note of detectedNotes) {
      const startStep = Math.floor(note.startTime / stepDuration);
      const endStep = Math.ceil(note.endTime / stepDuration);
      const rowIndex = maxMidi - note.midiNumber;
      
      blocks.push({
        note,
        rowIndex,
        startStep: Math.max(0, startStep),
        endStep: Math.min(STEPS, endStep)
      });
    }
    
    setNoteBlocks(blocks);
  }, [detectedNotes, duration, bpm, STEPS, stepDuration]);

  useEffect(() => {
    setLocalBpm(bpm || 120);
  }, [bpm]);

  useEffect(() => {
    if (allNotes.length > 0 && containerRef.current) {
      const containerHeight = containerRef.current.clientHeight - HEADER_HEIGHT;
      const noteHeight = NOTE_HEIGHT;
      const notesHeight = (defaultViewMidi.max - defaultViewMidi.min + 1) * noteHeight;
      const defaultOffsetY = Math.max(0, (maxMidi - defaultViewMidi.max) * noteHeight - (containerHeight - notesHeight) / 2);
      setViewState(prev => ({
        ...prev,
        offsetY: defaultOffsetY
      }));
    }
  }, [detectedNotes]);

  const stopSequencer = useCallback(() => {
    setIsPlaying(false);
    setCurrentStep(-1);
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const startSequencer = useCallback(() => {
    if (isPlaying) {
      stopSequencer();
      return;
    }
    
    setIsPlaying(true);
    audioService.resume();
    setCurrentStep(0);
  }, [isPlaying, stopSequencer]);

  useEffect(() => {
    if (isPlaying) {
      const interval = (60 / localBpm) * 1000 / 4;
      
      timerRef.current = window.setInterval(() => {
        setCurrentStep(prev => {
          const next = (prev + 1) % STEPS;
          
          const notesToPlay = noteBlocks
            .filter(block => block.startStep === next)
            .map(block => block.note);
          
          if (notesToPlay.length > 0) {
            const velocities = notesToPlay.map(n => n.velocity / 127);
            const avgVelocity = velocities.reduce((a, b) => a + b, 0) / velocities.length;
            notesToPlay.forEach(n => {
              audioService.playPianoNote(n.note, n.duration * 0.9, avgVelocity);
            });
          }
          
          return next;
        });
      }, interval);
    }
    
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
    };
  }, [isPlaying, localBpm, noteBlocks, STEPS]);

  useEffect(() => {
    if (autoScroll && isPlaying && currentStep >= 0) {
      const currentTime = currentStep * stepDuration;
      const playheadX = PIANO_WIDTH + currentTime * TIME_SCALE * viewState.scale;
      
      if (containerRef.current) {
        const containerWidth = containerRef.current.clientWidth;
        const visibleWidth = containerWidth - PIANO_WIDTH;
        const targetOffsetX = Math.max(0, playheadX - PIANO_WIDTH - visibleWidth / 3);
        
        setViewState(prev => ({
          ...prev,
          offsetX: targetOffsetX
        }));
      }
    }
  }, [currentStep, autoScroll, isPlaying, viewState.scale, stepDuration]);

  const drawPianoRoll = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const displayWidth = container.clientWidth;
    const displayHeight = container.clientHeight;
    
    canvas.width = displayWidth * dpr;
    canvas.height = displayHeight * dpr;
    canvas.style.width = `${displayWidth}px`;
    canvas.style.height = `${displayHeight}px`;
    
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, displayWidth, displayHeight);

    ctx.save();
    ctx.translate(-viewState.offsetX, -viewState.offsetY);

    ctx.fillStyle = isDark ? '#0a0f1a' : '#f8fafc';
    ctx.fillRect(viewState.offsetX, viewState.offsetY, displayWidth, displayHeight);

    ctx.strokeStyle = isDark ? '#1e293b' : '#e2e8f0';
    ctx.lineWidth = 1;

    for (let midi = minMidi; midi <= maxMidi; midi++) {
      const y = HEADER_HEIGHT + (maxMidi - midi) * NOTE_HEIGHT;
      const isBlack = isBlackKey(midi);
      
      if (isBlack) {
        ctx.fillStyle = isDark ? '#1e293b' : '#e2e8f0';
        ctx.fillRect(PIANO_WIDTH, y, duration * TIME_SCALE * viewState.scale, NOTE_HEIGHT);
      }
      
      ctx.beginPath();
      ctx.moveTo(PIANO_WIDTH, y);
      ctx.lineTo(PIANO_WIDTH + duration * TIME_SCALE * viewState.scale, y);
      ctx.stroke();
    }

    const measureDuration = beatDuration * 4;
    const numMeasures = Math.ceil(duration / measureDuration);

    for (let measure = 0; measure <= numMeasures; measure++) {
      const x = PIANO_WIDTH + measure * measureDuration * TIME_SCALE * viewState.scale;
      
      ctx.strokeStyle = measure % 4 === 0 
        ? (isDark ? '#3b82f6' : '#60a5fa') 
        : (isDark ? '#334155' : '#cbd5e1');
      ctx.lineWidth = measure % 4 === 0 ? 2 : 1;
      ctx.beginPath();
      ctx.moveTo(x, HEADER_HEIGHT);
      ctx.lineTo(x, HEADER_HEIGHT + midiRange * NOTE_HEIGHT);
      ctx.stroke();
    }

    noteBlocks.forEach(block => {
      const x = PIANO_WIDTH + block.note.startTime * TIME_SCALE * viewState.scale;
      const y = HEADER_HEIGHT + (maxMidi - block.note.midiNumber) * NOTE_HEIGHT + 1;
      const width = block.note.duration * TIME_SCALE * viewState.scale;
      const height = NOTE_HEIGHT - 2;

      const isHovered = hoveredNote === block.note;
      const isActive = currentStep >= block.startStep && currentStep < block.endStep;
      
      if (isActive) {
        ctx.fillStyle = isDark ? '#fbbf24' : '#f59e0b';
      } else if (isHovered) {
        ctx.fillStyle = isDark ? '#60a5fa' : '#3b82f6';
      } else {
        const velocity = block.note.velocity / 127;
        if (velocity > 0.8) {
          ctx.fillStyle = isDark ? '#3b82f6' : '#2563eb';
        } else if (velocity > 0.6) {
          ctx.fillStyle = isDark ? '#60a5fa' : '#3b82f6';
        } else {
          ctx.fillStyle = isDark ? '#93c5fd' : '#60a5fa';
        }
      }
      
      ctx.strokeStyle = isDark ? '#818cf8' : '#3b82f6';
      ctx.lineWidth = 1;
      
      const radius = 3;
      ctx.beginPath();
      ctx.roundRect(x, y, Math.max(width, 2), height, radius);
      ctx.fill();
      ctx.stroke();

      if (width > 30) {
        ctx.fillStyle = '#ffffff';
        ctx.font = '10px Arial';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText(block.note.note.full, x + 4, y + height / 2);
      }
    });

    const currentTime = currentStep * stepDuration;
    const playheadX = PIANO_WIDTH + currentTime * TIME_SCALE * viewState.scale;
    ctx.strokeStyle = isDark ? '#fbbf24' : '#ef4444';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(playheadX, HEADER_HEIGHT);
    ctx.lineTo(playheadX, HEADER_HEIGHT + midiRange * NOTE_HEIGHT);
    ctx.stroke();

    ctx.fillStyle = isDark ? '#fbbf24' : '#ef4444';
    ctx.beginPath();
    ctx.moveTo(playheadX - 6, HEADER_HEIGHT - 5);
    ctx.lineTo(playheadX + 6, HEADER_HEIGHT - 5);
    ctx.lineTo(playheadX, HEADER_HEIGHT + 5);
    ctx.closePath();
    ctx.fill();

    ctx.restore();

    ctx.fillStyle = isDark ? '#1e293b' : '#f1f5f9';
    ctx.fillRect(0, HEADER_HEIGHT, PIANO_WIDTH, displayHeight - HEADER_HEIGHT);

    for (let midi = minMidi; midi <= maxMidi; midi++) {
      const y = HEADER_HEIGHT + (maxMidi - midi) * NOTE_HEIGHT - viewState.offsetY;
      
      if (y < HEADER_HEIGHT - NOTE_HEIGHT || y > displayHeight) continue;
      
      const isBlack = isBlackKey(midi);
      
      if (isBlack) {
        ctx.fillStyle = isDark ? '#0f172a' : '#1e293b';
        ctx.fillRect(0, y, PIANO_WIDTH, NOTE_HEIGHT);
      } else {
        ctx.fillStyle = isDark ? '#f8fafc' : '#ffffff';
        ctx.fillRect(0, y, PIANO_WIDTH, NOTE_HEIGHT);
      }
      
      ctx.strokeStyle = isDark ? '#334155' : '#e2e8f0';
      ctx.strokeRect(0, y, PIANO_WIDTH, NOTE_HEIGHT);

      if (midi % 12 === 0) {
        ctx.fillStyle = isBlack ? (isDark ? '#94a3b8' : '#64748b') : (isDark ? '#334155' : '#1e293b');
        ctx.font = '10px Arial';
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';
        ctx.fillText(getNoteName(midi), PIANO_WIDTH - 5, y + NOTE_HEIGHT / 2);
      }
    }

    ctx.fillStyle = isDark ? '#1a1a2e' : '#f1f5f9';
    ctx.fillRect(0, 0, PIANO_WIDTH, HEADER_HEIGHT);
    ctx.fillRect(PIANO_WIDTH, 0, displayWidth - PIANO_WIDTH, HEADER_HEIGHT);

    ctx.fillStyle = isDark ? '#888' : '#64748b';
    ctx.font = '11px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    for (let measure = 0; measure <= numMeasures; measure++) {
      const x = PIANO_WIDTH + measure * measureDuration * TIME_SCALE * viewState.scale - viewState.offsetX;
      if (x >= PIANO_WIDTH && x <= displayWidth) {
        ctx.fillText(`${measure + 1}`, x, HEADER_HEIGHT / 2);
      }
    }

  }, [noteBlocks, duration, viewState, hoveredNote, currentStep, isDark, stepDuration, beatDuration, minMidi, maxMidi, midiRange]);

  useEffect(() => {
    drawPianoRoll();
  }, [drawPianoRoll]);

  useEffect(() => {
    const handleResize = () => drawPianoRoll();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [drawPianoRoll]);

  useEffect(() => {
    let animationId: number;
    
    const animate = () => {
      drawPianoRoll();
      if (isPlaying) {
        animationId = requestAnimationFrame(animate);
      }
    };
    
    if (isPlaying) {
      animationId = requestAnimationFrame(animate);
    }
    
    return () => {
      if (animationId) cancelAnimationFrame(animationId);
    };
  }, [isPlaying, drawPianoRoll]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (autoScroll && isPlaying) {
      setAutoScroll(false);
    }
    setViewState(prev => ({
      ...prev,
      isDragging: true,
      lastMouseX: e.clientX,
      lastMouseY: e.clientY
    }));
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = e.clientX - rect.left + viewState.offsetX;
    const y = e.clientY - rect.top + viewState.offsetY;

    setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top });

    if (viewState.isDragging) {
      const deltaX = e.clientX - viewState.lastMouseX;
      const deltaY = e.clientY - viewState.lastMouseY;

      const maxOffsetY = midiRange * NOTE_HEIGHT - (containerRef.current?.clientHeight || 500) + HEADER_HEIGHT;
      
      setViewState(prev => ({
        ...prev,
        offsetX: Math.max(0, prev.offsetX - deltaX),
        offsetY: Math.max(0, Math.min(maxOffsetY, prev.offsetY - deltaY)),
        lastMouseX: e.clientX,
        lastMouseY: e.clientY
      }));
    } else {
      const noteX = x - PIANO_WIDTH;
      const noteY = y - HEADER_HEIGHT;
      
      let foundNote: DetectedNote | null = null;
      
      for (const block of noteBlocks) {
        const noteStartX = block.note.startTime * TIME_SCALE * viewState.scale;
        const noteEndX = noteStartX + block.note.duration * TIME_SCALE * viewState.scale;
        const noteYPos = (maxMidi - block.note.midiNumber) * NOTE_HEIGHT;
        
        if (noteX >= noteStartX && noteX <= noteEndX &&
            noteY >= noteYPos && noteY <= noteYPos + NOTE_HEIGHT) {
          foundNote = block.note;
          break;
        }
      }
      
      setHoveredNote(foundNote);
    }
  };

  const handleMouseUp = () => {
    setViewState(prev => ({ ...prev, isDragging: false }));
  };

  const handleMouseLeave = () => {
    setViewState(prev => ({ ...prev, isDragging: false }));
    setHoveredNote(null);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    
    if (autoScroll && isPlaying) {
      setAutoScroll(false);
    }
    
    if (e.ctrlKey) {
      const scaleFactor = e.deltaY > 0 ? 0.9 : 1.1;
      const newScale = Math.max(0.5, Math.min(5, viewState.scale * scaleFactor));
      
      setViewState(prev => ({
        ...prev,
        scale: newScale
      }));
    } else {
      const maxOffsetY = midiRange * NOTE_HEIGHT - (containerRef.current?.clientHeight || 500) + HEADER_HEIGHT;
      
      setViewState(prev => ({
        ...prev,
        offsetX: Math.max(0, prev.offsetX + e.deltaX),
        offsetY: Math.max(0, Math.min(maxOffsetY, prev.offsetY + e.deltaY))
      }));
    }
  };

  const handleExportMidi = () => {
    const midiBlob = exportToMidi(detectedNotes, { bpm: localBpm });
    const timestamp = new Date().toISOString().slice(0, 10);
    downloadMidi(midiBlob, `melody-${timestamp}.mid`);
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className={`flex flex-col space-y-4 ${isDark ? 'bg-transparent' : 'bg-transparent'}`}>
      <div className={`flex flex-wrap items-center justify-between gap-4 p-6 rounded-[2rem] border ${
        isDark 
          ? 'bg-slate-900/60 border-white/5' 
          : 'bg-white border-blue-50'
      }`}>
        <div className="flex items-center gap-3">
          <button
            onClick={startSequencer}
            className={`flex items-center gap-2 px-8 py-3 rounded-2xl font-black text-sm text-white transition-all ${
              isPlaying 
                ? 'bg-rose-500 hover:bg-rose-600' 
                : 'bg-emerald-500 hover:bg-emerald-600'
            }`}
          >
            {isPlaying ? <><Square size={18} fill="currentColor" /> 停止回放</> : <><Play size={18} fill="currentColor" /> 播放预览</>}
          </button>
          
          <button
            onClick={handleExportMidi}
            className={`flex items-center gap-2 px-8 py-3 rounded-2xl font-black text-sm text-white transition-all ${
              isDark 
                ? 'bg-indigo-600 hover:bg-indigo-500' 
                : 'bg-indigo-500 hover:bg-indigo-600'
            }`}
          >
            <Download size={18} />
            导出 MIDI
          </button>
        </div>
        
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setViewState(prev => ({ ...prev, scale: Math.min(5, prev.scale * 1.2) }))}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
              isDark 
                ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' 
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            放大
          </button>
          <button 
            onClick={() => setViewState(prev => ({ ...prev, scale: Math.max(0.5, prev.scale / 1.2) }))}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
              isDark 
                ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' 
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            缩小
          </button>
          <button 
            onClick={() => {
              if (allNotes.length > 0 && containerRef.current) {
                const containerHeight = containerRef.current.clientHeight - HEADER_HEIGHT;
                const notesHeight = (defaultViewMidi.max - defaultViewMidi.min + 1) * NOTE_HEIGHT;
                const defaultOffsetY = Math.max(0, (maxMidi - defaultViewMidi.max) * NOTE_HEIGHT - (containerHeight - notesHeight) / 2);
                setViewState(prev => ({ ...prev, scale: 1, offsetX: 0, offsetY: defaultOffsetY }));
              } else {
                setViewState(prev => ({ ...prev, scale: 1, offsetX: 0, offsetY: 0 }));
              }
            }}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
              isDark 
                ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' 
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            重置
          </button>
          <button 
            onClick={() => setAutoScroll(!autoScroll)}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
              autoScroll 
                ? 'bg-blue-500 text-white' 
                : isDark 
                  ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' 
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {autoScroll ? '🔄 自动滚动' : '⏸ 手动滚动'}
          </button>
        </div>
        
        <div className="flex items-center gap-6">
          <label className={`flex items-center gap-3 font-bold ${
            isDark ? 'text-slate-300' : 'text-slate-600'
          }`}>
            <span className="text-sm">速度 BPM:</span>
            <span className="font-fredoka text-blue-500">{localBpm}</span>
            <input 
              type="range" 
              min="60" 
              max="180" 
              value={localBpm} 
              onChange={(e) => setLocalBpm(Number(e.target.value))}
              className={`w-32 ${isDark ? 'accent-blue-400' : 'accent-blue-500'}`}
            />
          </label>
          
          <div className={`text-xs font-bold ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
            时长: {formatTime(duration)} | 音符: {detectedNotes.length} | 小节: {barsCount}
          </div>
        </div>
      </div>

      <div 
        className={`relative h-[500px] overflow-hidden rounded-[2rem] border ${
          isDark ? 'bg-slate-900/40 border-white/5' : 'bg-white border-blue-50'
        }`}
        ref={containerRef}
      >
        <canvas
          ref={canvasRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseLeave}
          onWheel={handleWheel}
          style={{ cursor: viewState.isDragging ? 'grabbing' : 'grab' }}
        />
        
        {hoveredNote && (
          <div 
            className={`absolute pointer-events-none z-50 p-3 rounded-xl text-xs ${
              isDark 
                ? 'bg-slate-800 text-white border border-white/10' 
                : 'bg-white text-slate-800 border border-slate-200 shadow-lg'
            }`}
            style={{
              left: `${mousePos.x + 15}px`,
              top: `${mousePos.y + 15}px`
            }}
          >
            <div className="font-bold text-sm mb-1">{hoveredNote.note.full}</div>
            <div>开始: {formatTime(hoveredNote.startTime)}</div>
            <div>时长: {hoveredNote.duration.toFixed(3)}s</div>
            <div>力度: {hoveredNote.velocity}</div>
            <div>置信度: {(hoveredNote.confidence * 100).toFixed(1)}%</div>
          </div>
        )}
      </div>
      
      <div className={`flex items-center justify-center gap-6 text-xs ${
        isDark ? 'text-slate-500' : 'text-slate-400'
      }`}>
        <span>滚轮滚动 | Ctrl+滚轮缩放 | 拖拽平移</span>
      </div>
    </div>
  );
};

export default TranscriptionPianoRoll;
