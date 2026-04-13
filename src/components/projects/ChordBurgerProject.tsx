
import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { Layers, Trash2, X, Play } from 'lucide-react';
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
  name: `${item.name} 根音`,
  label: item.label,
  emoji: '🎵',
}));

const MIDDLE_INGREDIENTS: MiddleIngredient[] = [
  { id: 'middle-major', kind: 'middle', mode: 'major', name: '大三度', emoji: '大' },
  { id: 'middle-minor', kind: 'middle', mode: 'minor', name: '小三度', emoji: '小' },
];

const TOP_INGREDIENT: TopIngredient = {
  id: 'top-lettuce',
  kind: 'top',
  name: '纯五度',
  emoji: '🎵',
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

  const startDrag = useCallback((ingredient: Ingredient, event: React.PointerEvent<HTMLDivElement>) => {
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
    if (bottomNote === null) return '先放上根音，才有坚实的和弦基础哦！';
    const parts = [SCALE[bottomNote].note.full];
    if (middleNote) parts.push(getMiddleNote(bottomNote, middleNote).full);
    if (topNote) parts.push(FIFTHS[bottomNote].full);
    return `当前组合：${parts.join(' - ')}`;
  }, [bottomNote, middleNote, topNote, getMiddleNote]);

  const playbackHint = playbackMode === 'single'
    ? '分解和弦：按 1-3-5 顺序依次发声，听清每一个音符。'
    : '柱式和弦：所有音符同时发声，感受和弦饱满的听感！';

  const renderPhysicalShape = (ingredient: Ingredient) => {
    if (ingredient.kind === 'top') {
      return (
        <div className="relative flex flex-col items-center">
          <div className="z-10" style={{ width: 170, height: 16, borderRadius: 9999, background: '#F5A05B' }} />
          <div
            className="-mt-1 flex items-center justify-center flex-col"
            style={{
              width: 184,
              height: 12,
              borderRadius: '0 0 16px 16px',
              background: '#4ADE80',
              boxShadow: 'none',
              zIndex: 0
            }}
          >
            <span style={{ fontSize: 10, fontWeight: 800, color: '#14532D', letterSpacing: 1.5 }}>5th 纯五度</span>
          </div>
        </div>
      );
    }
    if (ingredient.kind === 'middle') {
      const isMajor = ingredient.mode === 'major';
      return (
        <div
          className="flex items-center justify-center transition-transform"
          style={{
            width: 176,
            height: 48,
            borderRadius: 16,
            background: isMajor ? '#FBBF24' : '#60A5FA',
            boxShadow: 'none',
          }}
        >
          <span className="text-xs font-black tracking-[0.1em] text-white uppercase flex flex-col items-center leading-tight">
            <span>{isMajor ? 'Major 3rd' : 'Minor 3rd'}</span>
            <span className="text-[10px] opacity-90">{ingredient.name}</span>
          </span>
        </div>
      );
    }
    return (
      <div
        className="flex items-center justify-center transition-transform"
        style={{
          width: 184,
          height: 52,
          borderRadius: 16,
          background: '#F5A05B',
          boxShadow: 'none',
        }}
      >
        <div className="flex items-center gap-2">
          <div className="flex flex-col items-start leading-none gap-0.5">
            <span style={{ fontSize: 9, fontWeight: 800, color: '#7C4A12', letterSpacing: 1.2, textTransform: 'uppercase' }}>Root</span>
            <span style={{ fontSize: 16, fontWeight: 900, color: '#7C4A12' }}>{SCALE[ingredient.noteIndex].label} {SCALE[ingredient.noteIndex].name}</span>
          </div>
        </div>
      </div>
    );
  };

  const renderDraggableIngredient = (ingredient: Ingredient, active: boolean) => {
    return (
      <div
        key={ingredient.id}
        onPointerDown={(event) => startDrag(ingredient, event)}
        className="cursor-grab transition-transform active:cursor-grabbing hover:scale-105 select-none"
        style={{
          touchAction: 'none',
          opacity: active ? 0.35 : 1,
          filter: active ? 'grayscale(0.5)' : 'none',
        }}
      >
        {renderPhysicalShape(ingredient)}
      </div>
    );
  };

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
              <div className="z-10" style={{ width: 210, height: 18, borderRadius: 9999, background: '#F5A05B' }} />
              <div
                className="-mt-1 flex items-center justify-center"
                style={{
                  width: 224,
                  height: 14,
                  borderRadius: '0 0 16px 16px',
                  background: '#4ADE80',
                  boxShadow: 'none',
                  zIndex: 0
                }}
              >
                <span style={{ fontSize: 11, fontWeight: 800, color: '#14532D', letterSpacing: 1.5 }}>5th</span>
              </div>
            </div>
          ) : (
            <span className="text-xs font-semibold text-slate-400">拖拽纯五度到这里</span>
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
              className="flex items-center justify-center transition-transform"
              style={{
                width: 194,
                height: 46,
                borderRadius: 18,
                background: middleNote === 'major'
                  ? '#FBBF24'
                  : '#60A5FA',
                boxShadow: 'none',
              }}
            >
              <span className="text-[11px] font-black tracking-[0.18em] text-white uppercase">
                {middleNote === 'major' ? 'Major 3rd' : 'Minor 3rd'}
              </span>
            </div>
          ) : (
            <span className="text-xs font-semibold text-slate-400">拖拽三度音到这里</span>
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
            className="flex items-center justify-center transition-transform"
            style={{
              width: 224,
              height: 66,
              borderRadius: 20,
              background: '#F5A05B',
              boxShadow: 'none',
            }}
          >
            <div className="flex items-center gap-3">
              <div className="flex flex-col items-start">
                <span style={{ fontSize: 11, fontWeight: 800, color: '#7C4A12', letterSpacing: 1.5, textTransform: 'uppercase' }}>Root</span>
                <span style={{ fontSize: 22, fontWeight: 900, color: '#7C4A12', lineHeight: 1 }}>{SCALE[bottomNote].label}</span>
              </div>
            </div>
          </div>
        ) : (
          <span className="text-xs font-semibold text-slate-400">拖拽根音到这里</span>
        )}
      </div>
    );
  };

  const burger = (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
      <div className="relative">
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
            {isMajor ? '大三和弦 (Major)' : '小三和弦 (Minor)'}
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
                  ? { background: '#FFFFFF', color: PALETTE.orange.accent, boxShadow: 'none' }
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
            background: bottomNote === null ? '#E2E8F0' : '#FFB74D',
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
          {isPlaying ? '播放中…' : playbackMode === 'single' ? '听听每一层 (单音)' : '弹奏柱式和弦'}
        </button>
      </div>
    </div>
  );

  const ingredientPanels = (
    <div className="space-y-4 w-full max-w-[460px] mx-auto pb-8">
      <div className="bg-white rounded-[28px] border border-slate-200 p-5 shadow-[0_12px_32px_rgba(15,23,42,0.04)]">
        <div className="flex justify-between items-center mb-4">
          <span className="text-[11px] font-bold uppercase tracking-widest" style={{ color: PALETTE.orange.accent }}>和弦音符 MODULES</span>
          <button onClick={resetBurger}
            className="flex items-center gap-1.5 text-slate-400 hover:text-red-500 transition-colors font-semibold text-xs bg-slate-50 px-3 py-1.5 rounded-full">
            <Trash2 size={13} /> 清空和弦
          </button>
        </div>
        
        <div className="space-y-6">
          <div className="space-y-2">
            <div className="text-[10px] font-semibold text-slate-400 pl-2">第三步：加上纯五度 (5th)</div>
            <div className="flex justify-center py-2 bg-slate-50 rounded-[20px] border border-slate-100">
              {renderDraggableIngredient(TOP_INGREDIENT, topNote)}
            </div>
          </div>

          <div className="space-y-2">
            <div className="text-[10px] font-semibold text-slate-400 pl-2">第二步：加上三度音 (3rd)</div>
            <div className="flex justify-center gap-4 py-3 bg-slate-50 rounded-[20px] border border-slate-100 px-4">
              {MIDDLE_INGREDIENTS.map((ingredient) => 
                renderDraggableIngredient(ingredient, middleNote === ingredient.mode)
              )}
            </div>
          </div>

          <div className="space-y-2">
            <div className="text-[10px] font-semibold text-slate-400 pl-2">第一步：挑选基础根音 (Root)</div>
            <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-[24px] border border-slate-100">
              {ROOT_INGREDIENTS.map((ingredient) => 
                renderDraggableIngredient(ingredient, bottomNote === ingredient.noteIndex)
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-[0_1px_4px_rgba(0,0,0,0.02)] p-4">
        <div className="flex items-center gap-2 mb-4">
          <Layers size={16} style={{ color: PALETTE.blue.accent }} />
          <h4 className="text-sm font-bold text-slate-700">秘籍</h4>
        </div>
        <div className="space-y-3">
          {[
            { n: '1', label: '打底：选个稳当的根音 (根音)', color: PALETTE.orange },
            { n: '3', label: '主菜：加块音符定口味 (三音)', color: isMajor ? PALETTE.yellow : PALETTE.blue },
            { n: '5', label: '点缀：盖上纯五度更完美 (五音)', color: PALETTE.green },
          ].map(item => (
            <div key={item.n} className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                style={{ background: item.color.accent }}>{item.n}</div>
              <span className="text-xs font-medium text-slate-500">{item.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <ProjectShell
      lessonId={8} title="和弦叠叠乐" subtitle="CHORD BURGER LAB" color="orange"
      actionLabel="提交和弦" actionEnabled={isComplete} onAction={onComplete} onBack={onBack}
      footerText="Harmonic Stacking · Triad Mod 2.0"
    >
      {dragState && (
        <div
          className="fixed left-0 top-0 z-[260] pointer-events-none drop-shadow-2xl"
          style={{ transform: `translate(${dragState.x - 84}px, ${dragState.y - 42}px)` }}
        >
          {renderPhysicalShape(dragState.ingredient)}
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
                把不同的音符拖进中间的和弦区里，组合出你专属的和弦吧！
              </p>
            </div>
            <button onClick={() => setShowExplanation(false)} className="p-1 text-slate-300 hover:text-slate-500">
              <X size={14} />
            </button>
          </div>
        </div>
      )}

      <div className="grid gap-8 lg:grid-cols-2 lg:items-start lg:gap-12 w-full max-w-5xl mx-auto">
        {/* Left Side: Burger Assembly */}
        <div className="flex flex-col items-center justify-start pt-2 w-full">
          {burger}
        </div>

        {/* Right Side: Ingredients */}
        <div className="w-full">
          {ingredientPanels}
        </div>
      </div>
    </ProjectShell>
  );
};

export default ChordBurgerProject;
