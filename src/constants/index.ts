
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
  phaseKey: string;
  homework: string;
  icon: string;
  titleKey: string;
  homeworkKey: string;
  rewardKey: string;
}

export const ADVENTURE_LEVELS: AdventureLevel[] = [
  { id: 1, category: '初级', phase: '声音实验室', phaseKey: 'adv.phase.soundLab', title: '声音狩猎计划', titleKey: 'adv.l1.title', homework: '捕捉生活中的3种声音并尝试录制，建立初步物理声学认知。', homeworkKey: 'adv.l1.homework', icon: '🏹', unlocked: true, completed: true, reward: '录音机', rewardKey: 'adv.l1.reward' },
  { id: 2, category: '初级', phase: '声音实验室', phaseKey: 'adv.phase.soundLab', title: '律动填色游戏', titleKey: 'adv.l2.title', homework: '在格子中填出一段整齐的"心跳"节拍，理解音乐脉搏。', homeworkKey: 'adv.l2.homework', icon: '🎨', unlocked: true, completed: false, reward: '彩色笔', rewardKey: 'adv.l2.reward' },
  { id: 3, category: '初级', phase: '声音实验室', phaseKey: 'adv.phase.soundLab', title: '节奏乐高工厂', titleKey: 'adv.l3.title', homework: '利用底鼓和军鼓拼接出人生第一条Beat。', homeworkKey: 'adv.l3.homework', icon: '🧱', unlocked: true, completed: false, reward: '节奏模块', rewardKey: 'adv.l3.reward' },
  { id: 4, category: '初级', phase: '情绪调色盘', phaseKey: 'adv.phase.emotionPalette', title: '音高登天梯', titleKey: 'adv.l4.title', homework: '排列一组从低到高的"弹球"音阶，建立音准空间感。', homeworkKey: 'adv.l4.homework', icon: '🪜', unlocked: true, completed: false, reward: '音阶球', rewardKey: 'adv.l4.reward' },
  { id: 5, category: '初级', phase: '情绪调色盘', phaseKey: 'adv.phase.emotionPalette', title: '心情涂鸦板', titleKey: 'adv.l5.title', homework: '感知大/小调差异，创作一段"忧郁蓝"的小调旋律。', homeworkKey: 'adv.l5.homework', icon: '🖍️', unlocked: true, completed: false, reward: '调式盘', rewardKey: 'adv.l5.reward' },
  { id: 6, category: '初级', phase: '情绪调色盘', phaseKey: 'adv.phase.emotionPalette', title: '旋律对对子', titleKey: 'adv.l6.title', homework: '利用镜像工具实现旋律变幻，学习乐句"问答"结构。', homeworkKey: 'adv.l6.homework', icon: '🎭', unlocked: true, completed: false, reward: '镜像镜', rewardKey: 'adv.l6.reward' },
  { id: 7, category: '初级', phase: '情绪调色盘', phaseKey: 'adv.phase.emotionPalette', title: '灵感回溯录', titleKey: 'adv.l7.title', homework: '请使用灵感精灵的"和弦库"哼唱旋律灵感，再使用"灵感回溯"功能回放自己即兴哼唱的"旋律灵感"，上传后将其转化为软件里的正式音符。', homeworkKey: 'adv.l7.homework', icon: '📼', unlocked: true, completed: false, reward: 'AI核心', rewardKey: 'adv.l7.reward' },
  { id: 8, category: '初级', phase: '和声魔法屋', phaseKey: 'adv.phase.harmonyHouse', title: '和弦叠叠乐', titleKey: 'adv.l8.title', homework: '通过"汉堡叠加"逻辑理解三和弦构造，听看见声音厚度。', homeworkKey: 'adv.l8.homework', icon: '🍔', unlocked: true, completed: false, reward: '三和弦', rewardKey: 'adv.l8.reward' },
  { id: 9, category: '初级', phase: '和声魔法屋', phaseKey: 'adv.phase.harmonyHouse', title: '音乐探险路线', titleKey: 'adv.l9.title', homework: '理解和弦的"推动感"，为旋律选择【无敌幸运星】、【甜甜圈派对】或【神秘森林】背景墙。', homeworkKey: 'adv.l9.homework', icon: '🚀', unlocked: true, completed: false, reward: '情绪引擎', rewardKey: 'adv.l9.reward' },
  { id: 10, category: '初级', phase: '和声魔法屋', phaseKey: 'adv.phase.harmonyHouse', title: '风格大变身', titleKey: 'adv.l10.title', homework: '尝试一键切换摇滚、爵士、电子等多元音乐织体。', homeworkKey: 'adv.l10.homework', icon: '🎩', unlocked: true, completed: false, reward: '风格包', rewardKey: 'adv.l10.reward' },
  { id: 11, category: '初级', phase: '创作大拼图', phaseKey: 'adv.phase.composePuzzle', title: '音乐地图册', titleKey: 'adv.l11.title', homework: '拆解"主歌/副歌"结构，用视觉浓淡区分叙事与高潮。', homeworkKey: 'adv.l11.homework', icon: '🗺️', unlocked: true, completed: false, reward: '地图集', rewardKey: 'adv.l11.reward' },
  { id: 12, category: '初级', phase: '创作大拼图', phaseKey: 'adv.phase.composePuzzle', title: '记忆钩子 (Hook)', titleKey: 'adv.l12.title', homework: '在灵感池中筛选核心动机，打造过耳不忘的副歌。', homeworkKey: 'adv.l12.homework', icon: '🪝', unlocked: true, completed: false, reward: '黄金钩', rewardKey: 'adv.l12.reward' },
  { id: 13, category: '初级', phase: '创作大拼图', phaseKey: 'adv.phase.composePuzzle', title: '音乐火车组装', titleKey: 'adv.l13.title', homework: '学习"加花"与"桥段"连接，将散乱积木串联成长曲实战。', homeworkKey: 'adv.l13.homework', icon: '🚂', unlocked: true, completed: false, reward: '大曲谱', rewardKey: 'adv.l13.reward' },
  { id: 14, category: '初级', phase: '制作人舞台', phaseKey: 'adv.phase.producerStage', title: 'AI 录音棚', titleKey: 'adv.l14.title', homework: '请在灵感精灵录制个人声轨，再将音频上传到这进行大师级后期处理。', homeworkKey: 'adv.l14.homework', icon: '🎙️', unlocked: true, completed: false, reward: '混音台', rewardKey: 'adv.l14.reward' },
  { id: 15, category: '初级', phase: '制作人舞台', phaseKey: 'adv.phase.producerStage', title: '个人首单发布', titleKey: 'adv.l15.title', homework: '使用AI封面绘图工具，根据音乐情绪生成专辑封面，并举办线上发布会。', homeworkKey: 'adv.l15.homework', icon: '🏆', unlocked: true, completed: false, reward: '传奇勋章', rewardKey: 'adv.l15.reward' },
];

export const TIMELINE_SECTIONS = [
  { label: '站台 A: 前奏', color: 'bg-blue-600', width: '25%' },
  { label: '站台 B: 主歌', color: 'bg-sky-500', width: '50%' },
  { label: '站台 C: 副歌', color: 'bg-white text-blue-900', width: '25%' },
];


import { Note, NoteName, ChordType } from '../types';

export const NOTE_NAMES: NoteName[] = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

export const SOLFEGE_MAP: Record<string, string> = {
  'C': 'Do', 'C#': 'Di', 'D': 'Re', 'D#': 'Ri', 'E': 'Mi', 'F': 'Fa',
  'F#': 'Fi', 'G': 'Sol', 'G#': 'Si', 'A': 'La', 'A#': 'Li', 'B': 'Ti'
};

export const NUMBERED_NOTATION_MAP: Record<string, string> = {
  'C': '1', 'C#': '1♯', 'D': '2', 'D#': '2♯', 'E': '3', 'F': '4',
  'F#': '4♯', 'G': '5', 'G#': '5♯', 'A': '6', 'A#': '6♯', 'B': '7'
};

// Generate notes for 3 octaves (C3 to C6)
export const generateNotes = (): Note[] => {
  const notes: Note[] = [];
  const startOctave = 3;
  const endOctave = 5;

  for (let oct = startOctave; oct <= endOctave; oct++) {
    NOTE_NAMES.forEach((name, index) => {
      const semitoneOffset = (oct - 4) * 12 + index - 9;
      const frequency = 440 * Math.pow(2, semitoneOffset / 12);
      notes.push({ name, octave: oct, full: `${name}${oct}`, frequency });
    });
  }
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
