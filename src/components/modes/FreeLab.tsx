
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { flushSync } from 'react-dom';
import { GRID_COLS, TIMELINE_SECTIONS, RAINBOW_COLORS } from '../../constants';
import { Play, Pause, Trash2, Library, Music4, Mic, BookOpen, Drum, PenTool, Waves, Zap, TrainFront } from 'lucide-react';
import { AppStage, Note } from '../../types';
import { audioService } from '../../services/audioService';
import { Music, Activity, Grid, Volume2, Clock, Radio } from 'lucide-react';
import { ALL_NOTES, CHORDS, SOLFEGE_MAP, NUMBERED_NOTATION_MAP } from '../../constants';
import Piano from '../music/Piano';
import MusicStaff from '../music/MusicStaff';
import PianoRoll from '../music/PianoRoll';
import DrumSequencer from '../music/DrumSequencer';

type InstrumentType = 'sine' | 'square' | 'triangle' | 'recorded';
type SubModule = 'BASIC' | 'THEORY' | 'HARMONY' | 'RHYTHM' | 'COMPOSE';

const NOTE_NAMES = ['C6', 'B5', 'A5', 'G5', 'F5', 'E5', 'D5', 'C5', 'B4', 'A4', 'G4', 'F4', 'E4', 'D4', 'C4'];

const DRUM_KIT = [
  { name: '底鼓 (Kick)', icon: '🥁', color: 'bg-rose-500', size: 'w-8 h-8' },
  { name: '擦片 (Hi-hat)', icon: '✨', color: 'bg-yellow-400', size: 'w-4 h-4' },
];

const createSynth = () => {
  const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  return {
    ctx: audioCtx,
    playNote: (freq: number, type: InstrumentType = 'sine', recordedBuffer?: AudioBuffer) => {
      // 核心修复：确保 Context 处于运行状态
      if (audioCtx.state === 'suspended') audioCtx.resume();

      if (type === 'recorded' && recordedBuffer) {
        const source = audioCtx.createBufferSource();
        source.buffer = recordedBuffer;
        const gain = audioCtx.createGain();
        gain.gain.setValueAtTime(0.5, audioCtx.currentTime);
        source.connect(gain);
        gain.connect(audioCtx.destination);
        source.start();
        return;
      }
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = (type === 'recorded' ? 'sine' : type) as OscillatorType;
      osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
      gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.5);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.5);
    },
  };
};

interface FreeLabProps {
  theme?: 'light' | 'dark';
}

const FreeLab: React.FC<FreeLabProps> = ({ theme = 'dark' }) => {
  const [activeModule, setActiveModule] = useState<SubModule>('BASIC');
  const [bpm, setBpm] = useState(120);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [grid, setGrid] = useState<boolean[][]>(Array(NOTE_NAMES.length).fill(null).map(() => Array(GRID_COLS).fill(false)));
  const [drumGrid, setDrumGrid] = useState<boolean[][]>(Array(DRUM_KIT.length).fill(null).map(() => Array(GRID_COLS).fill(false)));
  
  const synthRef = useRef<any>(null);
  const timerRef = useRef<number | null>(null);

  const [activeNotes, setActiveNotes] = useState<Note[]>([]);
  const [lastPlayedNote, setLastPlayedNote] = useState<Note | null>(null);

  useEffect(() => {
    synthRef.current = createSynth();
    // 预加载钢琴音色，避免第一次按键延迟
    audioService.resume();
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  const playStep = useCallback((step: number) => {
    const baseFreq = 261.63;
    grid.forEach((row, i) => {
      if (row[step]) {
        const freq = baseFreq * Math.pow(2, (NOTE_NAMES.length - 1 - i) / 12);
        synthRef.current?.playNote(freq);
      }
    });
    // Drum play logic can be added here
    drumGrid.forEach((row, i) => {
      if (row[step]) {
        // Simple drum placeholder
        synthRef.current?.playNote(i === 0 ? 60 : 1000, 'square');
      }
    });
  }, [grid, drumGrid]);

  useEffect(() => {
    if (isPlaying) {
      const interval = (60 / bpm) * 1000 / 4; 
      timerRef.current = window.setInterval(() => {
        setCurrentStep((prev) => {
          const next = (prev + 1) % GRID_COLS;
          playStep(next);
          return next;
        });
      }, interval);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isPlaying, bpm, playStep]);

  const toggleCell = (r: number, c: number, type: 'melody' | 'drum') => {
    // 交互时尝试启动音频
    if (synthRef.current?.ctx.state === 'suspended') synthRef.current.ctx.resume();
    
    if (type === 'melody') {
      const newGrid = [...grid];
      newGrid[r] = [...newGrid[r]];
      newGrid[r][c] = !newGrid[r][c];
      setGrid(newGrid);
      if (newGrid[r][c]) {
         const baseFreq = 261.63;
         const freq = baseFreq * Math.pow(2, (NOTE_NAMES.length - 1 - r) / 12);
         synthRef.current?.playNote(freq);
      }
    } else {
      const newGrid = [...drumGrid];
      newGrid[r] = [...newGrid[r]];
      newGrid[r][c] = !newGrid[r][c];
      setDrumGrid(newGrid);
      if (newGrid[r][c]) {
        synthRef.current?.playNote(r === 0 ? 60 : 1000, 'square');
      }
    }
  };

  const toggleNote = useCallback((note: Note) => {
    // Check if note is already active
    const isActive = activeNotes.some(n => n.full === note.full);
    
    if (isActive) {
        // Toggle OFF - 使用 flushSync 强制同步更新
        flushSync(() => {
            setActiveNotes(prev => prev.filter(n => n.full !== note.full));
        });
    } else {
        // Toggle ON - 使用 flushSync 强制同步更新，立即显示高亮
        flushSync(() => {
            setActiveNotes(prev => [...prev, note]);
            setLastPlayedNote(note);
        });
        
        // 异步播放声音（不阻塞 UI）
        audioService.playPianoNote(note, 0.5, 0.8);
    }
  }, [activeNotes]);

  const clearActiveNotes = () => {
    setActiveNotes([]);
  };

  const renderJianpuWithDots = (note: Note) => {
    const base = NUMBERED_NOTATION_MAP[note.name];
    if (!base) return '-';
    
    // Logic: 
    // Octave 4 = No dots (1)
    // Octave 5 = 1 dot above
    // Octave 6 = 2 dots above
    // Octave 3 = 1 dot below
    
    return (
        <div className="flex flex-col items-center leading-none">
            {note.octave >= 5 && <span className="text-[10px] mb-[-2px]">{note.octave === 6 ? '••' : '•'}</span>}
            <span className="font-serif">{base}</span>
            {note.octave <= 3 && <span className="text-[10px] mt-[-4px]">•</span>}
        </div>
    );
  };

  const playChord = useCallback((rootNote: Note, intervals: number[]) => {
    const notesToPlay: Note[] = [];
    const rootIndex = ALL_NOTES.findIndex(n => n.full === rootNote.full);
    
    if (rootIndex === -1) return;

    intervals.forEach(interval => {
        if (ALL_NOTES[rootIndex + interval]) {
            notesToPlay.push(ALL_NOTES[rootIndex + interval]);
        }
    });

    // 使用 flushSync 强制同步更新
    flushSync(() => {
        setActiveNotes(notesToPlay);
        setLastPlayedNote(rootNote);
    });
    
    // 异步播放声音
    audioService.playPianoChord(notesToPlay, 1.0, 0.7);
  }, []);

  // 
  const Header = ({ title, desc }: { title: string, desc: string }) => (
    <div className="p-1">
        <h2 className={`text-3xl m-0.5 p-2 font-bold ${isDark ? 'bg-[#000b1a] text-slate-200' : 'bg-[#f8fafc] text-slate-900'}`}>{title}</h2>
        {/* <p className={`text-slate-400 ${isDark ? 'bg-[#000b1a] text-slate-200' : 'bg-[#f8fafc] text-slate-900'}`}>{desc}</p> */}
    </div>
  );

  const Card = ({ title, icon, children }: { title: string, icon: React.ReactNode, children?: React.ReactNode }) => (
      <div className={`p-5 rounded-2xl border shadow-sm transition-all duration-300
      ${isDark
        ? 'bg-slate-800 border-slate-700'
        : 'bg-white border-slate-200'}
        `}>
          <div className={`flex items-center gap-3 mb-4 pb-4 border-b ${isDark ? 'border-slate-700/50' : 'border-slate-200/60'}`}>
              <div className={`p-2 rounded-lg ${isDark ? 'bg-slate-900' : 'bg-slate-100'}`}>{icon}</div>
              <h3 className={`font-bold text-lg ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>{title}</h3>
          </div>
          {children}
      </div>
  );

  // const Card = ({ title, icon, children}: { title: string, icon: React.ReactNode, children?: React.ReactNode, isDark: boolean }) => (
  //   <div className={`
  //     p-5 rounded-2xl border shadow-lg hover:shadow-xl transition-all duration-300
  //     ${isDark 
  //       ? 'bg-slate-800 border-slate-700 hover:shadow-slate-900/20' 
  //       : 'bg-white border-slate-200 hover:shadow-slate-400/30'}
  //   `}>
  //     <div className={`flex items-center gap-3 mb-4 pb-4 border-b ${isDark ? 'border-slate-700/50' : 'border-slate-200/60'}`}>
  //       <div className={`p-2 rounded-lg ${isDark ? 'bg-slate-900' : 'bg-slate-100'}`}>
  //         {icon}
  //       </div>
  //       <h3 className={`font-bold text-lg ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
  //         {title}
  //       </h3>
  //     </div>
  //     {children}
  //   </div>
  // );

  const renderContent = () => {
    switch (activeModule) {
      case 'BASIC':
        return (
            <div className="space-y-3 space-x-2 animate-fade-in max-w-full overflow-x-hidden">
                <Header title="基础感知——感受声音的高低、长短与强弱" desc="" />
                
                <div className="grid md:grid-cols-3 gap-6">
                    <Card title="音高 (Pitch)" icon={<Music className="text-pink-400" />}>
                         <div className="flex flex-col gap-4 items-center">
                            <p className={`text-slate-400 ${isDark ? 'text-slate-200' : 'text-slate-900'}`}>声音有高低之分，就像楼梯一样。</p>
                            <div className="flex gap-4">
                                <button onClick={async () => {
                                    const note = ALL_NOTES.find(n => n.full === 'C3');
                                    if (note) await audioService.playPianoNote(note, 0.5, 0.8);
                                }} 
                                        className={`px-4 py-2 rounded-lg transition ${
                                          isDark 
                                          ? 'bg-slate-700 hover:bg-slate-600 text-white' : 'bg-slate-200 hover:bg-slate-300 text-slate-800'}`}>低音</button>
                                <button onClick={async () => {
                                    const note = ALL_NOTES.find(n => n.full === 'C5');
                                    if (note) await audioService.playPianoNote(note, 0.5, 0.8);
                                }} 
                                className={`px-4 py-2 rounded-lg transition ${
                                  isDark 
                                   ? 'bg-indigo-600 hover:bg-indigo-500 text-white' 
                                    : 'bg-indigo-500 hover:bg-indigo-400 text-white'}`}>高音</button>
                            </div>
                         </div>
                    </Card>

                    <Card title="长短 (Duration)" icon={<Clock className="text-cyan-400" />}>
                         <div className="flex flex-col gap-4 items-center">
                            <p className={`text-slate-400 ${isDark ? 'text-slate-200' : 'text-slate-900'}`}>声音有长有短，组成了节奏。</p>
                            <div className="flex gap-4">
                                <button onClick={async () => {
                                    const note = ALL_NOTES.find(n => n.full === 'A4');
                                    if (note) await audioService.playPianoNote(note, 0.1, 0.8);
                                }} className={`px-4 py-2 rounded-lg transition ${isDark 
                                  ? 'bg-slate-700 hover:bg-slate-600 text-white' 
                                  : 'bg-slate-200 hover:bg-slate-300 text-slate-800'}`}>短</button>
                                <button onClick={async () => {
                                    const note = ALL_NOTES.find(n => n.full === 'A4');
                                    if (note) await audioService.playPianoNote(note, 1.5, 0.8);
                                }} className={`px-4 py-2 rounded-lg transition ${isDark 
                                  ? 'bg-pink-600 hover:bg-pink-500 text-white' 
                                  : 'bg-pink-400 hover:bg-pink-300 text-slate-800'}`}>长</button>
                            </div>
                         </div>
                    </Card>

                    <Card title="强弱 (Dynamics)" icon={<Volume2 className="text-emerald-400" />}>
                         <div className="flex flex-col gap-4 items-center">
                            <p className={`text-slate-400 ${isDark ? 'text-slate-200' : 'text-slate-900'}`}>声音的力量可以很强，也可以很温柔。</p>
                            <div className="flex gap-4">
                                <button onClick={async () => {
                                    const note = ALL_NOTES.find(n => n.full === 'A4');
                                    if (note) await audioService.playPianoNote(note, 0.5, 0.2);
                                }} 
                                  className={`px-4 py-2 rounded-lg transition ${isDark 
                                              ? 'bg-slate-700 hover:bg-slate-600 text-white' 
                                              : 'bg-slate-200 hover:bg-slate-300 text-slate-800'
                                  }`}>弱</button>
                                <button onClick={async () => {
                                    const note = ALL_NOTES.find(n => n.full === 'A4');
                                    if (note) await audioService.playPianoNote(note, 0.5, 1.0);
                                }} 
                                className={`px-4 py-2 rounded-lg transition ${isDark 
                                            ? 'bg-amber-500 hover:bg-amber-400 text-white' 
                                            : 'bg-amber-400 hover:bg-amber-300 text-slate-800'
                                  }`}>强</button>
                            </div>
                         </div>
                    </Card>
                </div>
                
                <div className={`p-6 rounded-2xl border shadow-sm ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
                  <div className="flex justify-between items-end mb-4">
                    <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>试一试</h3>
                      <div className="flex gap-4">
                        <p className={`text-xs self-center ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>C3 - C6</p>
                          <button onClick={clearActiveNotes} className={`text-xs underline hover:${isDark ? 'text-white' : 'text-slate-800'} ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                            清除高亮
                          </button>
                      </div>
                  </div>
                  
                  <Piano theme_type={isDark} activeNotes={activeNotes.map(n => n.full)} onNotePlay={toggleNote} />
                </div>
            </div>
        );
      case 'THEORY':
        return (
            <div className="space-y-3 space-x-2 animate-fade-in max-w-full overflow-x-hidden">
                 <Header title="乐理知识——认识五线谱、简谱与唱名" desc="" />
                 
                 <div className={`p-6 rounded-2xl border shadow-sm flex flex-col items-center gap-6 ${
  isDark 
    ? 'bg-slate-800 border-slate-700' 
    : 'bg-white border-slate-200'
}`}>
                    <MusicStaff theme_type={isDark} activeNotes={activeNotes} className="h-[400px] w-full" />
                    
                    <div className={`w-full grid grid-cols-2 md:grid-cols-4 gap-4 px-4 py-4 rounded-xl border ${
  isDark 
    ? 'bg-slate-900/50 border-slate-700' 
    : 'bg-slate-100/50 border-slate-200'
}`}>
  <div className="text-center p-2">
    <span className={`text-xs uppercase tracking-widest block mb-1 ${
      isDark ? 'text-slate-500' : 'text-slate-600'
    }`}>音名 (Name)</span>
    <div className={`text-2xl font-bold ${
      isDark ? 'text-indigo-400' : 'text-indigo-600'
    }`}>{lastPlayedNote ? lastPlayedNote.name : '-'}</div>
  </div>
  <div className="text-center p-2">
    <span className={`text-xs uppercase tracking-widest block mb-1 ${
      isDark ? 'text-slate-500' : 'text-slate-600'
    }`}>简谱 (Notation)</span>
    <div className={`text-2xl font-bold ${
      isDark ? 'text-emerald-400' : 'text-emerald-600'
    }`}>
      {lastPlayedNote ? renderJianpuWithDots(lastPlayedNote) : '-'}
    </div>
  </div>
  <div className="text-center p-2">
    <span className={`text-xs uppercase tracking-widest block mb-1 ${
      isDark ? 'text-slate-500' : 'text-slate-600'
    }`}>音高 (Pitch)</span>
    <div className={`text-xl font-mono ${
      isDark ? 'text-slate-300' : 'text-slate-700'
    }`}>{lastPlayedNote ? lastPlayedNote.full : '-'}</div>
  </div>
  <div className="text-center p-2">
    <span className={`text-xs uppercase tracking-widest block mb-1 ${
      isDark ? 'text-slate-500' : 'text-slate-600'
    }`}>唱名 (Solfege)</span>
    <div className={`text-2xl font-bold ${
      isDark ? 'text-pink-400' : 'text-pink-600'
    }`}>{lastPlayedNote ? SOLFEGE_MAP[lastPlayedNote.name] : '-'}</div>
  </div>
</div>
                    
                    <div className="w-full">
                        <div className="flex justify-end mb-2">
                             <button onClick={clearActiveNotes} className={
  isDark 
    ? "text-xs text-slate-400 hover:text-white px-2 py-1 rounded bg-slate-700" // 黑夜模式
    : "text-xs text-slate-500 hover:text-slate-800 px-2 py-1 rounded bg-slate-200" // 白天模式
}>清除</button>
                        </div>
                        <Piano theme_type={isDark} activeNotes={activeNotes.map(n => n.full)} onNotePlay={toggleNote} />
                    </div>
                 </div>
            </div>
        );
      case 'HARMONY':
        return (
            <div className="space-y-3 space-x-2 animate-fade-in max-w-full overflow-x-hidden">
                <Header title="和弦与音阶——探索声音的组合魔法" desc="" />

                <div className={`p-6 rounded-2xl border shadow-sm flex flex-col items-center gap-6 ${
  isDark 
    ? 'bg-slate-800 border-slate-700' 
    : 'bg-white border-slate-200'
}`}>
                     <MusicStaff theme_type={isDark} activeNotes={activeNotes} className="h-[400px] w-full" />
                     
                     <div className="mb-6">
                        <div className="flex justify-between items-center mb-3">
                            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">选择和弦</h3>
                            <button onClick={clearActiveNotes} className={
  isDark 
    ? "text-xs text-slate-400 hover:text-white px-2 py-1 rounded bg-slate-700" // 黑夜模式
    : "text-xs text-slate-500 hover:text-slate-800 px-2 py-1 rounded bg-slate-200" // 白天模式
}>清除</button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                             {CHORDS.map((chord, idx) => (
                                 <div key={idx} className={`flex flex-col gap-2 p-3 rounded-lg ${
  isDark 
    ? "bg-slate-750 border-slate-700"    // 黑夜模式
    : "bg-slate-100 border-slate-300"    // 白天模式
}`}>
                                    <div className="text-xs text-slate-500 font-bold">{chord.name}</div>
                                    <div className="flex gap-1 flex-wrap">
                                        {['C', 'D', 'E', 'F', 'G', 'A', 'B'].map(root => (
                                            <button 
                                                key={root}
                                                onClick={() => {
                                                    const rootNote = ALL_NOTES.find(n => n.name === root && n.octave === 4);
                                                    if(rootNote) playChord(rootNote, chord.intervals);
                                                }}
                                                className={`w-8 h-8 flex items-center justify-center text-sm rounded transition-colors ${
  isDark 
    ? "bg-slate-700 hover:bg-indigo-600 border-slate-600 hover:border-indigo-500" // 黑夜模式
    : "bg-slate-200 hover:bg-indigo-500 border-slate-300 hover:border-indigo-400"  // 白天模式
}`}
                                            >
                                                {root}
                                            </button>
                                        ))}
                                    </div>
                                 </div>
                             ))}
                        </div>
                     </div>

                     <Piano theme_type={isDark} activeNotes={activeNotes.map(n => n.full)} onNotePlay={toggleNote} />
                </div>
            </div>
        );
      case 'RHYTHM':
          return (
              <div className="space-y-3 space-x-2 animate-fade-in max-w-full overflow-x-hidden">
  <Header title="节奏创作——使用专业鼓机制作动感的节拍" desc="" />
  <DrumSequencer theme_type={isDark}/>
  <div className={`p-5 rounded-xl border mt-6 ${
    isDark 
      ? "bg-slate-800 border-slate-700"  // 黑夜模式
      : "bg-slate-100 border-slate-300"  // 白天模式
  }`}>
    <h4 className={`text-lg font-bold mb-2 ${
      isDark ? "text-indigo-300" : "text-indigo-600"  // 黑夜：indigo-300，白天：indigo-600
    }`}>
      乐器说明
    </h4>
    <p className={`text-sm ${
      isDark ? "text-slate-400" : "text-slate-600"  // 黑夜：slate-400，白天：slate-600
    }`}>
      点击方块即可点亮节奏，按下播放键开始演奏。
    </p>
  </div>
</div>
          );
      case 'COMPOSE':
        return (
             <div className="space-y-3 space-x-2 animate-fade-in max-w-full overflow-x-hidden">
                <Header title="旋律创作" desc="在钢琴卷帘上编写你的乐章" />
                <PianoRoll theme_type={isDark} onPlay={(notes) => {
                    audioService.playPianoChord(notes, 0.2, 0.7);
                }} />
             </div>
        );
    }
  }

  const isDark = theme === 'dark';

  return (
    <div className={`flex h-full overflow-hidden font-sans transition-colors duration-500 ${isDark ? 'bg-[#000b1a] text-slate-200' : 'bg-[#f8fafc] text-slate-900'}`}>
      <aside className={`w-24 border-r flex flex-col items-center py-10 gap-10 z-20 backdrop-blur-xl transition-colors duration-500 ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-blue-100'}`}>
        <div className="w-14 h-14 bg-gradient-to-br from-blue-400 to-blue-600 rounded-2xl flex items-center justify-center mb-4 border border-white/20">
           <Music4 className="text-white" size={28} />
        </div>
        <div className="flex flex-col gap-5 w-full px-3">
          {[
            { id: 'BASIC', label: '基础', icon: Library },
            { id: 'THEORY', label: '乐理', icon: BookOpen },
            { id: 'HARMONY', label: '和弦', icon: Radio },
            { id: 'RHYTHM', label: '节奏', icon: Drum },
            { id: 'COMPOSE', label: '创作', icon: PenTool },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveModule(item.id as SubModule)}
              className={`flex flex-col items-center gap-2 py-4 rounded-2xl transition-all duration-300 ${activeModule === item.id ? 'bg-blue-600 text-white border border-blue-400/50' : isDark ? 'text-slate-500 hover:text-blue-300 hover:bg-white/5' : 'text-slate-400 hover:text-blue-600 hover:bg-blue-50'}`}
            >
              <item.icon size={22} />
              <span className="text-[10px] font-black tracking-tight">{item.label}</span>
            </button>
          ))}
        </div>
      </aside>

      <section className="flex-1 flex flex-col min-w-0 px-6 ">  
        {renderContent()}
      </section>
    </div>
  );
};

export default FreeLab;
