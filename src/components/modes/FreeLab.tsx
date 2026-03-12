import React, { useState, useEffect, useRef, useCallback } from 'react';
import { flushSync } from 'react-dom';
import { Library, Music4, BookOpen, Drum, PenTool, Radio, Flower2 } from 'lucide-react';
import { Note, NoteName, ChordType } from '../../types';
import { audioService } from '../../services/audioService';
import { Music, Volume2, Clock } from 'lucide-react';
import { ALL_NOTES, CHORDS, SOLFEGE_MAP, NUMBERED_NOTATION_MAP } from '../../constants';
import Piano from '../music/Piano';
import MusicStaff from '../music/MusicStaff';
import PianoRoll from '../music/PianoRoll';
import DrumSequencer from '../music/DrumSequencer';
import { PALETTE } from '../../constants/palette';
import { useSettings } from '../../contexts/SettingsContext';
import PageDecoration from '../ui/PageDecoration';
import ChineseInstruments from './ChineseInstruments';

type InstrumentType = 'sine' | 'square' | 'triangle' | 'recorded';
type SubModule = 'BASIC' | 'THEORY' | 'HARMONY' | 'RHYTHM' | 'COMPOSE' | 'CHINESE_INST';
const HARMONY_ROOTS: NoteName[] = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];

const formatPopChordName = (root: NoteName, chord: ChordType) => `${root}${chord.symbol}`;

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
        source.connect(gain)
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

const MAX_SEQUENCE_NOTES = 8;
type StaffDisplayMode = 'sequence' | 'chord';

interface FreeLabProps {
  theme?: 'light' | 'dark';
}

const FreeLab: React.FC<FreeLabProps> = () => {
  const { t } = useSettings();
  const [activeModule, setActiveModule] = useState<SubModule>('BASIC');
  const [activeNotes, setActiveNotes] = useState<Note[]>([]);
  const [staffDisplayMode, setStaffDisplayMode] = useState<StaffDisplayMode>('sequence');
  const [lastPlayedNote, setLastPlayedNote] = useState<Note | null>(null);
  const [selectedChordName, setSelectedChordName] = useState<string | null>(null);
  const synthRef = useRef<any>(null);

  useEffect(() => {
    synthRef.current = createSynth();
    audioService.resume();
  }, []);

  const toggleNote = useCallback((note: Note) => {
    flushSync(() => {
      setStaffDisplayMode('sequence');
      setSelectedChordName(null);
      setActiveNotes(prev => {
        const nextNotes = staffDisplayMode === 'chord' ? [note] : [...prev, note];
        return nextNotes.slice(-MAX_SEQUENCE_NOTES);
      });
      setLastPlayedNote(note);
    });
    audioService.playPianoNote(note, 0.5, 0.8);
  }, [staffDisplayMode]);

  const clearActiveNotes = () => {
    setActiveNotes([]);
    setStaffDisplayMode('sequence');
    setSelectedChordName(null);
  };

  const playChord = useCallback((rootNote: Note, chord: ChordType) => {
    const rootIndex = ALL_NOTES.findIndex(n => n.full === rootNote.full);
    if (rootIndex === -1) return;
    const notesToPlay = chord.intervals
      .map(i => ALL_NOTES[rootIndex + i])
      .filter(Boolean);
    flushSync(() => {
      setStaffDisplayMode('chord');
      setActiveNotes(notesToPlay);
      setLastPlayedNote(rootNote);
      setSelectedChordName(formatPopChordName(rootNote.name, chord));
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
    <div className="bg-white rounded-2xl p-3.5 sm:p-4 shadow-[0_1px_4px_rgba(0,0,0,0.02)]">
      <div className="flex items-center gap-2.5 mb-2.5 pb-2.5 sm:gap-3 sm:mb-3 sm:pb-3">
        <div className="p-1.5 sm:p-2 rounded-xl" style={{ background: PALETTE.blue.bg }}>
          {icon}
        </div>
        <h3 className="font-bold text-sm sm:text-base text-slate-800">{title}</h3>
      </div>
      {children}
    </div>
  );

  const ClearBtn = () => (
    <button
      onClick={clearActiveNotes}
      className="text-[11px] sm:text-xs font-semibold text-slate-400 hover:text-slate-600 bg-slate-100 hover:bg-slate-200 px-2.5 sm:px-3 py-1 rounded-full transition-all"
    >
      {t('lab.clearHighlight')}
    </button>
  );

  // ── Module content ─────────────────────────────────────────────────────────

  const renderContent = () => {
    switch (activeModule) {
      case 'BASIC':
        return (
          <div className="space-y-4 animate-fade-in">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
              <Card title={t('lab.pitch')} icon={<Music size={16} style={{ color: PALETTE.blue.accent }} />}>
                <div className="flex flex-col gap-3 sm:gap-4 items-center">
                  <p className="text-sm text-slate-500 text-center">{t('lab.pitchDesc')}</p>
                  <div className="flex gap-3">
                    <button
                      onClick={async () => {
                        const note = ALL_NOTES.find(n => n.full === 'C3');
                        if (note) await audioService.playPianoNote(note, 0.5, 0.8);
                      }}
                      className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 text-slate-600 hover:bg-slate-200 transition-all hover:scale-[1.02] active:scale-95"
                    >
                      {t('lab.low')}
                    </button>
                    <button
                      onClick={async () => {
                        const note = ALL_NOTES.find(n => n.full === 'C5');
                        if (note) await audioService.playPianoNote(note, 0.5, 0.8);
                      }}
                      className="px-4 py-2 rounded-xl text-xs font-semibold text-white transition-all hover:opacity-90 active:scale-95"
                      style={{ background: PALETTE.blue.accent }}
                    >
                      {t('lab.high')}
                    </button>
                  </div>
                </div>
              </Card>

              <Card title={t('lab.duration')} icon={<Clock size={16} style={{ color: PALETTE.blue.accent }} />}>
                <div className="flex flex-col gap-3 sm:gap-4 items-center">
                  <p className="text-sm text-slate-500 text-center">{t('lab.durationDesc')}</p>
                  <div className="flex gap-3">
                    <button
                      onClick={async () => {
                        const note = ALL_NOTES.find(n => n.full === 'A4');
                        if (note) await audioService.playPianoNote(note, 0.1, 0.8);
                      }}
                      className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 text-slate-600 hover:bg-slate-200 transition-all hover:scale-[1.02] active:scale-95"
                    >
                      {t('lab.short')}
                    </button>
                    <button
                      onClick={async () => {
                        const note = ALL_NOTES.find(n => n.full === 'A4');
                        if (note) await audioService.playPianoNote(note, 1.5, 0.8);
                      }}
                      className="px-4 py-2 rounded-xl text-xs font-semibold text-white transition-all hover:opacity-90 active:scale-95"
                      style={{ background: PALETTE.blue.accent }}
                    >
                      {t('lab.long')}
                    </button>
                  </div>
                </div>
              </Card>

              <Card title={t('lab.dynamics')} icon={<Volume2 size={16} style={{ color: PALETTE.blue.accent }} />}>
                <div className="flex flex-col gap-3 sm:gap-4 items-center">
                  <p className="text-sm text-slate-500 text-center">{t('lab.dynamicsDesc')}</p>
                  <div className="flex gap-3">
                    <button
                      onClick={async () => {
                        const note = ALL_NOTES.find(n => n.full === 'A4');
                        if (note) await audioService.playPianoNote(note, 0.5, 0.2);
                      }}
                      className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 text-slate-600 hover:bg-slate-200 transition-all hover:scale-[1.02] active:scale-95"
                    >
                      {t('lab.soft')}
                    </button>
                    <button
                      onClick={async () => {
                        const note = ALL_NOTES.find(n => n.full === 'A4');
                        if (note) await audioService.playPianoNote(note, 0.5, 1.0);
                      }}
                      className="px-4 py-2 rounded-xl text-xs font-semibold text-white transition-all hover:opacity-90 active:scale-95"
                      style={{ background: PALETTE.blue.accent }}
                    >
                      {t('lab.loud')}
                    </button>
                  </div>
                </div>
              </Card>
            </div>

            <div className="bg-white rounded-2xl p-4 shadow-[0_1px_4px_rgba(0,0,0,0.02)]">
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-bold text-slate-800">{t('lab.tryIt')}</h3>
                <ClearBtn />
              </div>
              <Piano {...{ theme_type: false } as any} activeNotes={activeNotes.map(n => n.full)} onNotePlay={toggleNote} />
            </div>
          </div>
        );

      case 'THEORY':
        return (
          <div className="space-y-4 animate-fade-in">
            <div className="bg-white rounded-2xl p-4 shadow-[0_1px_4px_rgba(0,0,0,0.02)] flex flex-col items-center gap-3">
              <MusicStaff theme_type={false} activeNotes={activeNotes} displayMode={staffDisplayMode} className="h-[200px] w-full" />

              <div className="w-full grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl bg-[#F8FAFC]">
                {[
                  { label: t('lab.noteName'), value: lastPlayedNote?.name ?? '-', color: PALETTE.blue.accent },
                  { label: t('lab.notation'), value: lastPlayedNote ? renderJianpuWithDots(lastPlayedNote) : '-', color: PALETTE.blue.accent },
                  { label: t('lab.pitchLabel'), value: lastPlayedNote?.full ?? '-', color: PALETTE.blue.accent },
                  { label: t('lab.solfege'), value: lastPlayedNote ? SOLFEGE_MAP[lastPlayedNote.name] : '-', color: PALETTE.blue.accent },
                ].map(({ label, value, color }) => (
                  <div key={label} className="text-center p-1.5 sm:p-2">
                    <span className="text-[10px] sm:text-[10px] font-semibold uppercase tracking-widest block mb-1 text-slate-400">{label}</span>
                    <div className="text-xl sm:text-2xl font-bold" style={{ color }}>{value}</div>
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
          <div className="space-y-2 sm:space-y-3 animate-fade-in">
            {/* Staff + Chord selector: side by side on desktop, stacked on mobile */}
            <div className="bg-white rounded-2xl p-2.5 sm:p-4 shadow-[0_1px_4px_rgba(0,0,0,0.02)]">
              <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(560px,640px)] gap-3 sm:gap-4 lg:gap-6 items-stretch">
                {/* Left: Staff */}
                <div className="min-w-0 lg:flex lg:items-center lg:self-stretch">
                  <MusicStaff theme_type={false} activeNotes={activeNotes} displayMode={staffDisplayMode} className="h-[140px] sm:h-[200px] lg:h-[220px] w-full" />
                </div>
                {/* Right: Chord selector */}
                <div className="min-w-0 w-full lg:max-w-[640px] lg:ml-auto flex flex-col gap-2 sm:gap-3">
                  <div className="flex flex-wrap justify-between items-center gap-2 mb-0.5 sm:mb-1">
                    <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">{t('lab.selectChord')}</span>
                    <ClearBtn />
                  </div>
                  {CHORDS.map((chord) => (
                    <div key={chord.name} className="grid grid-cols-[92px_minmax(0,1fr)] sm:grid-cols-[124px_1fr] gap-2.5 sm:gap-4 px-3 sm:px-5 py-3 sm:py-4 rounded-[24px] sm:rounded-[28px] bg-[#F8FAFC] items-center">
                      <div className="min-w-0">
                        <div className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">{chord.name}</div>
                        <div className="text-[13px] sm:text-[15px] font-bold leading-tight text-slate-600">{chord.description}</div>
                      </div>
                      <div className="flex gap-2 sm:gap-3 min-w-0 overflow-x-auto scrollbar-hide pr-1 sm:grid sm:grid-cols-7 sm:overflow-visible sm:pr-0">
                        {HARMONY_ROOTS.map(root => {
                          const chordName = formatPopChordName(root, chord);
                          const isActive = selectedChordName === chordName;
                          return (
                          <button
                            key={chordName}
                            onClick={() => {
                              const rootNote = ALL_NOTES.find(n => n.name === root && n.octave === 4);
                              if (rootNote) playChord(rootNote, chord);
                            }}
                            className="h-12 w-12 sm:h-12 sm:w-auto sm:min-w-0 px-0 sm:px-3 flex-shrink-0 flex items-center justify-center text-[11px] sm:text-[15px] font-semibold tracking-tight rounded-[20px] sm:rounded-2xl transition-all active:scale-95"
                            style={isActive
                              ? {
                                background: PALETTE.blue.accent,
                                color: '#fff',
                                boxShadow: '0 10px 24px rgba(59, 130, 246, 0.18)',
                              }
                              : {
                                background: '#FFFFFF',
                                color: '#475569',
                                boxShadow: '0 4px 14px rgba(148, 163, 184, 0.08)',
                              }
                            }
                          >
                            {chordName}
                          </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            {/* Piano full width */}
            <div className="bg-white rounded-2xl px-4 pt-3 pb-1 shadow-[0_1px_4px_rgba(0,0,0,0.02)]">
              <Piano {...{ theme_type: false } as any} activeNotes={activeNotes.map(n => n.full)} onNotePlay={toggleNote} />
            </div>
          </div>
        );

      case 'RHYTHM':
        return (
          <div className="space-y-3 sm:space-y-4 animate-fade-in">
            <DrumSequencer {...{ theme_type: false } as any} />
            <div className="bg-white rounded-xl p-3.5 sm:p-4 shadow-[0_1px_4px_rgba(0,0,0,0.02)]">
              <h4 className="text-sm font-bold text-slate-800 mb-1">{t('lab.instrumentInfo')}</h4>
              <p className="text-sm text-slate-500">{t('lab.instrumentDesc')}</p>
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

      case 'CHINESE_INST':
        return <ChineseInstruments />;
    }
  };

  // ── Nav items ──────────────────────────────────────────────────────────────

  const NAV_ITEMS = [
    { id: 'BASIC',   label: t('lab.basic'), icon: Library },
    { id: 'THEORY',  label: t('lab.theory'), icon: BookOpen },
    { id: 'HARMONY', label: t('lab.harmony'), icon: Radio },
    { id: 'RHYTHM',  label: t('lab.rhythm'), icon: Drum },
    { id: 'COMPOSE', label: t('lab.compose'), icon: PenTool },
    { id: 'CHINESE_INST', label: t('lab.cnInst'), icon: Flower2 },
  ] as const;

  const MODULE_SUBTITLES: Record<SubModule, string> = {
    BASIC:   t('lab.sub.basic'),
    THEORY:  t('lab.sub.theory'),
    HARMONY: t('lab.sub.harmony'),
    RHYTHM:  t('lab.sub.rhythm'),
    COMPOSE: t('lab.sub.compose'),
    CHINESE_INST: t('lab.sub.cnInst'),
  };

  return (
    <div className="relative bg-[#F5F7FA] overflow-hidden">
      {/* ── Page-level decorative background ── */}
      <PageDecoration />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 pb-20 md:pb-10">

        {/* ── Hero ── */}
        <div className="pt-5 sm:pt-8 pb-3">
          <p className="text-xs sm:text-[10px] font-semibold uppercase tracking-widest mb-1.5" style={{ color: PALETTE.blue.accent }}>
            {t('lab.subtitle')}
          </p>
          <div className="flex items-end justify-between gap-4 sm:gap-6">
            <div>
              <h1 className="text-2xl sm:text-5xl font-black leading-[1.1] tracking-tight text-slate-800 mb-1.5">
                {t('lab.hero')}<span style={{ color: PALETTE.blue.accent }}>{t('lab.heroAccent')}</span>
              </h1>
              <p className="text-sm font-medium text-slate-400 max-w-sm leading-relaxed">
                {MODULE_SUBTITLES[activeModule]}
              </p>
            </div>
          </div>
        </div>

        {/* ── Filter tabs ── */}
        <div className="flex items-center gap-1.5 sm:gap-2 py-2.5 overflow-x-auto scrollbar-hide">
          {NAV_ITEMS.map(({ id, label, icon: Icon }) => {
            const active = activeModule === id;
            return (
              <button
                key={id}
                onClick={() => setActiveModule(id as SubModule)}
                className="flex items-center gap-1.5 sm:gap-2 px-3.5 sm:px-4 py-2 rounded-full text-xs font-semibold transition-all whitespace-nowrap flex-shrink-0"
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
