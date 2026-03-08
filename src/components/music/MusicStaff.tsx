
import React from 'react';
import { Note } from '../../types';
import { NUMBERED_NOTATION_MAP } from '../../constants';

interface MusicStaffProps {
  activeNotes: Note[];
  className?: string;
}

const MusicStaff: React.FC<MusicStaffProps> = ({ theme_type, activeNotes, className }) => {
  // SVG Configuration for Grand Staff
const width = 800;
const height = 300; // Increased height for better spacing
const lineGap = 12; // Gap between lines

// Vertical positions
const trebleTop = 60; 
const bassTop = 180;

const trebleLines = [0, 1, 2, 3, 4].map(i => trebleTop + i * lineGap);
const bassLines = [0, 1, 2, 3, 4].map(i => bassTop + i * lineGap);

// Calculate middle point for the brace
const staffStart = trebleTop;
const staffEnd = bassLines[4];
const midPoint = (staffStart + staffEnd) / 2;

const isDark = theme_type;

// Theme colors based on mode
const themeColors = {
  staffLine: isDark ? '#475569' : '#cbd5e1',
  staffBackground: isDark ? '#0f172a' : '#ffffff',
  noteColor: isDark ? '#f472b6' : '#e11d48',
  textColor: isDark ? '#cbd5e1' : '#334155',
  braceColor: isDark ? '#94a3b8' : '#1e293b',
  sharpColor: isDark ? '#f472b6' : '#e11d48',
  labelColor: isDark ? '#94a3b8' : '#64748b'
};

// Render Note Function
const renderNote = (note: Note, index: number, totalNotes: number) => {
  const isTreble = note.octave >= 4;
  
  // Calculate Y Position
  let y = 0;
  
  if (isTreble) {
      const diatonicScale = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
      const noteIndex = diatonicScale.indexOf(note.name.replace('#', ''));
      const absStep = (note.octave - 4) * 7 + noteIndex;
      y = trebleLines[4] - ((absStep - 2) * (lineGap / 2));
  } else {
      const diatonicScale = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
      const noteIndex = diatonicScale.indexOf(note.name.replace('#', ''));
      const stepsFromG2 = (note.octave - 2) * 7 + (noteIndex - 4);
      y = bassLines[4] - (stepsFromG2 * (lineGap / 2));
  }

  // Ledger Lines Logic
  const ledgerLines = [];
  
  if (isTreble) {
      for (let ly = trebleLines[0] - lineGap; ly >= y; ly -= lineGap) ledgerLines.push(ly);
      for (let ly = trebleLines[4] + lineGap; ly <= y; ly += lineGap) ledgerLines.push(ly);
  } else {
      for (let ly = bassLines[0] - lineGap; ly >= y; ly -= lineGap) ledgerLines.push(ly);
      for (let ly = bassLines[4] + lineGap; ly <= y; ly += lineGap) ledgerLines.push(ly);
  }

  const x = 200 + (index * 60);
  const isSharp = note.name.includes('#');

  return (
      <g key={`${note.full}-${index}`}>
        {/* Ledger Lines */}
        {ledgerLines.map(ly => (
           <line key={ly} x1={x - 12} y1={ly} x2={x + 12} y2={ly} 
                 stroke={themeColors.staffLine} strokeWidth="1.5" />
        ))}

        {/* Stem */}
        <line 
          x1={note.octave >= 5 || (note.octave === 4 && note.name >= 'B') ? x - 7 : x + 7} 
          y1={y} 
          x2={note.octave >= 5 || (note.octave === 4 && note.name >= 'B') ? x - 7 : x + 7} 
          y2={note.octave >= 5 || (note.octave === 4 && note.name >= 'B') ? y + 35 : y - 35} 
          stroke={themeColors.noteColor} 
          strokeWidth="2" 
        />

        {/* Note Head */}
        <ellipse 
          cx={x} 
          cy={y} 
          rx="7" 
          ry="5" 
          transform={`rotate(-15, ${x}, ${y})`} 
          fill={themeColors.noteColor} 
        />

        {/* Sharp Symbol */}
        {isSharp && (
          <text x={x - 22} y={y + 5} fontSize="18" fill={themeColors.sharpColor}>♯</text>
        )}
        
        {/* Labels below the entire grand staff */}
        <text x={x} y={bassLines[4] + 40} fontSize="12" textAnchor="middle" 
              fill={themeColors.labelColor} fontWeight="bold" fontFamily="monospace">
          {note.name}{note.octave}
        </text>

        {/* Numbered Notation (Jianpu) */}
        <text x={x} y={bassLines[4] + 65} fontSize="16" textAnchor="middle" 
              fill={themeColors.textColor} fontWeight="bold">
          {NUMBERED_NOTATION_MAP[note.name]}
          {/* Octave dots */}
          <tspan fontSize="10" dy="-8">
              {note.octave === 5 ? '•' : ''}
              {note.octave === 6 ? '••' : ''}
          </tspan>
          <tspan fontSize="10" dy="16" x={x}>
               {note.octave === 3 ? '•' : ''}
          </tspan>
        </text>
      </g>
    );
};

// Group notes for collision avoidance
const sortedNotes = [...activeNotes].sort((a, b) => a.frequency - b.frequency);

return (
  <div className={`w-full overflow-hidden rounded-xl flex items-center justify-center ${className} ${
    isDark ? 'bg-slate-900' : 'bg-white'
  }`}>
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full max-w-4xl select-none">
      
      
      <text x="30" y="30" fontSize="14" fontWeight="bold" fill={themeColors.textColor}>1 = C</text>

      
      <path 
          d={`M 20 ${trebleTop} 
              Q 0 ${trebleTop + 20} 5 ${midPoint} 
              Q 0 ${bassLines[4] - 20} 20 ${bassLines[4]} 
              L 17 ${bassLines[4]} 
              Q -3 ${bassLines[4] - 20} 2 ${midPoint} 
              Q -3 ${trebleTop + 20} 17 ${trebleTop} 
              Z`} 
          fill={themeColors.braceColor} 
      />
      
      
      <line x1="20" y1={trebleTop} x2="20" y2={bassLines[4]} 
            stroke={themeColors.braceColor} strokeWidth="1" />

      
      {trebleLines.map((y, i) => (
        <line key={`t-${i}`} x1="20" y1={y} x2={width - 20} y2={y} 
              stroke={themeColors.staffLine} strokeWidth="1" />
      ))}
      
      <text x="30" y={trebleLines[4] + 10 - lineGap} fontSize="70" fontFamily="serif" 
            fill={themeColors.braceColor}>𝄞</text>

      
      {bassLines.map((y, i) => (
        <line key={`b-${i}`} x1="20" y1={y} x2={width - 20} y2={y} 
              stroke={themeColors.staffLine} strokeWidth="1" />
      ))}
      
      <text x="30" y={bassLines[1] + 15 + lineGap} fontSize="55" fontFamily="serif" 
            fill={themeColors.braceColor}>𝄢</text>

    
      {sortedNotes.map((note, index) => renderNote(note, index, sortedNotes.length))}

    </svg>
  </div>
);
};

export default MusicStaff;
