import React, { useState, useEffect, useRef, useCallback } from 'react';
import { flushSync } from 'react-dom';
import { Library, Music4, BookOpen, Drum, PenTool, Radio } from 'lucide-react';
import { Note } from '../../types';
import { audioService } from '../../services/audioService';
import { Music, Volume2, Clock } from 'lucide-react';
import { ALL_NOTES, CHORDS, SOLFEGE_MAP, NUMBERED_NOTATION_MAP } from '../../constants';
import Piano from '../music/Piano';
import MusicStaff from '../music/MusicStaff';
import PianoRoll from '../music/PianoRoll';
import DrumSequencer from '../music/DrumSequencer';
import { PALETTE } from '../../constants/palette';

type InstrumentType = 'sine' | 'square' | 'triangle' | 'recorded';
type SubModule = 'BASIC' | 'THEORY' | 'HARMONY' | 'RHYTHM' | 'COMPOSE';

const createSynth = () => {
  const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  return {
    ctx: audioCtx,
    playNote: (freq: number, type: InstrumentType = 'sine', recordedBuffer?: AudioBuffer) => {
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

const FreeLab: React.FC<FreeLabProps> = () => {
  const [activeModule, setActiveModule] = useState<SubModule>('BASIC');
  const [activeNotes, setActiveNotes] = useState<Note[]>([]);
  const [lastPlayedNote, setLastPlayedNote] = useState<Note | null>(null);
  const synthRef = useRef<any>(null);

  useEffect(() => {
    synthRef.current = createSynth();
    audioService.resume();
  }, []);

  const toggleNote = useCallback((note: Note) => {
    const isActive = activeNotes.some(n => n.full === note.full);
    if (isActive) {
      flushSync(() => setActiveNotes(prev => prev.filter(n => n.full !== note.full)));
    } else {
      flushSync(() => {
        setActiveNotes(prev => [...prev, note]);
        setLastPlayedNote(note);
      });
      audioService.playPianoNote(note, 0.5, 0.8);
    }
  }, [activeNotes]);

  const clearActiveNotes = () => setActiveNotes([]);

  const playChord = useCallback((rootNote: Note, intervals: number[]) => {
    const rootIndex = ALL_NOTES.findIndex(n => n.full === rootNote.full);
    if (rootIndex === -1) return;
    const notesToPlay = intervals
      .map(i => ALL_NOTES[rootIndex + i])
      .filter(Boolean);
    flushSync(() => {
      setActiveNotes(notesToPlay);
      setLastPlayedNote(rootNote);
    });
    audioService.playPianoChord(notesToPlay, 1.0, 0.7);
  }, []);

  const renderJianpuWithDots = (note: Note) => {
    const base = NUMBERED_NOTATION_MAP[note.name];
    if (!base) return '-';
    return (
      <div className="flex flex-col items-center leading-none">
        {note.octave >= 5 && <span className="text-[10px] mb-[-2px]">{note.octave === 6 ? '••' : '•'}</span>}
        <span className="font-serif">{base}</span>
        {note.octave <= 3 && <span className="text-[10px] mt-[-4px]">•</span>}
      </div>
    );
  };

  // ── Shared sub-components ──────────────────────────────────────────────────

  const SectionHeader = ({ title }: { title: string }) => (
    <div className="mb-4">
      <h2 className="text-xl font-bold tracking-tight text-slate-800">{title}</h2>
    </div>
  );

  const Card = ({ title, icon, children }: { title: string; icon: React.ReactNode; children?: React.ReactNode }) => (
    <div className="bg-white rounded-2xl p-4 shadow-[0_2px_8px_rgba(0,0,0,0.03)]">
      <div className="flex items-center gap-3 mb-3 pb-3" style={{ borderBottom: '1px solid #F1F5F9' }}>
        <div className="p-2 rounded-xl" style={{ background: PALETTE.blue.bg }}>
          {icon}
        </div>
        <h3 className="font-bold text-slate-800">{title}</h3>
      </div>
      {children}
    </div>
  );

  const ClearBtn = () => (
    <button
      onClick={clearActiveNotes}
      className="text-xs font-semibold text-slate-400 hover:text-slate-600 bg-slate-100 hover:bg-slate-200 px-3 py-1 rounded-full transition-all"
    >
      清除高亮
    </button>
  );

  // ── Module content ─────────────────────────────────────────────────────────

  const renderContent = () => {
    switch (activeModule) {
      case 'BASIC':
        return (
          <div className="space-y-4 animate-fade-in">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Card title="音高 (Pitch)" icon={<Music size={16} style={{ color: PALETTE.pink.accent }} />}>
                <div className="flex flex-col gap-4 items-center">
                  <p className="text-sm text-slate-500 text-center">声音有高低之分，就像楼梯一样。</p>
                  <div className="flex gap-3">
                    <button
                      onClick={async () => {
                        const note = ALL_NOTES.find(n => n.full === 'C3');
                        if (note) await audioService.playPianoNote(note, 0.5, 0.8);
                      }}
                      className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 text-slate-600 hover:bg-slate-200 transition-all hover:scale-[1.02] active:scale-95"
                    >
                      低音
                    </button>
                    <button
                      onClick={async () => {
                        const note = ALL_NOTES.find(n => n.full === 'C5');
                        if (note) await audioService.playPianoNote(note, 0.5, 0.8);
                      }}
                      className="px-4 py-2 rounded-xl text-xs font-semibold text-white transition-all hover:opacity-90 active:scale-95"
                      style={{ background: PALETTE.blue.accent }}
                    >
                      高音
                    </button>
                  </div>
                </div>
              </Card>

              <Card title="长短 (Duration)" icon={<Clock size={16} style={{ color: PALETTE.blue.accent }} />}>
                <div className="flex flex-col gap-4 items-center">
                  <p className="text-sm text-slate-500 text-center">声音有长有短，组成了节奏。</p>
                  <div className="flex gap-3">
                    <button
                      onClick={async () => {
                        const note = ALL_NOTES.find(n => n.full === 'A4');
                        if (note) await audioService.playPianoNote(note, 0.1, 0.8);
                      }}
                      className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 text-slate-600 hover:bg-slate-200 transition-all hover:scale-[1.02] active:scale-95"
                    >
                      短
                    </button>
                    <button
                      onClick={async () => {
                        const note = ALL_NOTES.find(n => n.full === 'A4');
                        if (note) await audioService.playPianoNote(note, 1.5, 0.8);
                      }}
                      className="px-4 py-2 rounded-xl text-xs font-semibold text-white transition-all hover:opacity-90 active:scale-95"
                      style={{ background: PALETTE.pink.accent }}
                    >
                      长
                    </button>
                  </div>
                </div>
              </Card>

              <Card title="强弱 (Dynamics)" icon={<Volume2 size={16} style={{ color: PALETTE.green.accent }} />}>
                <div className="flex flex-col gap-4 items-center">
                  <p className="text-sm text-slate-500 text-center">声音的力量可以很强，也可以很温柔。</p>
                  <div className="flex gap-3">
                    <button
                      onClick={async () => {
                        const note = ALL_NOTES.find(n => n.full === 'A4');
                        if (note) await audioService.playPianoNote(note, 0.5, 0.2);
                      }}
                      className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 text-slate-600 hover:bg-slate-200 transition-all hover:scale-[1.02] active:scale-95"
                    >
                      弱
                    </button>
                    <button
                      onClick={async () => {
                        const note = ALL_NOTES.find(n => n.full === 'A4');
                        if (note) await audioService.playPianoNote(note, 0.5, 1.0);
                      }}
                      className="px-4 py-2 rounded-xl text-xs font-semibold text-white transition-all hover:opacity-90 active:scale-95"
                      style={{ background: PALETTE.orange.accent }}
                    >
                      强
                    </button>
                  </div>
                </div>
              </Card>
            </div>

            <div className="bg-white rounded-2xl p-4 shadow-[0_2px_8px_rgba(0,0,0,0.03)]">
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-bold text-slate-800">试一试</h3>
                <ClearBtn />
              </div>
              <Piano {...{ theme_type: false } as any} activeNotes={activeNotes.map(n => n.full)} onNotePlay={toggleNote} />
            </div>
          </div>
        );

      case 'THEORY':
        return (
          <div className="space-y-4 animate-fade-in">
            <div className="bg-white rounded-2xl p-4 shadow-[0_2px_8px_rgba(0,0,0,0.03)] flex flex-col items-center gap-3">
              <MusicStaff {...{ theme_type: false } as any} activeNotes={activeNotes} className="h-[200px] w-full" />

              <div className="w-full grid grid-cols-2 sm:grid-cols-4 gap-3 px-4 py-3 rounded-xl bg-[#F8FAFC]">
                {[
                  { label: '音名 (Name)', value: lastPlayedNote?.name ?? '-', color: PALETTE.blue.accent },
                  { label: '简谱 (Notation)', value: lastPlayedNote ? renderJianpuWithDots(lastPlayedNote) : '-', color: PALETTE.green.accent },
                  { label: '音高 (Pitch)', value: lastPlayedNote?.full ?? '-', color: PALETTE.orange.accent },
                  { label: '唱名 (Solfege)', value: lastPlayedNote ? SOLFEGE_MAP[lastPlayedNote.name] : '-', color: PALETTE.pink.accent },
                ].map(({ label, value, color }) => (
                  <div key={label} className="text-center p-2">
                    <span className="text-[10px] font-semibold uppercase tracking-widest block mb-1 text-slate-400">{label}</span>
                    <div className="text-2xl font-bold" style={{ color }}>{value}</div>
                  </div>
                ))}
              </div>

              <div className="w-full">
                <div className="flex justify-end mb-2">
                  <ClearBtn />
                </div>
                <Piano {...{ theme_type: false } as any} activeNotes={activeNotes.map(n => n.full)} onNotePlay={toggleNote} />
              </div>
            </div>
          </div>
        );

      case 'HARMONY':
        return (
          <div className="space-y-3 animate-fade-in">
            {/* Staff + Chord selector: side by side on desktop, stacked on mobile */}
            <div className="bg-white rounded-2xl p-3 sm:p-4 shadow-[0_2px_8px_rgba(0,0,0,0.03)]">
              <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-3 lg:gap-4 items-center">
                {/* Left: Staff */}
                <div className="min-w-0">
                  <MusicStaff {...{ theme_type: false } as any} activeNotes={activeNotes} className="h-[160px] sm:h-[200px] lg:h-[220px] w-full" />
                </div>
                {/* Right: Chord selector */}
                <div className="flex flex-col gap-1.5 sm:gap-2 lg:w-[440px]">
                  <div className="flex justify-between items-center mb-0.5 sm:mb-1">
                    <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">选择和弦</span>
                    <ClearBtn />
                  </div>
                  {CHORDS.map((chord, idx) => (
                    <div key={idx} className="flex items-center gap-2 sm:gap-3 px-2 sm:px-3 py-2 sm:py-2.5 rounded-xl bg-[#F8FAFC]">
                      <span className="text-[9px] sm:text-[10px] font-semibold uppercase tracking-widest text-slate-400 flex-shrink-0 leading-tight truncate max-w-[72px] sm:max-w-none sm:w-32">{chord.name}</span>
                      <div className="flex gap-[3px] sm:gap-1.5 flex-nowrap">
                        {['C', 'D', 'E', 'F', 'G', 'A', 'B'].map(root => (
                          <button
                            key={root}
                            onClick={() => {
                              const rootNote = ALL_NOTES.find(n => n.name === root && n.octave === 4);
                              if (rootNote) playChord(rootNote, chord.intervals);
                            }}
                            className="w-[30px] h-[30px] sm:w-8 sm:h-8 flex items-center justify-center text-[11px] sm:text-xs font-semibold rounded-lg bg-white text-slate-600 hover:text-white transition-all active:scale-95 shadow-[0_1px_3px_rgba(0,0,0,0.04)]"
                            onMouseEnter={e => (e.currentTarget.style.background = PALETTE.blue.accent)}
                            onMouseLeave={e => (e.currentTarget.style.background = '')}
                          >
                            {root}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            {/* Piano full width */}
            <div className="bg-white rounded-2xl px-4 pt-3 pb-1 shadow-[0_2px_8px_rgba(0,0,0,0.03)]">
              <Piano {...{ theme_type: false } as any} activeNotes={activeNotes.map(n => n.full)} onNotePlay={toggleNote} />
            </div>
          </div>
        );

      case 'RHYTHM':
        return (
          <div className="space-y-4 animate-fade-in">
            <DrumSequencer {...{ theme_type: false } as any} />
            <div className="bg-white rounded-xl p-4 shadow-[0_2px_8px_rgba(0,0,0,0.03)]">
              <h4 className="text-sm font-bold text-slate-800 mb-1">乐器说明</h4>
              <p className="text-sm text-slate-500">点击方块即可点亮节奏，按下播放键开始演奏。</p>
            </div>
          </div>
        );

      case 'COMPOSE':
        return (
          <div className="space-y-6 animate-fade-in">
            <PianoRoll {...{ theme_type: false } as any} onPlay={(notes) => {
              audioService.playPianoChord(notes, 0.2, 0.7);
            }} />
          </div>
        );
    }
  };

  // ── Nav items ──────────────────────────────────────────────────────────────

  const NAV_ITEMS = [
    { id: 'BASIC',   label: '基础感知', icon: Library },
    { id: 'THEORY',  label: '乐理知识', icon: BookOpen },
    { id: 'HARMONY', label: '和弦音阶', icon: Radio },
    { id: 'RHYTHM',  label: '节奏创作', icon: Drum },
    { id: 'COMPOSE', label: '旋律创作', icon: PenTool },
  ] as const;

  const MODULE_SUBTITLES: Record<SubModule, string> = {
    BASIC:   '感受声音的高低、长短与强弱',
    THEORY:  '认识五线谱、简谱与唱名',
    HARMONY: '探索声音的组合魔法',
    RHYTHM:  '使用专业鼓机制作动感节拍',
    COMPOSE: '在钢琴卷帘上编写你的乐章',
  };

  return (
    <div className="bg-[#F5F7FA]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-20 md:pb-10">

        {/* ── Hero ── */}
        <div className="pt-6 sm:pt-8 pb-4">
          <p className="text-[10px] font-semibold uppercase tracking-widest mb-2" style={{ color: PALETTE.blue.accent }}>
            Free Lab · 自由工坊
          </p>
          <div className="flex items-end justify-between gap-4 sm:gap-6">
            <div>
              <h1 className="text-3xl sm:text-5xl font-black leading-[1.1] tracking-tight text-slate-800 mb-2">
                探索<span style={{ color: PALETTE.blue.accent }}>音乐的奥秘</span>
              </h1>
              <p className="text-sm font-medium text-slate-400 max-w-sm leading-relaxed">
                {MODULE_SUBTITLES[activeModule]}
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 mb-1" style={{ background: PALETTE.blue.bg }}>
              <Music4 size={20} style={{ color: PALETTE.blue.accent }} />
            </div>
          </div>
        </div>

        {/* ── Filter tabs ── */}
        <div className="flex items-center gap-2 py-3 overflow-x-auto scrollbar-hide">
          {NAV_ITEMS.map(({ id, label, icon: Icon }) => {
            const active = activeModule === id;
            return (
              <button
                key={id}
                onClick={() => setActiveModule(id as SubModule)}
                className="flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold transition-all whitespace-nowrap flex-shrink-0"
                style={active
                  ? { background: '#1e293b', color: '#fff' }
                  : { background: 'white', color: '#94A3B8' }
                }
              >
                <Icon size={13} />
                {label}
              </button>
            );
          })}
        </div>

        {/* ── Content ── */}
        {renderContent()}

      </div>
    </div>
  );
};

export default FreeLab;
