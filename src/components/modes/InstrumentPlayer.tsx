import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { ArrowLeft, Music2, Volume2 } from 'lucide-react';
import { PALETTE } from '../../constants/palette';
import { useSettings } from '../../contexts/SettingsContext';
import type { PaletteKey } from '../../constants/palette';
import { createKeyboardShortcutMaps, isEditableTarget, LETTER_SHORTCUTS } from '../../utils/keyboardShortcuts';
import KeyboardPlayToggle from '../ui/KeyboardPlayToggle';

// ── Types ────────────────────────────────────────────────────────────────────

interface NoteKey {
  note: string;      // e.g. 'C', 'D', 'C#'
  octave: number;
  label: string;     // display: 'C#5'
  isBlack: boolean;
  url: string;
  playbackRate?: number;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

const NOTE_ORDER = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const BLACK_NOTES = new Set(['C#', 'D#', 'F#', 'G#', 'A#']);
const NATURAL_NOTES = ['C', 'D', 'E', 'F', 'G', 'A', 'B'] as const;
const SHARP_AFTER: Partial<Record<(typeof NATURAL_NOTES)[number], string>> = {
  C: 'C#',
  D: 'D#',
  F: 'F#',
  G: 'G#',
  A: 'A#',
};
const PREVIOUS_NATURAL_FOR_BLACK: Record<string, (typeof NATURAL_NOTES)[number]> = {
  'C#': 'C',
  'D#': 'D',
  'F#': 'F',
  'G#': 'G',
  'A#': 'A',
};
const NEXT_NATURAL_FOR_BLACK: Record<string, (typeof NATURAL_NOTES)[number]> = {
  'C#': 'D',
  'D#': 'E',
  'F#': 'G',
  'G#': 'A',
  'A#': 'B',
};
const SOLFEGE: Record<string, string> = {
  'C': 'Do', 'C#': 'Di', 'D': 'Re', 'D#': 'Ri', 'E': 'Mi', 'F': 'Fa',
  'F#': 'Fi', 'G': 'Sol', 'G#': 'Si', 'A': 'La', 'A#': 'Li', 'B': 'Ti',
};

function noteSort(a: NoteKey, b: NoteKey): number {
  if (a.octave !== b.octave) return a.octave - b.octave;
  return NOTE_ORDER.indexOf(a.note) - NOTE_ORDER.indexOf(b.note);
}

interface WhiteSlot {
  note: (typeof NATURAL_NOTES)[number];
  octave: number;
  label: string;
}

function nextNaturalSlot(slot: WhiteSlot): WhiteSlot {
  const noteIndex = NATURAL_NOTES.indexOf(slot.note);
  if (noteIndex === NATURAL_NOTES.length - 1) {
    return { note: 'C', octave: slot.octave + 1, label: `C${slot.octave + 1}` };
  }

  const nextNote = NATURAL_NOTES[noteIndex + 1];
  return { note: nextNote, octave: slot.octave, label: `${nextNote}${slot.octave}` };
}

function getStartSlot(noteKey: NoteKey): WhiteSlot {
  const note = noteKey.isBlack ? PREVIOUS_NATURAL_FOR_BLACK[noteKey.note] : noteKey.note as (typeof NATURAL_NOTES)[number];
  return { note, octave: noteKey.octave, label: `${note}${noteKey.octave}` };
}

function getEndSlot(noteKey: NoteKey): WhiteSlot {
  const note = noteKey.isBlack ? NEXT_NATURAL_FOR_BLACK[noteKey.note] : noteKey.note as (typeof NATURAL_NOTES)[number];
  return { note, octave: noteKey.octave, label: `${note}${noteKey.octave}` };
}

function buildWhiteSlots(notes: NoteKey[]): WhiteSlot[] {
  if (notes.length === 0) return [];

  const sortedNotes = [...notes].sort(noteSort);
  const slots: WhiteSlot[] = [];
  let currentSlot = getStartSlot(sortedNotes[0]);
  const endSlot = getEndSlot(sortedNotes[sortedNotes.length - 1]);

  while (true) {
    slots.push(currentSlot);
    if (currentSlot.label === endSlot.label) break;
    currentSlot = nextNaturalSlot(currentSlot);
  }

  return slots;
}

/** Encode each path segment for browser URL (handles spaces, etc.) */
function enc(path: string): string {
  return path.split('/').map(seg => seg ? encodeURIComponent(seg) : '').join('/');
}

/** Convert sharp note name to filename-safe version: C# → Cs, F# → Fs, etc. */
function fileNote(note: string): string {
  return note.replace('#', 's');
}

function disablePitchPreservation(audio: HTMLAudioElement): void {
  // Important for transposed one-shots: playbackRate must affect pitch.
  if ('preservesPitch' in audio) {
    audio.preservesPitch = false;
  }

  const media = audio as HTMLAudioElement & {
    mozPreservesPitch?: boolean;
    webkitPreservesPitch?: boolean;
  };

  if ('mozPreservesPitch' in media) {
    media.mozPreservesPitch = false;
  }
  if ('webkitPreservesPitch' in media) {
    media.webkitPreservesPitch = false;
  }
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

// Guzheng keeps fixed display/play order per band: D, E, G, A, B.
const GUZHENG_SAMPLES: [string, number, string, string][] = [
  ['D', 3, 'low', 'd'],     ['E', 3, 'low', 'e'],     ['G', 3, 'low', 'g'],     ['A', 3, 'low', 'a'],     ['B', 3, 'low', 'b'],
  ['D', 4, 'midlow', 'd'],  ['E', 4, 'midlow', 'e'],  ['G', 4, 'midlow', 'g'],  ['A', 4, 'midlow', 'a'],  ['B', 4, 'midlow', 'b'],
  ['D', 5, 'midhigh', 'd'], ['E', 5, 'midhigh', 'e'], ['G', 5, 'midhigh', 'g'], ['A', 5, 'midhigh', 'a'], ['B', 5, 'midhigh', 'b'],
  ['D', 6, 'high', 'd'],    ['E', 6, 'high', 'e'],    ['G', 6, 'high', 'g'],    ['A', 6, 'high', 'a'],    ['B', 6, 'high', 'b'],
];

function buildGuzhengNotes(): NoteKey[] {
  const base = '/samples/china/One Shots/Strings/Guzheng';
  return GUZHENG_SAMPLES.map(([note, oct, band, fileNoteName]) => ({
    note,
    octave: oct,
    label: `${note}${oct}`,
    isBlack: false,
    // Guzheng sample files use uppercase pitch letters in filenames.
    url: enc(`${base}/SO_CG_guzheng_note_${band}_${fileNoteName.toUpperCase()}.wav`),
  }));
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

// Erhu: single practical range with real samples only (no synthetic pitch mapping).
// This minimizes timbre distortion caused by heavy transposition.
const ERHU_SAMPLES: Array<[string, number, string]> = [
  ['D', 4, 'er hu_tone(non vib.)_D_01.wav'],
  ['E', 4, 'er hu_tone(non vib.)_E.wav'],
  ['G', 4, 'er hu_tone(non vib.)_G_01.wav'],
  ['A', 4, 'er hu_tone(vib.2)_A_01.wav'],
  ['B', 4, 'er hu_tone(non vib.)_B.wav'],
];

function buildErhuNotes(): NoteKey[] {
  const base = '/samples/china/One Shots/Strings/Erhu';
  return ERHU_SAMPLES.map(([note, octave, filename]) => ({
    note,
    octave,
    label: `${note}${octave}`,
    isBlack: BLACK_NOTES.has(note),
    url: enc(`${base}/${filename}`),
  })).sort(noteSort);
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
  guzheng: { id: 'guzheng', nameKey: 'lab.cnInst.guzheng', color: 'green',  hasArticulation: false, buildNotes: () => buildGuzhengNotes() },
  pipa:    { id: 'pipa',    nameKey: 'lab.cnInst.pipa',    color: 'orange', hasArticulation: false, buildNotes: () => buildPipaNotes() },
  yangqin: { id: 'yangqin', nameKey: 'lab.cnInst.yangqin', color: 'yellow', hasArticulation: false, buildNotes: () => buildYangqinNotes() },
  hulusi:  { id: 'hulusi',  nameKey: 'lab.cnInst.hulusi',  color: 'pink',   hasArticulation: true,  buildNotes: (a = 'Long') => buildHulusiNotes(a) },
  xiao:    { id: 'xiao',    nameKey: 'lab.cnInst.xiao',    color: 'blue',   hasArticulation: true,  buildNotes: (a = 'Long') => buildXiaoNotes(a) },
  erhu:    { id: 'erhu',    nameKey: 'lab.cnInst.erhu',    color: 'pink',   hasArticulation: false, buildNotes: () => buildErhuNotes() },
};

export const PLAYABLE_IDS = Object.keys(PLAYABLE_INSTRUMENTS);

const AUDIO_POOL_SIZE = 3;
const AUDIO_PRELOAD_TIMEOUT_MS = 4000;
const audioPoolCache = new Map<string, Map<string, HTMLAudioElement[]>>();
const audioPoolPromises = new Map<string, Promise<Map<string, HTMLAudioElement[]>>>();

function getPoolCacheKey(instrumentId: string, articulation: 'Long' | 'Short' = 'Long'): string {
  const instrument = PLAYABLE_INSTRUMENTS[instrumentId];
  if (!instrument) return instrumentId;
  return instrument.hasArticulation ? `${instrumentId}:${articulation}` : instrumentId;
}

function primeAudioElement(audio: HTMLAudioElement): Promise<void> {
  if (audio.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
    return Promise.resolve();
  }

  return new Promise((resolve) => {
    let settled = false;

    const cleanup = () => {
      audio.removeEventListener('loadeddata', onReady);
      audio.removeEventListener('canplaythrough', onReady);
      audio.removeEventListener('error', onReady);
    };

    const onReady = () => {
      if (settled) return;
      settled = true;
      cleanup();
      resolve();
    };

    audio.addEventListener('loadeddata', onReady);
    audio.addEventListener('canplaythrough', onReady);
    audio.addEventListener('error', onReady);
    audio.load();
    window.setTimeout(onReady, AUDIO_PRELOAD_TIMEOUT_MS);
  });
}

async function createAudioPool(notes: NoteKey[]): Promise<Map<string, HTMLAudioElement[]>> {
  const entries = await Promise.all(notes.map(async (noteKey) => {
    const audios = Array.from({ length: AUDIO_POOL_SIZE }, () => {
      const audio = new Audio(noteKey.url);
      audio.preload = 'auto';
      disablePitchPreservation(audio);
      audio.load();
      return audio;
    });

    await primeAudioElement(audios[0]);
    return [noteKey.label, audios] as const;
  }));

  return new Map(entries);
}

async function ensureAudioPool(
  instrumentId: string,
  notes: NoteKey[],
  articulation: 'Long' | 'Short' = 'Long',
): Promise<Map<string, HTMLAudioElement[]>> {
  const cacheKey = getPoolCacheKey(instrumentId, articulation);
  const cachedPool = audioPoolCache.get(cacheKey);
  if (cachedPool) return cachedPool;

  const pendingPool = audioPoolPromises.get(cacheKey);
  if (pendingPool) return pendingPool;

  const poolPromise = createAudioPool(notes)
    .then((pool) => {
      audioPoolCache.set(cacheKey, pool);
      return pool;
    })
    .finally(() => {
      audioPoolPromises.delete(cacheKey);
    });

  audioPoolPromises.set(cacheKey, poolPromise);
  return poolPromise;
}

export async function preloadPlayableInstrumentSamples(instrumentId?: string): Promise<void> {
  const targetIds = instrumentId ? [instrumentId] : PLAYABLE_IDS;

  await Promise.all(targetIds.flatMap((id) => {
    const instrument = PLAYABLE_INSTRUMENTS[id];
    if (!instrument) return [];

    if (instrument.hasArticulation) {
      return [
        ensureAudioPool(id, instrument.buildNotes('Long'), 'Long'),
        ensureAudioPool(id, instrument.buildNotes('Short'), 'Short'),
      ];
    }

    return [ensureAudioPool(id, instrument.buildNotes())];
  }));
}

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
  const [keyboardPlayEnabled, setKeyboardPlayEnabled] = useState(true);
  const audioPoolRef = useRef<Map<string, HTMLAudioElement[]>>(new Map());
  const volumeRef = useRef(volume);

  const notes = useMemo(() => {
    if (!config) return [];
    return config.buildNotes(config.hasArticulation ? articulation : undefined);
  }, [config, articulation]);
  const { keyToItem: keyMap, idToShortcut: shortcutByLabel } = useMemo(
    () => createKeyboardShortcutMaps(notes, LETTER_SHORTCUTS, noteKey => noteKey.label),
    [notes],
  );
  const noteByLabel = useMemo(() => new Map(notes.map(noteKey => [noteKey.label, noteKey])), [notes]);
  const whiteSlots = useMemo(() => buildWhiteSlots(notes), [notes]);

  useEffect(() => {
    if (!config) return;

    let cancelled = false;

    const syncPool = async () => {
      const pool = await ensureAudioPool(
        instrumentId,
        notes,
        config.hasArticulation ? articulation : 'Long',
      );
      if (cancelled) return;

      audioPoolRef.current = pool;
      pool.forEach(arr => arr.forEach(a => { a.volume = volumeRef.current; }));
    };

    void syncPool();

    return () => {
      cancelled = true;
      audioPoolRef.current.forEach(arr => arr.forEach(a => {
        a.pause();
        a.currentTime = 0;
      }));
    };
  }, [config, instrumentId, notes, articulation]);

  useEffect(() => {
    volumeRef.current = volume;
    audioPoolRef.current.forEach(arr => arr.forEach(a => { a.volume = volume; }));
  }, [volume]);

  const playNote = useCallback((nk: NoteKey) => {
    const audios = audioPoolRef.current.get(nk.label);
    if (!audios) return;
    const idle = audios.find(a => a.paused || a.ended);
    const audio = idle || audios[0];
    disablePitchPreservation(audio);
    audio.currentTime = 0;
    audio.volume = volume;
    audio.playbackRate = nk.playbackRate ?? 1;
    audio.play().catch(() => {});

    setActiveKeys(prev => new Set(prev).add(nk.label));
    setTimeout(() => {
      setActiveKeys(prev => { const n = new Set(prev); n.delete(nk.label); return n; });
    }, 200);
  }, [volume]);

  // Keyboard shortcut mapping
  useEffect(() => {
    if (!keyboardPlayEnabled) {
      setActiveKeys(new Set());
      return;
    }

    const onKey = (e: KeyboardEvent) => {
      if (e.repeat || e.metaKey || e.ctrlKey || e.altKey || isEditableTarget(e.target)) return;
      const nk = keyMap[e.key.toLowerCase()];
      if (nk) playNote(nk);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [keyMap, keyboardPlayEnabled, playNote]);

  if (!config) {
    return <div className="text-center py-20 text-slate-400 text-sm">{t('lab.cnInst.noOneshot')}</div>;
  }

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

      <KeyboardPlayToggle enabled={keyboardPlayEnabled} onChange={setKeyboardPlayEnabled} />

      {/* Play area */}
      <div className="rounded-xl bg-slate-100 border border-slate-200">
        <div className="overflow-x-auto p-2" style={{ WebkitOverflowScrolling: 'touch', touchAction: 'pan-x' }}>
        <div className="relative flex justify-center items-start pt-2 min-w-max mx-auto pb-2">
          <div className="flex relative h-full">
            {whiteSlots.map((slot) => {
              const wk = noteByLabel.get(slot.label);
              const sharpNote = SHARP_AFTER[slot.note];
              const blackNote = sharpNote ? noteByLabel.get(`${sharpNote}${slot.octave}`) : undefined;
              const wkActive = wk ? activeKeys.has(wk.label) : false;
              const whiteShortcut = wk ? shortcutByLabel[wk.label] : undefined;

              return (
                <div key={slot.label} className="relative h-full">
                  {/* White Key */}
                  {wk ? (
                    <button
                      onPointerDown={(e) => { e.preventDefault(); playNote(wk); }}
                      style={{
                        backgroundColor: wkActive ? pal.bg : '#ffffff',
                        boxShadow: wkActive ? `0 0 15px ${pal.accent}66` : undefined,
                      }}
                      className="w-8 md:w-10 h-40 md:h-52 rounded-b-md flex flex-col justify-end items-center pb-2 z-10 transition-none shadow-sm active:scale-[0.98] origin-top select-none"
                    >
                      <div className="flex flex-col items-center gap-0.5">
                        {keyboardPlayEnabled && whiteShortcut && (
                          <span className="text-[9px] font-black tracking-wide text-slate-300">{whiteShortcut}</span>
                        )}
                        <span className="font-bold text-[10px] text-slate-600">{wk.note}</span>
                      </div>
                    </button>
                  ) : (
                    <div className="w-8 md:w-10 h-40 md:h-52 select-none" aria-hidden="true" />
                  )}

                  {/* Black Key */}
                  {blackNote && (() => {
                    const bkActive = activeKeys.has(blackNote.label);
                    const blackShortcut = shortcutByLabel[blackNote.label];
                    return (
                      <button
                        onPointerDown={(e) => { e.preventDefault(); e.stopPropagation(); playNote(blackNote); }}
                        style={{
                          backgroundColor: bkActive ? pal.accent : '#334155',
                          boxShadow: bkActive ? `0 0 15px ${pal.accent}cc` : undefined,
                        }}
                        className="absolute -right-2.5 md:-right-3 top-0 w-5 md:w-6 h-24 md:h-32 rounded-b-md z-20 transition-none active:scale-[0.98] origin-top select-none"
                      >
                        <div className="absolute bottom-1.5 left-1/2 flex -translate-x-1/2 flex-col items-center gap-0.5 leading-none">
                          {keyboardPlayEnabled && blackShortcut && (
                            <span className="text-[9px] font-black tracking-[0.08em] text-slate-300">
                              {blackShortcut}
                            </span>
                          )}
                          <span className="text-[9px] font-semibold tracking-[0.04em] text-white">
                            {blackNote.note}
                          </span>
                        </div>
                      </button>
                    );
                  })()}
                </div>
              );
            })}
          </div>
        </div>
        </div>
      </div>

      <p className="text-xs text-slate-400 text-center">
        {keyboardPlayEnabled ? t('lab.cnInst.playHint') : t('music.keyboardPlayOffHint')}
      </p>
    </div>
  );
};

export default InstrumentPlayer;
