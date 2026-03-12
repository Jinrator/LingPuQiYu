export type NoteName = 'C' | 'C#' | 'D' | 'D#' | 'E' | 'F' | 'F#' | 'G' | 'G#' | 'A' | 'A#' | 'B';

export interface Note {
  name: NoteName;
  octave: number;
  full: string; // e.g., "C4"
  frequency: number;
  color?: string; // For UI visualization
}

export interface ActiveNote extends Note {
  startTime?: number;
}

export interface SequencerStep {
  id: number;
  notes: Note[];
}

export enum AppStage {
  BASICS = 'basics',
  THEORY = 'theory',
  HARMONY = 'harmony',
  RHYTHM = 'rhythm',
  COMPOSITION = 'composition',
}

export interface ChordType {
  name: string;
  symbol: string;
  description: string;
  intervals: number[]; // Semitones from root
}

export type DrumType = 'kick' | 'snare' | 'hihat' | 'openhat' | 'rimshot' | 'clap' | 'lowtom' | 'midtom' | 'hightom' | 'crash' | 'ride';

// 鼓组套件类型
export type DrumKitType = 'acoustic' | 'electronic';

export enum ViewMode {
  ADVENTURE = 'ADVENTURE',
  FREE_LAB = 'FREE_LAB',
  STAGE = 'STAGE',
  USER_PROFILE = 'USER_PROFILE'
}

export interface Level {
  id: number;
  title: string;
  unlocked: boolean;
  completed: boolean;
  reward: string;
}

export interface Song {
  id: string;
  title: string;
  grid: boolean[][];
  rhythmGrid: boolean[][];
  createdAt: number;
  author: string;
}

export type GridType = boolean[][];
