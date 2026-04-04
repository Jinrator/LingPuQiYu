/**
 * 乐器配置 - 采样 URL 映射
 *
 * 所有采样文件自托管在 public/samples/，确保中国大陆可正常访问。
 *
 * 鼓组采样来源：
 *   - acoustic: Tone.js breakbeat13 (真实录音)
 *   - electronic: oramics TR-808 (经典鼓机采样)
 *
 * 钢琴采样来源：Salamander Grand Piano (CC-BY 3.0)
 */

import { DrumType, DrumKitType } from '../types';

const LOCAL_BASE = '/samples';

// ============ 鼓组采样配置 ============

export interface DrumKitConfig {
  name: string;
  nameZh: string;
  /** 为 null 时表示该鼓组无真实采样，使用纯合成 */
  samples: Record<DrumType, string> | null;
}

export const DRUM_KIT_CONFIGS: Record<DrumKitType, DrumKitConfig> = {
  acoustic: {
    name: 'Acoustic Kit',
    nameZh: '原声鼓组',
    samples: {
      kick:     `${LOCAL_BASE}/drums/acoustic/kick.mp3`,
      snare:    `${LOCAL_BASE}/drums/acoustic/snare.mp3`,
      hihat:    `${LOCAL_BASE}/drums/acoustic/hihat.mp3`,
      openhat:  `${LOCAL_BASE}/drums/acoustic/openhat.mp3`,
      rimshot:  `${LOCAL_BASE}/drums/acoustic/rimshot.mp3`,
      clap:     `${LOCAL_BASE}/drums/acoustic/clap.mp3`,
      lowtom:   `${LOCAL_BASE}/drums/acoustic/lowtom.mp3`,
      midtom:   `${LOCAL_BASE}/drums/acoustic/midtom.mp3`,
      hightom:  `${LOCAL_BASE}/drums/acoustic/hightom.mp3`,
      crash:    `${LOCAL_BASE}/drums/acoustic/crash.mp3`,
      ride:     `${LOCAL_BASE}/drums/acoustic/ride.mp3`,
    },
  },
  electronic: {
    name: 'TR-808',
    nameZh: '电子鼓组 (808)',
    samples: {
      kick:     `${LOCAL_BASE}/drums/electronic/kick.wav`,
      snare:    `${LOCAL_BASE}/drums/electronic/snare.wav`,
      hihat:    `${LOCAL_BASE}/drums/electronic/hihat.wav`,
      openhat:  `${LOCAL_BASE}/drums/electronic/openhat.wav`,
      rimshot:  `${LOCAL_BASE}/drums/electronic/rimshot.wav`,
      clap:     `${LOCAL_BASE}/drums/electronic/clap.wav`,
      lowtom:   `${LOCAL_BASE}/drums/electronic/lowtom.wav`,
      midtom:   `${LOCAL_BASE}/drums/electronic/midtom.wav`,
      hightom:  `${LOCAL_BASE}/drums/electronic/hightom.wav`,
      crash:    `${LOCAL_BASE}/drums/electronic/crash.wav`,
      ride:     `${LOCAL_BASE}/drums/electronic/ride.wav`,
    },
  },

};

// ============ 钢琴采样配置 ============

export const PIANO_SAMPLES: Record<string, string> = {
  C3:    'C3.mp3',
  'D#3': 'Ds3.mp3',
  'F#3': 'Fs3.mp3',
  A3:    'A3.mp3',
  C4:    'C4.mp3',
  'D#4': 'Ds4.mp3',
  'F#4': 'Fs4.mp3',
  A4:    'A4.mp3',
  C5:    'C5.mp3',
  'D#5': 'Ds5.mp3',
  'F#5': 'Fs5.mp3',
  A5:    'A5.mp3',
};

// 钢琴采样源（仅使用本地自托管，不依赖外部 CDN）
export const PIANO_BASE_URLS = [
  `${LOCAL_BASE}/piano/`,
];
