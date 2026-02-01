
import { Level } from '../types';

export const GRID_ROWS = 8;
export const GRID_COLS = 16;
export const DRUM_ROWS = 2;

export const RAINBOW_COLORS = [
  'bg-blue-400',
  'bg-sky-400',
  'bg-cyan-400',
  'bg-indigo-400',
  'bg-blue-500',
  'bg-sky-500',
  'bg-cyan-500',
  'bg-indigo-500',
];

export interface AdventureLevel extends Level {
  category: '初级' | '中级' | '高级';
  phase: string;
  homework: string;
  icon: string;
}

export const ADVENTURE_LEVELS: AdventureLevel[] = [
  // 初级 (1-15) - 15节课的闯关地图
  { id: 1, category: '初级', phase: '声音实验室', title: '声音狩猎计划', homework: '捕捉生活中的3种声音并尝试录制，建立初步物理声学认知。', icon: '🏹', unlocked: true, completed: true, reward: '录音机' },
  { id: 2, category: '初级', phase: '声音实验室', title: '律动填色游戏', homework: '在格子中填出一段整齐的“心跳”节拍，理解音乐脉搏。', icon: '🎨', unlocked: true, completed: false, reward: '彩色笔' },
  { id: 3, category: '初级', phase: '声音实验室', title: '节奏乐高工厂', homework: '利用底鼓和军鼓拼接出人生第一条Beat。', icon: '🧱', unlocked: true, completed: false, reward: '节奏模块' },
  { id: 4, category: '初级', phase: '情绪调色盘', title: '音高登天梯', homework: '排列一组从低到高的“弹球”音阶，建立音准空间感。', icon: '🪜', unlocked: true, completed: false, reward: '音阶球' },
  { id: 5, category: '初级', phase: '情绪调色盘', title: '心情涂鸦板', homework: '感知大/小调差异，创作一段“忧郁蓝”的小调旋律。', icon: '🖍️', unlocked: true, completed: false, reward: '调式盘' },
  { id: 6, category: '初级', phase: '情绪调色盘', title: '旋律对对子', homework: '利用镜像工具实现旋律变幻，学习乐句“问答”结构。', icon: '🎭', unlocked: true, completed: false, reward: '镜像镜' },
  { id: 7, category: '初级', phase: '情绪调色盘', title: '灵感回溯录', homework: '请使用灵感精灵的“和弦库”哼唱旋律灵感，再使用“灵感回溯”功能回放自己即兴哼唱的“旋律灵感”，上传后将其转化为软件里的正式音符。', icon: '📼', unlocked: true, completed: false, reward: 'AI核心' },
  { id: 8, category: '初级', phase: '和声魔法屋', title: '和弦叠叠乐', homework: '通过“汉堡叠加”逻辑理解三和弦构造，听看见声音厚度。', icon: '🍔', unlocked: true, completed: false, reward: '三和弦' },
  { id: 9, category: '初级', phase: '和声魔法屋', title: '音乐探险路线', homework: '理解和弦的“推动感”，为旋律选择【无敌幸运星】、【甜甜圈派对】或【神秘森林】背景墙。', icon: '🚀', unlocked: true, completed: false, reward: '情绪引擎' },
  { id: 10, category: '初级', phase: '和声魔法屋', title: '风格大变身', homework: '尝试一键切换摇滚、爵士、电子等多元音乐织体。', icon: '🎩', unlocked: true, completed: false, reward: '风格包' },
  { id: 11, category: '初级', phase: '创作大拼图', title: '音乐地图册', homework: '拆解“主歌/副歌”结构，用视觉浓淡区分叙事与高潮。', icon: '🗺️', unlocked: true, completed: false, reward: '地图集' },
  { id: 12, category: '初级', phase: '创作大拼图', title: '记忆钩子 (Hook)', homework: '在灵感池中筛选核心动机，打造过耳不忘的副歌。', icon: '🪝', unlocked: true, completed: false, reward: '黄金钩' },
  { id: 13, category: '初级', phase: '创作大拼图', title: '音乐火车组装', homework: '学习“加花”与“桥段”连接，将散乱积木串联成长曲实战。', icon: '🚂', unlocked: true, completed: false, reward: '大曲谱' },
  { id: 14, category: '初级', phase: '制作人舞台', title: 'AI 录音棚', homework: '请在灵感精灵录制个人声轨，再将音频上传到这进行大师级后期处理。', icon: '🎙️', unlocked: true, completed: false, reward: '混音台' },
  { id: 15, category: '初级', phase: '制作人舞台', title: '个人首单发布', homework: '使用AI封面绘图工具，根据音乐情绪生成专辑封面，并举办线上发布会。', icon: '🏆', unlocked: true, completed: false, reward: '传奇勋章' },
];

export const TIMELINE_SECTIONS = [
  { label: '站台 A: 前奏', color: 'bg-blue-600', width: '25%' },
  { label: '站台 B: 主歌', color: 'bg-sky-500', width: '50%' },
  { label: '站台 C: 副歌', color: 'bg-white text-blue-900', width: '25%' },
];


import { Note, NoteName, ChordType } from '../types';

export const NOTE_NAMES: NoteName[] = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

export const SOLFEGE_MAP: Record<string, string> = {
  'C': 'Do',
  'C#': 'Di',
  'D': 'Re',
  'D#': 'Ri',
  'E': 'Mi',
  'F': 'Fa',
  'F#': 'Fi',
  'G': 'Sol',
  'G#': 'Si',
  'A': 'La',
  'A#': 'Li',
  'B': 'Ti'
};

export const NUMBERED_NOTATION_MAP: Record<string, string> = {
  'C': '1',
  'C#': '1♯',
  'D': '2',
  'D#': '2♯',
  'E': '3',
  'F': '4',
  'F#': '4♯',
  'G': '5',
  'G#': '5♯',
  'A': '6',
  'A#': '6♯',
  'B': '7'
};

// Generate notes for 3 octaves (C3 to C6)
export const generateNotes = (): Note[] => {
  const notes: Note[] = [];
  const startOctave = 3;
  const endOctave = 5; // C3 to B5, plus C6

  for (let oct = startOctave; oct <= endOctave; oct++) {
    NOTE_NAMES.forEach((name, index) => {
      const semitoneOffset = (oct - 4) * 12 + index - 9; // Relative to A4
      const frequency = 440 * Math.pow(2, semitoneOffset / 12);
      
      notes.push({
        name,
        octave: oct,
        full: `${name}${oct}`,
        frequency
      });
    });
  }
  // Add C6 for a complete range ending
  notes.push({ name: 'C', octave: 6, full: 'C6', frequency: 1046.50 });
  return notes;
};

export const ALL_NOTES = generateNotes();

export const CHORDS: ChordType[] = [
  { name: 'Major (大三和弦)', intervals: [0, 4, 7] },
  { name: 'Minor (小三和弦)', intervals: [0, 3, 7] },
  { name: 'Diminished (减三和弦)', intervals: [0, 3, 6] },
];

export const COLORS = {
  primary: 'bg-indigo-600',
  secondary: 'bg-pink-500',
  accent: 'bg-cyan-400',
  keyWhite: 'bg-white',
  keyBlack: 'bg-slate-900',
  activeWhite: 'bg-pink-300',
  activeBlack: 'bg-pink-600',
};
