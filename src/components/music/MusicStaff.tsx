
import React from 'react';
import { Note } from '../../types';
import { NUMBERED_NOTATION_MAP } from '../../constants';

interface MusicStaffProps {
  theme_type?: boolean;
  activeNotes: Note[];
  displayMode?: 'sequence' | 'chord';
  className?: string;
}

const STAFF_WIDTH = 800;
const STAFF_HEIGHT = 300;
const LINE_GAP = 12;
const TREBLE_TOP = 60;
const BASS_TOP = 180;
const NOTE_CENTER_X = 420;
const LABEL_ROW_Y = 268;
const JIANPU_ROW_Y = 289;
const NOTE_HEAD_WIDTH = 10;
const STEM_LENGTH = 35;
const SEQUENCE_X_START = 180;
const SEQUENCE_X_END = 620;

const DIATONIC_STEPS: Record<string, number> = {
  C: 0,
  D: 1,
  E: 2,
  F: 3,
  G: 4,
  A: 5,
  B: 6,
};

const STEP_NAMES = ['C', 'D', 'E', 'F', 'G', 'A', 'B'] as const;
const NATURAL_PITCH_CLASSES: Record<(typeof STEP_NAMES)[number], number> = {
  C: 0,
  D: 2,
  E: 4,
  F: 5,
  G: 7,
  A: 9,
  B: 11,
};
const NOTE_PITCH_CLASSES: Record<Note['name'], number> = {
  C: 0,
  'C#': 1,
  D: 2,
  'D#': 3,
  E: 4,
  F: 5,
  'F#': 6,
  G: 7,
  'G#': 8,
  A: 9,
  'A#': 10,
  B: 11,
};

type Clef = 'treble' | 'bass';

interface BaseNoteLayout {
  note: Note;
  clef: Clef;
  step: number;
  x: number;
  y: number;
  labelX: number;
  direction: 'up' | 'down';
  ledgerLines: number[];
  accidentalColumn: number;
  accidentalSymbol: '' | '♯' | '♭';
  label: string;
}

interface ChordSpelling {
  step: number;
  accidentalSymbol: '' | '♯' | '♭';
  label: string;
}

const MusicStaff: React.FC<MusicStaffProps> = ({ theme_type = false, activeNotes, displayMode = 'sequence', className }) => {
  const trebleLines = [0, 1, 2, 3, 4].map(index => TREBLE_TOP + index * LINE_GAP);
  const bassLines = [0, 1, 2, 3, 4].map(index => BASS_TOP + index * LINE_GAP);
  const staffStart = TREBLE_TOP;
  const staffEnd = bassLines[4];
  const midPoint = (staffStart + staffEnd) / 2;
  const isDark = theme_type;

  const themeColors = {
    staffLine: isDark ? '#475569' : '#cbd5e1',
    staffBackground: isDark ? '#0f172a' : '#ffffff',
    noteColor: isDark ? '#f472b6' : '#e11d48',
    textColor: isDark ? '#cbd5e1' : '#334155',
    braceColor: isDark ? '#94a3b8' : '#1e293b',
    sharpColor: isDark ? '#f472b6' : '#e11d48',
    labelColor: isDark ? '#94a3b8' : '#64748b',
  };

  const getNaturalName = (noteName: Note['name']) => noteName.replace('#', '');

  const getDiatonicStep = (note: Note) => {
    const naturalName = getNaturalName(note.name);
    return note.octave * 7 + DIATONIC_STEPS[naturalName];
  };

  const getStaffStep = (name: string, octave: number) => octave * 7 + DIATONIC_STEPS[name];

  const clefAnchors = {
    treble: {
      bottomLineStep: getStaffStep('E', 4),
      topLineStep: getStaffStep('F', 5),
      bottomLineY: trebleLines[4],
      stemPivotStep: getStaffStep('B', 4),
    },
    bass: {
      bottomLineStep: getStaffStep('G', 2),
      topLineStep: getStaffStep('A', 3),
      bottomLineY: bassLines[4],
      stemPivotStep: getStaffStep('D', 3),
    },
  };

  const getClef = (note: Note): Clef => (
    getDiatonicStep(note) >= getStaffStep('C', 4) ? 'treble' : 'bass'
  );

  const getYForStep = (step: number, clef: Clef) => {
    const anchor = clefAnchors[clef];
    return anchor.bottomLineY - ((step - anchor.bottomLineStep) * (LINE_GAP / 2));
  };

  const normalizePitchDelta = (delta: number) => {
    if (delta > 6) {
      return delta - 12;
    }

    if (delta < -6) {
      return delta + 12;
    }

    return delta;
  };

  const buildChordSpellings = (notes: Note[]): ChordSpelling[] => {
    if (notes.length === 0) {
      return [];
    }

    const rootNote = notes[0];
    const rootNaturalName = getNaturalName(rootNote.name) as (typeof STEP_NAMES)[number];
    const rootStep = getStaffStep(rootNaturalName, rootNote.octave);

    return notes.map((note, index) => {
      const step = rootStep + index * 2;
      const stepName = STEP_NAMES[((step % 7) + 7) % 7];
      const octave = Math.floor(step / 7);
      const naturalPitchClass = NATURAL_PITCH_CLASSES[stepName];
      const actualPitchClass = NOTE_PITCH_CLASSES[note.name];
      const pitchDelta = normalizePitchDelta(actualPitchClass - naturalPitchClass);
      const accidentalSymbol = pitchDelta === 1 ? '♯' : pitchDelta === -1 ? '♭' : '';

      return {
        step,
        accidentalSymbol,
        label: `${stepName}${accidentalSymbol}${octave}`,
      };
    });
  };

  const getLedgerLines = (step: number, clef: Clef) => {
    const anchor = clefAnchors[clef];
    const ledgerLines: number[] = [];

    if (step < anchor.bottomLineStep) {
      for (let ledgerStep = anchor.bottomLineStep - 2; ledgerStep >= step; ledgerStep -= 2) {
        ledgerLines.push(getYForStep(ledgerStep, clef));
      }
    }

    if (step > anchor.topLineStep) {
      for (let ledgerStep = anchor.topLineStep + 2; ledgerStep <= step; ledgerStep += 2) {
        ledgerLines.push(getYForStep(ledgerStep, clef));
      }
    }

    return ledgerLines;
  };

  const getSequenceX = (index: number, total: number) => {
    if (total <= 1) {
      return NOTE_CENTER_X;
    }

    const spacing = Math.min(70, (SEQUENCE_X_END - SEQUENCE_X_START) / Math.max(total - 1, 1));
    const startX = NOTE_CENTER_X - (spacing * (total - 1)) / 2;
    return startX + spacing * index;
  };

  const getLabelX = (index: number, total: number) => {
    if (total <= 1) {
      return NOTE_CENTER_X;
    }

    if (displayMode === 'sequence') {
      return getSequenceX(index, total);
    }

    const spacing = Math.min(70, 320 / Math.max(total - 1, 1));
    const startX = STAFF_WIDTH / 2 - (spacing * (total - 1)) / 2;
    return startX + spacing * index;
  };

  const getSingleStemDirection = (step: number, clef: Clef): 'up' | 'down' => (
    step >= clefAnchors[clef].stemPivotStep ? 'down' : 'up'
  );

  const getChordStemDirection = (steps: number[], clef: Clef): 'up' | 'down' => {
    const pivot = clefAnchors[clef].stemPivotStep;
    const highestDistance = Math.abs(Math.max(...steps) - pivot);
    const lowestDistance = Math.abs(Math.min(...steps) - pivot);
    return highestDistance >= lowestDistance ? 'down' : 'up';
  };

  const getChordHeadOffsets = (steps: number[], direction: 'up' | 'down') => {
    const offsets = new Array(steps.length).fill(0);
    const alternateOffset = direction === 'up' ? -NOTE_HEAD_WIDTH : NOTE_HEAD_WIDTH;

    for (let index = 1; index < steps.length; index += 1) {
      if (Math.abs(steps[index] - steps[index - 1]) === 1) {
        offsets[index] = offsets[index - 1] === 0 ? alternateOffset : 0;
      }
    }

    return offsets;
  };

  const getAccidentalColumns = (layouts: Array<Pick<BaseNoteLayout, 'accidentalSymbol' | 'step'>>) => {
    let sharpColumn = 0;

    return layouts.map(layout => {
      if (!layout.accidentalSymbol) {
        return 0;
      }

      const currentColumn = sharpColumn;
      sharpColumn += 1;
      return currentColumn;
    });
  };

  const sortedNotes = [...activeNotes].sort((left, right) => left.frequency - right.frequency);
  const chordSpellings = displayMode === 'chord' ? buildChordSpellings(sortedNotes) : [];

  const baseLayouts = sortedNotes.map((note, index) => {
    const spelling = displayMode === 'chord' ? chordSpellings[index] : null;
    const step = spelling?.step ?? getDiatonicStep(note);
    const clef = getClef(note);

    return {
      note,
      clef,
      step,
      x: displayMode === 'chord' ? NOTE_CENTER_X : getSequenceX(index, sortedNotes.length),
      y: getYForStep(step, clef),
      labelX: getLabelX(index, sortedNotes.length),
      direction: getSingleStemDirection(step, clef),
      ledgerLines: getLedgerLines(step, clef),
      accidentalColumn: 0,
      accidentalSymbol: spelling?.accidentalSymbol ?? (note.name.includes('#') ? '♯' : ''),
      label: spelling?.label ?? `${note.name}${note.octave}`,
    } satisfies BaseNoteLayout;
  });

  const noteLayouts = (() => {
    if (displayMode !== 'chord') {
      const accidentalColumns = getAccidentalColumns(baseLayouts);
      return baseLayouts.map((layout, index) => ({
        ...layout,
        accidentalColumn: accidentalColumns[index],
      }));
    }

    const groupedByClef = {
      treble: baseLayouts.filter(layout => layout.clef === 'treble'),
      bass: baseLayouts.filter(layout => layout.clef === 'bass'),
    };

    return (['treble', 'bass'] as const).flatMap(clef => {
      const layouts = groupedByClef[clef];
      if (layouts.length === 0) {
        return [];
      }

      const steps = layouts.map(layout => layout.step);
      const direction = getChordStemDirection(steps, clef);
      const headOffsets = getChordHeadOffsets(steps, direction);
      const accidentalColumns = getAccidentalColumns(layouts);

      return layouts.map((layout, index) => ({
        ...layout,
        x: layout.x + headOffsets[index],
        direction,
        accidentalColumn: accidentalColumns[index],
      }));
    });
  })();

  const chordStemGroups = displayMode === 'chord'
    ? (['treble', 'bass'] as const)
        .map(clef => {
          const layouts = noteLayouts.filter(layout => layout.clef === clef);
          if (layouts.length === 0) {
            return null;
          }

          const direction = layouts[0].direction;
          const xPositions = layouts.map(layout => layout.x);
          const yPositions = layouts.map(layout => layout.y);
          const stemX = direction === 'up'
            ? Math.max(...xPositions) + 7
            : Math.min(...xPositions) - 7;
          const stemStartY = direction === 'up'
            ? Math.max(...yPositions)
            : Math.min(...yPositions);
          const stemEndY = direction === 'up'
            ? stemStartY - STEM_LENGTH
            : stemStartY + STEM_LENGTH;

          return {
            clef,
            direction,
            stemX,
            stemStartY,
            stemEndY,
          };
        })
        .filter(Boolean)
    : [];

  return (
    <div className={`w-full overflow-hidden rounded-xl flex items-center justify-center ${className} ${
      isDark ? 'bg-slate-900' : 'bg-white'
    }`}>
      <svg
        viewBox={`0 0 ${STAFF_WIDTH} ${STAFF_HEIGHT}`}
        className="w-full h-full max-w-4xl select-none"
        aria-label="Grand staff notation"
      >
        <rect x="0" y="0" width={STAFF_WIDTH} height={STAFF_HEIGHT} fill={themeColors.staffBackground} />

        <text x="30" y="30" fontSize="14" fontWeight="bold" fill={themeColors.textColor}>1 = C</text>

        <path
          d={`M 20 ${TREBLE_TOP}
              Q 0 ${TREBLE_TOP + 20} 5 ${midPoint}
              Q 0 ${bassLines[4] - 20} 20 ${bassLines[4]}
              L 17 ${bassLines[4]}
              Q -3 ${bassLines[4] - 20} 2 ${midPoint}
              Q -3 ${TREBLE_TOP + 20} 17 ${TREBLE_TOP}
              Z`}
          fill={themeColors.braceColor}
        />

        <line
          x1="20"
          y1={TREBLE_TOP}
          x2="20"
          y2={bassLines[4]}
          stroke={themeColors.braceColor}
          strokeWidth="1"
        />

        {trebleLines.map((y, index) => (
          <line
            key={`treble-${index}`}
            x1="20"
            y1={y}
            x2={STAFF_WIDTH - 20}
            y2={y}
            stroke={themeColors.staffLine}
            strokeWidth="1"
          />
        ))}

        <text
          x="30"
          y={trebleLines[4] + 10 - LINE_GAP}
          fontSize="70"
          fontFamily="serif"
          fill={themeColors.braceColor}
        >
          𝄞
        </text>

        {bassLines.map((y, index) => (
          <line
            key={`bass-${index}`}
            x1="20"
            y1={y}
            x2={STAFF_WIDTH - 20}
            y2={y}
            stroke={themeColors.staffLine}
            strokeWidth="1"
          />
        ))}

        <text
          x="30"
          y={bassLines[1] + 15 + LINE_GAP}
          fontSize="55"
          fontFamily="serif"
          fill={themeColors.braceColor}
        >
          𝄢
        </text>

        {noteLayouts.map(({ note, x, y, labelX, direction, ledgerLines, accidentalColumn, accidentalSymbol, label }, index) => {
          const stemX = direction === 'down' ? x - 7 : x + 7;
          const stemEndY = direction === 'down' ? y + STEM_LENGTH : y - STEM_LENGTH;
          const accidentalX = x - 24 - accidentalColumn * 10;

          return (
            <g key={`${note.full}-${index}`}>
              {ledgerLines.map(ledgerY => (
                <line
                  key={`${note.full}-ledger-${ledgerY}`}
                  x1={x - 12}
                  y1={ledgerY}
                  x2={x + 12}
                  y2={ledgerY}
                  stroke={themeColors.staffLine}
                  strokeWidth="1.5"
                />
              ))}

              {displayMode !== 'chord' && (
                <line
                  x1={stemX}
                  y1={y}
                  x2={stemX}
                  y2={stemEndY}
                  stroke={themeColors.noteColor}
                  strokeWidth="2"
                />
              )}

              <ellipse
                cx={x}
                cy={y}
                rx="7"
                ry="5"
                transform={`rotate(-15, ${x}, ${y})`}
                fill={themeColors.noteColor}
              />

              {accidentalSymbol && (
                <text x={accidentalX} y={y + 5} fontSize="18" fill={themeColors.sharpColor}>{accidentalSymbol}</text>
              )}

              <text
                x={labelX}
                y={LABEL_ROW_Y}
                fontSize="12"
                textAnchor="middle"
                fill={themeColors.labelColor}
                fontWeight="bold"
                fontFamily="monospace"
              >
                {label}
              </text>

              <text
                x={labelX}
                y={JIANPU_ROW_Y}
                fontSize="16"
                textAnchor="middle"
                fill={themeColors.textColor}
                fontWeight="bold"
              >
                {NUMBERED_NOTATION_MAP[note.name]}
                <tspan fontSize="10" dy="-8">
                  {note.octave === 5 ? '•' : ''}
                  {note.octave >= 6 ? '••' : ''}
                </tspan>
                <tspan fontSize="10" dy="16" x={labelX}>
                  {note.octave <= 3 ? '•' : ''}
                </tspan>
              </text>
            </g>
          );
        })}

        {chordStemGroups.map(group => {
          if (!group) {
            return null;
          }

          return (
            <line
              key={`stem-${group.clef}`}
              x1={group.stemX}
              y1={group.stemStartY}
              x2={group.stemX}
              y2={group.stemEndY}
              stroke={themeColors.noteColor}
              strokeWidth="2"
            />
          );
        })}
      </svg>
    </div>
  );
};

export default MusicStaff;
