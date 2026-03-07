import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { ArrowLeft, Music2, Volume2 } from 'lucide-react';
import { PALETTE } from '../../constants/palette';
import { useSettings } from '../../contexts/SettingsContext';
import type { PaletteKey } from '../../constants/palette';

// ── Types ────────────────────────────────────────────────────────────────────

interface NoteKey {
  note: string;      // e.g. 'C', 'D', 'C#'
  octave: number;
  label: string;     // display: 'C#5'
  isBlack: boolean;
  url: string;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

const NOTE_ORDER = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const BLACK_NOTES = new Set(['C#', 'D#', 'F#', 'G#', 'A#']);
const SOLFEGE: Record<string, string> = {
  'C': 'Do', 'C#': 'Di', 'D': 'Re', 'D#': 'Ri', 'E': 'Mi', 'F': 'Fa',
  'F#': 'Fi', 'G': 'Sol', 'G#': 'Si', 'A': 'La', 'A#': 'Li', 'B': 'Ti',
};

function noteSort(a: NoteKey, b: NoteKey): number {
  if (a.octave !== b.octave) return a.octave - b.octave;
  return NOTE_ORDER.indexOf(a.note) - NOTE_ORDER.indexOf(b.note);
}

/** Encode each path segment for browser URL (handles spaces, etc.) */
function enc(path: string): string {
  return path.split('/').map(seg => seg ? encodeURIComponent(seg) : '').join('/');
}

/** Convert sharp note name to filename-safe version: C# → Cs, F# → Fs, etc. */
function fileNote(note: string): string {
  return note.replace('#', 's');
}

// ── Sample mappings (note -> first available variant) ────────────────────────
// Built from actual file listing. Format: [note, octave, variant]

const PIPA_SAMPLES: [string, number, string][] = [
  ['A', 3, '01'], ['A', 4, '01'], ['A', 5, '01'], ['A', 6, '02'],
  ['B', 3, '01'], ['B', 4, '01'], ['B', 5, '02'], ['B', 6, '03'],
  ['C#', 4, '01'], ['C#', 5, '02'], ['C#', 6, '02'], ['C#', 7, '04'],
  ['D', 4, '01'], ['D', 5, '01'], ['D', 6, '02'], ['D', 7, '04'],
  ['E', 4, '01'], ['E', 5, '01'], ['E', 6, '02'], ['E', 7, '04'],
  ['F#', 4, '01'], ['F#', 5, '01'], ['F#', 6, '02'],
  ['G#', 4, '01'], ['G#', 5, '01'], ['G#', 6, '02'],
];

function buildPipaNotes(): NoteKey[] {
  const base = '/samples/china/One Shots/Strings/Pipa';
  return PIPA_SAMPLES.map(([note, oct, v]) => {
    const fn = fileNote(note);
    return {
      note, octave: oct,
      label: `${note}${oct}`,
      isBlack: BLACK_NOTES.has(note),
      url: enc(`${base}/${fn}_${fn}${oct}Pipa_${v}_541.wav`),
    };
  }).sort(noteSort);
}

const YANGQIN_SAMPLES: [string, number][] = [
  ['G', 3], ['A', 3], ['B', 3],
  ['C', 4], ['D', 4], ['E', 4], ['F', 4], ['G', 4], ['A', 4], ['B', 4],
  ['C', 5], ['D', 5], ['E', 5], ['F', 5], ['G', 5], ['A', 5], ['B', 5],
  ['C', 6], ['D', 6], ['E', 6], ['F', 6], ['G', 6], ['A', 6], ['B', 6],
  ['C', 7], ['D', 7], ['E', 7], ['F', 7], ['G', 7], ['A', 7],
];

function buildYangqinNotes(): NoteKey[] {
  const base = '/samples/china/One Shots/Strings/Yangqin';
  return YANGQIN_SAMPLES.map(([note, oct]) => ({
    note, octave: oct,
    label: `${note}${oct}`,
    isBlack: false,
    url: enc(`${base}/${note}_${note}${oct}Yangqin_01_541.wav`),
  })).sort(noteSort);
}

// Hulusi: Long and Short articulations. Some high notes only have Short.
const HULUSI_LONG: [string, number][] = [
  ['A', 4], ['A', 5],
  ['B', 4], ['B', 5],
  ['C#', 5], ['C#', 6],
  ['D', 5], ['D', 6],
  ['E', 5], ['E', 6],
  ['F#', 5], ['F#', 6],
  ['G#', 5],
];
const HULUSI_SHORT: [string, number][] = [
  ['A', 4], ['A', 5], ['A', 6],
  ['B', 4], ['B', 5], ['B', 6],
  ['C#', 5], ['C#', 6],
  ['D', 5], ['D', 6],
  ['E', 5], ['E', 6],
  ['F#', 5], ['F#', 6],
  ['G#', 5], ['G#', 6],
];

function buildHulusiNotes(art: 'Long' | 'Short'): NoteKey[] {
  const base = '/samples/china/One Shots/Woodwind/Hulusi';
  const list = art === 'Long' ? HULUSI_LONG : HULUSI_SHORT;
  return list.map(([note, oct]) => {
    const fn = fileNote(note);
    return {
      note, octave: oct,
      label: `${note}${oct}`,
      isBlack: BLACK_NOTES.has(note),
      url: enc(`${base}/${fn}_${fn}${oct}${art}Hulusi_01_541.wav`),
    };
  }).sort(noteSort);
}

// Xiao: Long and Short. Some high notes only Short.
const XIAO_LONG: [string, number][] = [
  ['D', 4], ['D', 5],
  ['E', 4], ['E', 5],
  ['F#', 4], ['F#', 5],
  ['G', 4], ['G', 5],
  ['A', 4], ['A', 5],
  ['B', 4], ['B', 5],
  ['C', 5],
];
const XIAO_SHORT: [string, number][] = [
  ['D', 4], ['D', 5], ['D', 6],
  ['E', 4], ['E', 5],
  ['F#', 4], ['F#', 5],
  ['G', 4], ['G', 5],
  ['A', 4], ['A', 5],
  ['B', 4], ['B', 5],
  ['C', 5], ['C', 6],
];

function buildXiaoNotes(art: 'Long' | 'Short'): NoteKey[] {
  const base = '/samples/china/One Shots/Woodwind/Xiao';
  const list = art === 'Long' ? XIAO_LONG : XIAO_SHORT;
  return list.map(([note, oct]) => {
    const fn = fileNote(note);
    return {
      note, octave: oct,
      label: `${note}${oct}`,
      isBlack: BLACK_NOTES.has(note),
      url: enc(`${base}/${fn}_${fn}${oct}${art}Xiao_01_541.wav`),
    };
  }).sort(noteSort);
}

// ── Instrument registry ──────────────────────────────────────────────────────

interface InstrumentDef {
  id: string;
  nameKey: string;
  color: PaletteKey;
  hasArticulation: boolean;
  buildNotes: (art?: 'Long' | 'Short') => NoteKey[];
}

const PLAYABLE_INSTRUMENTS: Record<string, InstrumentDef> = {
  pipa:    { id: 'pipa',    nameKey: 'lab.cnInst.pipa',    color: 'orange', hasArticulation: false, buildNotes: () => buildPipaNotes() },
  yangqin: { id: 'yangqin', nameKey: 'lab.cnInst.yangqin', color: 'yellow', hasArticulation: false, buildNotes: () => buildYangqinNotes() },
  hulusi:  { id: 'hulusi',  nameKey: 'lab.cnInst.hulusi',  color: 'pink',   hasArticulation: true,  buildNotes: (a = 'Long') => buildHulusiNotes(a) },
  xiao:    { id: 'xiao',    nameKey: 'lab.cnInst.xiao',    color: 'blue',   hasArticulation: true,  buildNotes: (a = 'Long') => buildXiaoNotes(a) },
};

export const PLAYABLE_IDS = Object.keys(PLAYABLE_INSTRUMENTS);

// ── Main component ───────────────────────────────────────────────────────────

interface InstrumentPlayerProps {
  instrumentId: string;
  onBack: () => void;
}

const InstrumentPlayer: React.FC<InstrumentPlayerProps> = ({ instrumentId, onBack }) => {
  const { t } = useSettings();
  const config = PLAYABLE_INSTRUMENTS[instrumentId];
  const pal = config ? PALETTE[config.color] : PALETTE.blue;

  const [articulation, setArticulation] = useState<'Long' | 'Short'>('Long');
  const [activeKeys, setActiveKeys] = useState<Set<string>>(new Set());
  const [volume, setVolume] = useState(0.8);
  const audioPoolRef = useRef<Map<string, HTMLAudioElement[]>>(new Map());

  const notes = useMemo(() => {
    if (!config) return [];
    return config.buildNotes(config.hasArticulation ? articulation : undefined);
  }, [config, articulation]);

  // Preload audio pool (3 per note for polyphony)
  useEffect(() => {
    const pool = new Map<string, HTMLAudioElement[]>();
    for (const nk of notes) {
      const audios: HTMLAudioElement[] = [];
      for (let i = 0; i < 3; i++) {
        const a = new Audio(nk.url);
        a.preload = 'auto';
        a.volume = volume;
        audios.push(a);
      }
      pool.set(nk.label, audios);
    }
    audioPoolRef.current = pool;
    return () => { pool.forEach(arr => arr.forEach(a => { a.pause(); a.src = ''; })); };
  }, [notes]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    audioPoolRef.current.forEach(arr => arr.forEach(a => { a.volume = volume; }));
  }, [volume]);

  const playNote = useCallback((nk: NoteKey) => {
    const audios = audioPoolRef.current.get(nk.label);
    if (!audios) return;
    const idle = audios.find(a => a.paused || a.ended);
    const audio = idle || audios[0];
    audio.currentTime = 0;
    audio.volume = volume;
    audio.play().catch(() => {});

    setActiveKeys(prev => new Set(prev).add(nk.label));
    setTimeout(() => {
      setActiveKeys(prev => { const n = new Set(prev); n.delete(nk.label); return n; });
    }, 200);
  }, [volume]);

  // Keyboard shortcut mapping
  useEffect(() => {
    const whiteNotes = notes.filter(n => !n.isBlack);
    const keyMap: Record<string, NoteKey> = {};
    const keys = 'asdfghjklqwertyuiopzxcvbnm';
    whiteNotes.forEach((nk, i) => { if (i < keys.length) keyMap[keys[i]] = nk; });

    const onKey = (e: KeyboardEvent) => {
      if (e.repeat || e.metaKey || e.ctrlKey) return;
      const nk = keyMap[e.key.toLowerCase()];
      if (nk) playNote(nk);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [notes, playNote]);

  if (!config) {
    return <div className="text-center py-20 text-slate-400 text-sm">{t('lab.cnInst.noOneshot')}</div>;
  }

  const whiteNotes = notes.filter(n => !n.isBlack);

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="w-9 h-9 rounded-xl flex items-center justify-center border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 transition-all active:scale-95"
        >
          <ArrowLeft size={16} />
        </button>
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: pal.bg }}>
          <Music2 size={18} style={{ color: pal.accent }} />
        </div>
        <div>
          <h2 className="text-sm font-bold text-slate-800">{t(config.nameKey)}</h2>
          <span className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: pal.accent }}>
            {t('lab.cnInst.playMode')}
          </span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-3 flex-wrap">
        {config.hasArticulation && (
          <div className="flex gap-1.5">
            {(['Long', 'Short'] as const).map(art => (
              <button
                key={art}
                onClick={() => setArticulation(art)}
                className="px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all border"
                style={articulation === art
                  ? { background: pal.bg, color: pal.accent, borderColor: pal.accent + '33' }
                  : { background: 'white', color: '#94A3B8', borderColor: '#E2E8F0' }
                }
              >
                {t(art === 'Long' ? 'lab.cnInst.long' : 'lab.cnInst.short')}
              </button>
            ))}
          </div>
        )}
        <div className="flex items-center gap-2 ml-auto">
          <Volume2 size={14} className="text-slate-400" />
          <input
            type="range" min={0} max={1} step={0.05}
            value={volume}
            onChange={e => setVolume(parseFloat(e.target.value))}
            className="w-20 h-1 accent-slate-400"
          />
        </div>
      </div>

      {/* Play area */}
      <div className="rounded-xl bg-slate-100 border border-slate-200">
        <div className="overflow-x-auto p-2" style={{ WebkitOverflowScrolling: 'touch', touchAction: 'pan-x' }}>
        <div className="relative flex justify-center items-start pt-2 min-w-max mx-auto pb-2">
          <div className="flex relative h-full">
            {whiteNotes.map((wk, i) => {
              const nextWhite = whiteNotes[i + 1];
              const blackBetween = nextWhite
                ? notes.find(n => n.isBlack && noteSort(n, nextWhite) < 0 && noteSort(n, wk) > 0)
                : undefined;
              const wkActive = activeKeys.has(wk.label);

              return (
                <div key={wk.label} className="relative h-full">
                  {/* White Key */}
                  <button
                    onPointerDown={(e) => { e.preventDefault(); playNote(wk); }}
                    style={{
                      backgroundColor: wkActive ? pal.bg : '#ffffff',
                      boxShadow: wkActive ? `0 0 15px ${pal.accent}66` : undefined,
                    }}
                    className="w-8 md:w-10 h-40 md:h-52 rounded-b-md flex flex-col justify-end items-center pb-2 z-10 transition-none shadow-sm active:scale-[0.98] origin-top select-none"
                  >
                    <div className="flex flex-col items-center gap-0.5">
                      <span className="font-bold text-[10px] text-slate-600">{wk.note}</span>
                    </div>
                  </button>

                  {/* Black Key */}
                  {blackBetween && (() => {
                    const bkActive = activeKeys.has(blackBetween.label);
                    return (
                      <button
                        onPointerDown={(e) => { e.preventDefault(); e.stopPropagation(); playNote(blackBetween); }}
                        style={{
                          backgroundColor: bkActive ? pal.accent : '#334155',
                          boxShadow: bkActive ? `0 0 15px ${pal.accent}cc` : undefined,
                        }}
                        className="absolute -right-2.5 md:-right-3 top-0 w-5 md:w-6 h-24 md:h-32 rounded-b-md z-20 transition-none active:scale-[0.98] origin-top select-none"
                      />
                    );
                  })()}
                </div>
              );
            })}
          </div>
        </div>
        </div>
      </div>

      <p className="text-xs text-slate-400 text-center">{t('lab.cnInst.playHint')}</p>
    </div>
  );
};

export default InstrumentPlayer;
