import { Note } from '../types';

// 统一的音符定义 - 简洁明了
export const NOTES = {
  // 低音区
  C2: { name: 'C', octave: 2, full: 'C2', frequency: 65.41 } as Note,
  E2: { name: 'E', octave: 2, full: 'E2', frequency: 82.41 } as Note,
  G2: { name: 'G', octave: 2, full: 'G2', frequency: 98.00 } as Note,
  A1: { name: 'A', octave: 1, full: 'A1', frequency: 55.00 } as Note,
  A2: { name: 'A', octave: 2, full: 'A2', frequency: 110.00 } as Note,
  
  // 中音区
  C3: { name: 'C', octave: 3, full: 'C3', frequency: 130.81 } as Note,
  F3: { name: 'F', octave: 3, full: 'F3', frequency: 174.61 } as Note,
  G3: { name: 'G', octave: 3, full: 'G3', frequency: 196.00 } as Note,
  A3: { name: 'A', octave: 3, full: 'A3', frequency: 220.00 } as Note,
  B3: { name: 'B', octave: 3, full: 'B3', frequency: 246.94 } as Note,
  
  // 主音区
  C4: { name: 'C', octave: 4, full: 'C4', frequency: 261.63 } as Note,
  D4: { name: 'D', octave: 4, full: 'D4', frequency: 293.66 } as Note,
  Ds4: { name: 'D#', octave: 4, full: 'D#4', frequency: 311.13 } as Note,
  E4: { name: 'E', octave: 4, full: 'E4', frequency: 329.63 } as Note,
  F4: { name: 'F', octave: 4, full: 'F4', frequency: 349.23 } as Note,
  Fs4: { name: 'F#', octave: 4, full: 'F#4', frequency: 369.99 } as Note,
  G4: { name: 'G', octave: 4, full: 'G4', frequency: 392.00 } as Note,
  Gs4: { name: 'G#', octave: 4, full: 'G#4', frequency: 415.30 } as Note,
  A4: { name: 'A', octave: 4, full: 'A4', frequency: 440.00 } as Note,
  As4: { name: 'A#', octave: 4, full: 'A#4', frequency: 466.16 } as Note,
  B4: { name: 'B', octave: 4, full: 'B4', frequency: 493.88 } as Note,
  
  // 高音区
  C5: { name: 'C', octave: 5, full: 'C5', frequency: 523.25 } as Note,
  D5: { name: 'D', octave: 5, full: 'D5', frequency: 587.33 } as Note,
  E5: { name: 'E', octave: 5, full: 'E5', frequency: 659.25 } as Note,
  F5: { name: 'F', octave: 5, full: 'F5', frequency: 698.46 } as Note,
  G5: { name: 'G', octave: 5, full: 'G5', frequency: 783.99 } as Note,
};

// 常用和弦定义 - 直接用音名
export const CHORDS = {
  // 大三和弦
  C: [NOTES.C4, NOTES.E4, NOTES.G4],
  D: [NOTES.D4, NOTES.Fs4, NOTES.A4],
  E: [NOTES.E4, NOTES.Gs4, NOTES.B4],
  F: [NOTES.F4, NOTES.A4, NOTES.C5],
  G: [NOTES.G4, NOTES.B4, NOTES.D4],
  A: [NOTES.A4, NOTES.C5, NOTES.E4],
  
  // 小三和弦
  Cm: [NOTES.C4, NOTES.Ds4, NOTES.G4],
  Dm: [NOTES.D4, NOTES.F4, NOTES.A4],
  Em: [NOTES.E4, NOTES.G4, NOTES.B4],
  Fm: [NOTES.F4, NOTES.Gs4, NOTES.C5],
  Gm: [NOTES.G4, NOTES.As4, NOTES.D4],
  Am: [NOTES.A4, NOTES.C5, NOTES.E4],
};

// C大调音阶
export const C_MAJOR_SCALE = [
  NOTES.C4, NOTES.D4, NOTES.E4, NOTES.F4, 
  NOTES.G4, NOTES.A4, NOTES.B4, NOTES.C5
];

// C小调音阶
export const C_MINOR_SCALE = [
  NOTES.C4, NOTES.D4, NOTES.Ds4, NOTES.F4, 
  NOTES.G4, NOTES.Gs4, NOTES.As4, NOTES.C5
];