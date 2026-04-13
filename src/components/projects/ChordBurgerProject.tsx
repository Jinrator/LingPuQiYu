import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { Layers, Trash2, X, Play, Move3D } from 'lucide-react';
import { audioService } from '../../services/audioService';
import { NOTES } from '../../utils/musicNotes';
import { PALETTE } from '../../constants/palette';
import ProjectShell from './ProjectShell';
import { Note } from '../../types';

interface ChordBurgerProjectProps { onComplete: () => void; onBack: () => void; theme?: 'light' | 'dark'; }

type SlotKey = 'bottom' | 'middle' | 'top';
type PlaybackMode = 'chord' | 'single';
type MiddleKind = 'major' | 'minor';

interface RootIngredient {
  id: string;
  kind: 'bottom';
  noteIndex: number;
  name: string;
  label: string;
  emoji: string;
}

interface MiddleIngredient {
  id: string;
  kind: 'middle';
  mode: MiddleKind;
  name: string;
  emoji: string;
}

interface TopIngredient {
  id: string;
  kind: 'top';
  name: string;
  emoji: string;
}

type Ingredient = RootIngredient | MiddleIngredient | TopIngredient;

interface DragState {
  ingredient: Ingredient;
  pointerId: number;
  x: number;
  y: number;
  startX: number;
  startY: number;
  moved: boolean;
}

const SCALE = [
  { name: 'C', note: NOTES.C4, label: '1' },
  { name: 'D', note: NOTES.D4, label: '2' },
  { name: 'E', note: NOTES.E4, label: '3' },
  { name: 'F', note: NOTES.F4, label: '4' },
];

const MAJOR_THIRDS = [NOTES.E4, NOTES.Fs4, NOTES.Gs4, NOTES.A4];
const MINOR_THIRDS = [NOTES.Ds4, NOTES.F4, NOTES.G4, NOTES.Gs4];
const FIFTHS = [NOTES.G4, NOTES.A4, NOTES.B4, NOTES.C5];

const ROOT_INGREDIENTS: RootIngredient[] = SCALE.map((item, index) => ({
  id: `bottom-${item.name}`,
  kind: 'bottom',
  noteIndex: index,
  name: `${item.name}面包底`,
  label: item.label,
  emoji: '🍞',
}));

const MIDDLE_INGREDIENTS: MiddleIngredient[] = [
  { id: 'middle-major', kind: 'middle', mode: 'major', name: '阳光牛肉排', emoji: '🥩' },
  { id: 'middle-minor', kind: 'middle', mode: 'minor', name: '夜色黑椒排', emoji: '🍖' },
];

const TOP_INGREDIENT: TopIngredient = {
  id: 'top-lettuce',
  kind: 'top',
  name: '生菜上盖',
  emoji: '🥬',
};

const sleep = (ms: number) => new Promise((resolve) => window.setTimeout(resolve, ms));

const ChordBurgerProject: React.FC<ChordBurgerProjectProps> = ({ onComplete, onBack }) => {
  const [bottomNote, setBottomNote] = useState<number | null>(null);
  const [middleNote, setMiddleNote] = useState<MiddleKind | null>(null);
  const [topNote, setTopNote] = useState(false);
  const [showExplanation, setShowExplanation] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackMode, setPlaybackMode] = useState<PlaybackMode>('chord');
  const [dragState, setDragState] = useState<DragState | null>(null);
  const slotRefs = useRef<Record<SlotKey, HTMLDivElement | null>>({
    bottom: null,
    middle: null,
    top: null,
  });

  const isMajor = middleNote !== 'minor';

  const getMiddleNote = useCallback((rootIndex: number, mode: MiddleKind) => {
    return mode === 'major' ? MAJOR_THIRDS[rootIndex] : MINOR_THIRDS[rootIndex];
  }, []);

  const buildPlayableNotes = useCallback((): Note[] => {
    if (bottomNote === null) return [];
    const notes = [SCALE[bottomNote].note];
    if (middleNote) notes.push(getMiddleNote(bottomNote, middleNote));
    if (topNote) notes.push(FIFTHS[bottomNote]);
    return notes;
  }, [bottomNote, middleNote, topNote, getMiddleNote]);

  const previewIngredient = useCallback((ingredient: Ingredient) => {
    if (ingredient.kind === 'bottom') {
      audioService.playPianoNote(SCALE[ingredient.noteIndex].note, 0.5, 0.8);
      return;
    }

    if (bottomNote === null) return;

    if (ingredient.kind === 'middle') {
      audioService.playPianoNote(getMiddleNote(bottomNote, ingredient.mode), 0.5, 0.8);
      return;
    }

    audioService.playPianoNote(FIFTHS[bottomNote], 0.5, 0.8);
  }, [bottomNote, getMiddleNote]);

  const placeIngredient = useCallback((ingredient: Ingredient) => {
    if (ingredient.kind === 'bottom') {
      setBottomNote(ingredient.noteIndex);
    }

    if (ingredient.kind === 'middle') {
      setMiddleNote(ingredient.mode);
    }

    if (ingredient.kind === 'top') {
      setTopNote(true);
    }

    previewIngredient(ingredient);
  }, [previewIngredient]);

  const getCompatibleSlotAtPoint = useCallback((ingredient: Ingredient, x: number, y: number): SlotKey | null => {
    const slots: SlotKey[] = ['top', 'middle', 'bottom'];
    const compatibleSlot = ingredient.kind;

    for (const slot of slots) {
      const element = slotRefs.current[slot];
      if (!element || slot !== compatibleSlot) continue;
      const rect = element.getBoundingClientRect();
      if (x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom) {
        return slot;
      }
    }

    return null;
  }, []);

  const playChord = useCallback(async () => {
    if (bottomNote === null) return;
    setIsPlaying(true);
    const notes = buildPlayableNotes();

    try {
      if (playbackMode === 'chord') {
        await audioService.playPianoChord(notes, 1.5, 0.7);
      } else {
        for (const note of notes) {
          await audioService.playPianoNote(note, 0.55, 0.78);
          await sleep(240);
        }
      }
    } finally {
      window.setTimeout(() => setIsPlaying(false), 220);
    }
  }, [bottomNote, buildPlayableNotes, playbackMode]);

  useEffect(() => {
    if (!dragState) return;

    const handlePointerMove = (event: PointerEvent) => {
      if (event.pointerId !== dragState.pointerId) return;
      const moved = dragState.moved || Math.abs(event.clientX - dragState.startX) > 8 || Math.abs(event.clientY - dragState.startY) > 8;
      setDragState((current) => current && current.pointerId === event.pointerId
        ? {
            ...current,
            x: event.clientX,
            y: event.clientY,
            moved,
          }
        : current);
    };

    const handlePointerUp = (event: PointerEvent) => {
      if (event.pointerId !== dragState.pointerId) return;
      const dropSlot = getCompatibleSlotAtPoint(dragState.ingredient, event.clientX, event.clientY);

      if (dropSlot || !dragState.moved) {
        placeIngredient(dragState.ingredient);
      }

      setDragState(null);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [dragState, getCompatibleSlotAtPoint, placeIngredient]);

  const startDrag = useCallback((ingredient: Ingredient, event: React.PointerEvent<HTMLButtonElement>) => {
    event.preventDefault();
    setDragState({
      ingredient,
      pointerId: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      startX: event.clientX,
      startY: event.clientY,
      moved: false,
    });
  }, []);

  const resetBurger = () => {
    setBottomNote(null);
    setMiddleNote(null);
    setTopNote(false);
  };

  const isComplete = bottomNote !== null && middleNote !== null && topNote;

  const noteSummary = useMemo(() => {
    if (bottomNote === null) return '先放下底层面包，汉堡才会有根音。';
    const parts = [SCALE[bottomNote].note.full];
    if (middleNote) parts.push(getMiddleNote(bottomNote, middleNote).full);
    if (topNote) parts.push(FIFTHS[bottomNote].full);
    return `当前组合：${parts.join(' - ')}`;
  }, [bottomNote, middleNote, topNote, getMiddleNote]);

  const playbackHint = playbackMode === 'single'
    ? '单音版会按 1-3-5 依次播放，更适合启蒙和跟唱。'
    : '和弦版会让食材一起发声，直接听到和声厚度。';

  const renderTrayItem = (ingredient: Ingredient, subtitle: string, active: boolean) => (
    <button
      key={ingredient.id}
      onPointerDown={(event) => startDrag(ingredient, event)}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          placeIngredient(ingredient);
        }
      }}
      className="w-full rounded-[22px] border px-3 py-3 text-left transition-all active:scale-[0.98]"
      style={{
        background: active ? '#FFF7ED' : '#FFFFFF',
        borderColor: active ? PALETTE.orange.accent : '#E2E8F0',
        boxShadow: active ? '0 12px 28px rgba(245,160,91,0.18)' : '0 6px 20px rgba(15,23,42,0.05)',
        touchAction: 'none',
      }}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div
            className="w-11 h-11 rounded-2xl flex items-center justify-center text-xl flex-shrink-0"
            style={{ background: active ? PALETTE.orange.bg : '#F8FAFC' }}
          >
            {ingredient.emoji}
          </div>
          <div className="min-w-0">
            <div className="text-sm font-bold text-slate-800 truncate">{ingredient.name}</div>
            <div className="text-[11px] font-medium text-slate-500 leading-snug">{subtitle}</div>
          </div>
        </div>
        <Move3D size={16} className="text-slate-300 flex-shrink-0" />
      </div>
    </button>
  );

  const renderSlot = (slot: SlotKey) => {
    const isActiveSlot = dragState ? getCompatibleSlotAtPoint(dragState.ingredient, dragState.x, dragState.y) === slot : false;

    if (slot === 'top') {
      return (
        <div
          ref={(element) => { slotRefs.current.top = element; }}
          className="relative flex items-center justify-center"
          style={{
            width: 248,
            height: 106,
            borderRadius: 28,
            border: `2px dashed ${isActiveSlot ? PALETTE.green.accent : PALETTE.green.accent}33`,
            background: isActiveSlot ? `${PALETTE.green.bg}` : '#FFFFFFAA',
            transition: 'all 0.22s ease',
          }}
        >
          {topNote ? (
            <div className="relative flex flex-col items-center animate-[fadeIn_0.25s_ease]">
              <div style={{ width: 210, height: 18, borderRadius: 9999, background: 'linear-gradient(90deg, #6dd27e 0%, #4fb968 100%)' }} />
              <div
                className="-mt-1 flex items-center justify-center"
                style={{
                  width: 224,
                  height: 58,
                  borderRadius: '9999px 9999px 16px 16px',
                  background: 'linear-gradient(180deg, #FAD7A2 0%, #F5A05B 100%)',
                  boxShadow: '0 10px 22px rgba(245,160,91,0.2)',
                }}
              >
                <span style={{ fontSize: 11, fontWeight: 800, color: '#7C4A12', letterSpacing: 1.5 }}>5th</span>
              </div>
            </div>
          ) : (
            <span className="text-xs font-semibold text-slate-400">把生菜上盖拖到这里</span>
          )}
        </div>
      );
    }

    if (slot === 'middle') {
      const middleColor = middleNote === 'minor' ? PALETTE.blue : PALETTE.yellow;
      return (
        <div
          ref={(element) => { slotRefs.current.middle = element; }}
          className="relative flex items-center justify-center"
          style={{
            width: 230,
            height: 86,
            borderRadius: 24,
            border: `2px dashed ${isActiveSlot ? middleColor.accent : '#CBD5E1'}`,
            background: isActiveSlot ? middleColor.bg : '#FFFFFF',
            transition: 'all 0.22s ease',
          }}
        >
          {middleNote ? (
            <div
              className="flex items-center justify-center"
              style={{
                width: 194,
                height: 46,
                borderRadius: 18,
                background: middleNote === 'major'
                  ? 'linear-gradient(180deg, #D97706 0%, #92400E 100%)'
                  : 'linear-gradient(180deg, #64748B 0%, #334155 100%)',
                boxShadow: '0 10px 20px rgba(15,23,42,0.18)',
              }}
            >
              <span className="text-[11px] font-black tracking-[0.18em] text-white uppercase">
                {middleNote === 'major' ? 'Major 3rd' : 'Minor 3rd'}
              </span>
            </div>
          ) : (
            <span className="text-xs font-semibold text-slate-400">把肉排拖到这里</span>
          )}
        </div>
      );
    }

    return (
      <div
        ref={(element) => { slotRefs.current.bottom = element; }}
        className="relative flex items-center justify-center"
        style={{
          width: 248,
          height: 110,
          borderRadius: 28,
          border: `2px dashed ${isActiveSlot ? PALETTE.orange.accent : '#FDBA74'}`,
          background: isActiveSlot ? PALETTE.orange.bg : '#FFFFFF',
          transition: 'all 0.22s ease',
        }}
      >
        {bottomNote !== null ? (
          <div
            className="flex items-center justify-center"
            style={{
              width: 224,
              height: 66,
              borderRadius: '20px 20px 28px 28px',
              background: 'linear-gradient(180deg, #F9D298 0%, #F5A05B 100%)',
              boxShadow: '0 12px 26px rgba(245,160,91,0.22)',
            }}
          >
            <div className="flex items-center gap-3">
              <span style={{ fontSize: 24 }}>{ROOT_INGREDIENTS[bottomNote].emoji}</span>
              <div className="flex flex-col items-start">
                <span style={{ fontSize: 11, fontWeight: 800, color: '#7C4A12', letterSpacing: 1.5, textTransform: 'uppercase' }}>Root</span>
                <span style={{ fontSize: 22, fontWeight: 900, color: '#7C4A12', lineHeight: 1 }}>{SCALE[bottomNote].label}</span>
              </div>
            </div>
          </div>
        ) : (
          <span className="text-xs font-semibold text-slate-400">把面包底拖到这里</span>
        )}
      </div>
    );
  };

  const burger = (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
      <div className="relative">
        <div
          style={{
            position: 'absolute',
            inset: '18px 22px 26px',
            borderRadius: 36,
            background: 'radial-gradient(circle at center, rgba(255, 219, 161, 0.55) 0%, rgba(255,255,255,0) 72%)',
            filter: 'blur(12px)',
          }}
        />
        <div className="relative flex flex-col items-center gap-[-8px]">
          {renderSlot('top')}
          {renderSlot('middle')}
          {renderSlot('bottom')}
        </div>
      </div>

      <div className="min-h-8 flex items-center justify-center">
        {isComplete && (
          <span
            style={{
              padding: '6px 14px',
              borderRadius: 9999,
              fontSize: 12,
              fontWeight: 700,
              background: isMajor ? PALETTE.yellow.bg : PALETTE.blue.bg,
              color: isMajor ? '#B45309' : PALETTE.blue.accent,
              border: '1px solid ' + (isMajor ? PALETTE.yellow.accent : PALETTE.blue.accent) + '33',
            }}
          >
            {isMajor ? '阳光大三和弦' : '夜色小三和弦'}
          </span>
        )}
      </div>

      <div className="w-full max-w-[340px] rounded-[24px] border border-slate-200 bg-white px-3 py-3 shadow-[0_12px_32px_rgba(15,23,42,0.06)]">
        <div className="flex items-center justify-between gap-2">
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">播放方式</div>
            <div className="text-xs font-semibold text-slate-500">{playbackHint}</div>
          </div>
          <div className="flex rounded-2xl bg-slate-100 p-1">
            {[
              { key: 'single', label: '单音版' },
              { key: 'chord', label: '和弦版' },
            ].map((item) => (
              <button
                key={item.key}
                onClick={() => setPlaybackMode(item.key as PlaybackMode)}
                className="px-3 py-2 rounded-[14px] text-xs font-bold transition-all"
                style={playbackMode === item.key
                  ? { background: '#FFFFFF', color: PALETTE.orange.accent, boxShadow: '0 4px 12px rgba(15,23,42,0.08)' }
                  : { color: '#64748B' }}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-3 flex items-center gap-2 text-xs font-semibold text-slate-500">
          <Play size={14} style={{ color: PALETTE.orange.accent }} />
          <span>{noteSummary}</span>
        </div>

        <button
          onClick={playChord}
          disabled={bottomNote === null || isPlaying}
          style={{
            marginTop: 12,
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            padding: '12px 18px',
            borderRadius: 18,
            background: bottomNote === null ? '#E2E8F0' : 'linear-gradient(135deg, #F5A05B 0%, #EA580C 100%)',
            color: bottomNote === null ? '#94A3B8' : '#fff',
            fontWeight: 700,
            fontSize: 13,
            border: 'none',
            cursor: bottomNote === null ? 'not-allowed' : 'pointer',
            opacity: isPlaying ? 0.75 : 1,
            boxShadow: bottomNote === null ? 'none' : '0 16px 28px rgba(234,88,12,0.22)',
          }}
        >
          <Play size={15} fill="currentColor" />
          {isPlaying ? '播放中…' : playbackMode === 'single' ? '播放单音汉堡' : '播放和弦汉堡'}
        </button>
      </div>
    </div>
  );

  const ingredientPanels = (
    <div className="space-y-3">
      <div className="bg-white rounded-[28px] border border-slate-200 p-4 shadow-[0_12px_32px_rgba(15,23,42,0.04)]">
        <span className="text-[10px] font-semibold uppercase tracking-widest mb-3 block" style={{ color: PALETTE.orange.accent }}>面包底托盘 Root</span>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {ROOT_INGREDIENTS.map((ingredient) => renderTrayItem(
            ingredient,
            `${SCALE[ingredient.noteIndex].name} ${SCALE[ingredient.noteIndex].label}级，拖进底层当根音`,
            bottomNote === ingredient.noteIndex,
          ))}
        </div>
      </div>

      <div className="bg-white rounded-[28px] border border-slate-200 p-4 shadow-[0_12px_32px_rgba(15,23,42,0.04)]">
        <span className="text-[10px] font-semibold uppercase tracking-widest mb-3 block" style={{ color: PALETTE.orange.accent }}>肉排托盘 3rd</span>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {MIDDLE_INGREDIENTS.map((ingredient) => {
            const currentNote = bottomNote !== null ? getMiddleNote(bottomNote, ingredient.mode).full : '先选根音';
            return renderTrayItem(
              ingredient,
              ingredient.mode === 'major' ? `明亮版三音 ${currentNote}` : `柔和版三音 ${currentNote}`,
              middleNote === ingredient.mode,
            );
          })}
        </div>
      </div>

      <div className="bg-white rounded-[28px] border border-slate-200 p-4 shadow-[0_12px_32px_rgba(15,23,42,0.04)]">
        <span className="text-[10px] font-semibold uppercase tracking-widest mb-3 block" style={{ color: PALETTE.orange.accent }}>生菜上盖 5th</span>
        {renderTrayItem(
          TOP_INGREDIENT,
          bottomNote !== null ? `收口五音 ${FIFTHS[bottomNote].full}，拖进顶层更完整` : '先选根音，再把上盖放上去',
          topNote,
        )}
      </div>

      <button onClick={resetBurger}
        className="flex items-center gap-2 text-slate-400 hover:text-red-400 transition-colors font-semibold text-xs px-1">
        <Trash2 size={13} /> 重置汉堡
      </button>
    </div>
  );

  return (
    <ProjectShell
      lessonId={8} title="和弦叠叠乐" subtitle="CHORD BURGER LAB" color="orange"
      actionLabel="提交和弦汉堡" actionEnabled={isComplete} onAction={onComplete} onBack={onBack}
      footerText="Harmonic Stacking · Triad Mod 2.0"
    >
      {dragState && (
        <div
          className="fixed left-0 top-0 z-[260] pointer-events-none"
          style={{ transform: `translate(${dragState.x - 84}px, ${dragState.y - 42}px)` }}
        >
          <div
            className="rounded-[24px] border border-orange-200 bg-white/95 px-4 py-3 shadow-[0_18px_40px_rgba(15,23,42,0.18)] backdrop-blur-sm"
            style={{ minWidth: 168 }}
          >
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl flex items-center justify-center text-xl" style={{ background: PALETTE.orange.bg }}>
                {dragState.ingredient.emoji}
              </div>
              <div>
                <div className="text-sm font-bold text-slate-800">{dragState.ingredient.name}</div>
                <div className="text-[11px] font-medium text-slate-500">拖到对应的汉堡层里</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {showExplanation && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-[0_1px_4px_rgba(0,0,0,0.02)] p-4 mb-4"
          style={{ borderLeftColor: PALETTE.orange.accent, borderLeftWidth: 3 }}>
          <div className="flex gap-3 items-start">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
              style={{ background: PALETTE.orange.bg }}>🍔</div>
            <div className="flex-1">
              <h3 className="text-sm font-bold text-slate-800 mb-0.5">声音的"叠罗汉"</h3>
              <p className="text-xs font-medium text-slate-500 leading-relaxed">
                把面包、肉排和生菜真的拖进汉堡里。和弦版会一起响，单音版会按 1-3-5 依次响，更适合启蒙。
              </p>
            </div>
            <button onClick={() => setShowExplanation(false)} className="p-1 text-slate-300 hover:text-slate-500">
              <X size={14} />
            </button>
          </div>
        </div>
      )}

      <div className="grid gap-4 lg:hidden">
        <div className="flex justify-center py-4">
          {burger}
        </div>
        {ingredientPanels}
      </div>

      <div className="hidden lg:grid gap-6 items-start" style={{ gridTemplateColumns: '1fr 260px 1fr' }}>
        <div>{ingredientPanels}</div>

        <div className="flex flex-col items-center justify-start pt-2">
          {burger}
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-[0_1px_4px_rgba(0,0,0,0.02)] p-4">
          <div className="flex items-center gap-2 mb-4">
            <Layers size={16} style={{ color: PALETTE.blue.accent }} />
            <h4 className="text-sm font-bold text-slate-700">汉堡公式</h4>
          </div>
          <div className="space-y-3">
            {[
              { n: '1', label: '面包底：先站稳根音', color: PALETTE.orange },
              { n: '3', label: '肉排：决定明亮还是柔和', color: isMajor ? PALETTE.yellow : PALETTE.blue },
              { n: '5', label: '生菜上盖：让声音更完整', color: PALETTE.green },
            ].map(item => (
              <div key={item.n} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                  style={{ background: item.color.accent }}>{item.n}</div>
                <span className="text-xs font-medium text-slate-500">{item.label}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 p-3 rounded-xl border-2 border-dashed"
            style={{
              background: (isMajor ? PALETTE.yellow : PALETTE.blue).bg,
              borderColor: (isMajor ? PALETTE.yellow : PALETTE.blue).accent + '33',
            }}>
            <p className="text-[10px] font-medium leading-relaxed text-slate-400 italic">
              单音版先教孩子听懂 1、3、5 的顺序，再切到和弦版，就能感受到三个音叠起来的厚度。
            </p>
          </div>
        </div>
      </div>
    </ProjectShell>
  );
};

export default ChordBurgerProject;
