/**
 * 高品质鼓组合成器
 * 
 * 当真实采样文件不可用时，使用 Web Audio API 合成逼真的鼓组音色。
 * 每种鼓件通过多层振荡器、噪声、滤波器和包络精心调制。
 */

import { DrumType, DrumKitType } from '../types';

type SynthFn = (ctx: AudioContext, dest: AudioNode) => void;

// 工具函数：创建噪声 buffer
function createNoiseBuffer(ctx: AudioContext, duration: number = 2): AudioBuffer {
  const len = ctx.sampleRate * duration;
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
  return buf;
}

// 缓存噪声 buffer
let _noiseCache: AudioBuffer | null = null;
function getNoise(ctx: AudioContext): AudioBuffer {
  if (!_noiseCache) _noiseCache = createNoiseBuffer(ctx);
  return _noiseCache;
}

// ============ 原声鼓组合成 ============

const acousticSynths: Record<DrumType, SynthFn> = {
  kick(ctx, dest) {
    const t = ctx.currentTime;
    // 低频正弦波 + 短促的高频 click
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(160, t);
    osc.frequency.exponentialRampToValueAtTime(40, t + 0.12);
    gain.gain.setValueAtTime(1, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
    osc.connect(gain).connect(dest);
    osc.start(t);
    osc.stop(t + 0.55);

    // Click 层
    const click = ctx.createOscillator();
    const clickGain = ctx.createGain();
    click.type = 'triangle';
    click.frequency.setValueAtTime(4000, t);
    click.frequency.exponentialRampToValueAtTime(100, t + 0.02);
    clickGain.gain.setValueAtTime(0.6, t);
    clickGain.gain.exponentialRampToValueAtTime(0.001, t + 0.03);
    click.connect(clickGain).connect(dest);
    click.start(t);
    click.stop(t + 0.05);
  },

  snare(ctx, dest) {
    const t = ctx.currentTime;
    // 噪声层（响弦）
    const noiseSrc = ctx.createBufferSource();
    noiseSrc.buffer = getNoise(ctx);
    const noiseFilter = ctx.createBiquadFilter();
    noiseFilter.type = 'highpass';
    noiseFilter.frequency.value = 2000;
    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.7, t);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
    noiseSrc.connect(noiseFilter).connect(noiseGain).connect(dest);
    noiseSrc.start(t);
    noiseSrc.stop(t + 0.25);

    // 音调层
    const osc = ctx.createOscillator();
    const oscGain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(200, t);
    osc.frequency.exponentialRampToValueAtTime(120, t + 0.05);
    oscGain.gain.setValueAtTime(0.7, t);
    oscGain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
    osc.connect(oscGain).connect(dest);
    osc.start(t);
    osc.stop(t + 0.15);
  },

  hihat(ctx, dest) {
    const t = ctx.currentTime;
    const src = ctx.createBufferSource();
    src.buffer = getNoise(ctx);
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = 10000;
    bp.Q.value = 1;
    const hp = ctx.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = 7000;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.4, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.06);
    src.connect(bp).connect(hp).connect(gain).connect(dest);
    src.start(t);
    src.stop(t + 0.08);
  },

  openhat(ctx, dest) {
    const t = ctx.currentTime;
    const src = ctx.createBufferSource();
    src.buffer = getNoise(ctx);
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = 10000;
    bp.Q.value = 1;
    const hp = ctx.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = 6000;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.4, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
    src.connect(bp).connect(hp).connect(gain).connect(dest);
    src.start(t);
    src.stop(t + 0.45);
  },

  rimshot(ctx, dest) {
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(800, t);
    osc.frequency.exponentialRampToValueAtTime(200, t + 0.03);
    gain.gain.setValueAtTime(0.4, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
    osc.connect(gain).connect(dest);
    osc.start(t);
    osc.stop(t + 0.06);

    const src = ctx.createBufferSource();
    src.buffer = getNoise(ctx);
    const hp = ctx.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = 3000;
    const nGain = ctx.createGain();
    nGain.gain.setValueAtTime(0.3, t);
    nGain.gain.exponentialRampToValueAtTime(0.001, t + 0.04);
    src.connect(hp).connect(nGain).connect(dest);
    src.start(t);
    src.stop(t + 0.06);
  },

  clap(ctx, dest) {
    const t = ctx.currentTime;
    // 多次短促噪声模拟拍手
    for (let i = 0; i < 3; i++) {
      const src = ctx.createBufferSource();
      src.buffer = getNoise(ctx);
      const bp = ctx.createBiquadFilter();
      bp.type = 'bandpass';
      bp.frequency.value = 1200;
      bp.Q.value = 2;
      const gain = ctx.createGain();
      const offset = i * 0.008;
      gain.gain.setValueAtTime(0, t + offset);
      gain.gain.linearRampToValueAtTime(0.8, t + offset + 0.005);
      gain.gain.exponentialRampToValueAtTime(0.001, t + offset + 0.03);
      src.connect(bp).connect(gain).connect(dest);
      src.start(t + offset);
      src.stop(t + offset + 0.04);
    }
    // 尾部噪声
    const tail = ctx.createBufferSource();
    tail.buffer = getNoise(ctx);
    const tailBp = ctx.createBiquadFilter();
    tailBp.type = 'bandpass';
    tailBp.frequency.value = 1200;
    const tailGain = ctx.createGain();
    tailGain.gain.setValueAtTime(0.6, t + 0.025);
    tailGain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
    tail.connect(tailBp).connect(tailGain).connect(dest);
    tail.start(t + 0.025);
    tail.stop(t + 0.2);
  },

  lowtom(ctx, dest) {
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(120, t);
    osc.frequency.exponentialRampToValueAtTime(60, t + 0.15);
    gain.gain.setValueAtTime(0.8, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
    osc.connect(gain).connect(dest);
    osc.start(t);
    osc.stop(t + 0.4);
  },

  midtom(ctx, dest) {
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(170, t);
    osc.frequency.exponentialRampToValueAtTime(90, t + 0.12);
    gain.gain.setValueAtTime(0.8, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
    osc.connect(gain).connect(dest);
    osc.start(t);
    osc.stop(t + 0.35);
  },

  hightom(ctx, dest) {
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(230, t);
    osc.frequency.exponentialRampToValueAtTime(120, t + 0.1);
    gain.gain.setValueAtTime(0.8, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
    osc.connect(gain).connect(dest);
    osc.start(t);
    osc.stop(t + 0.3);
  },

  crash(ctx, dest) {
    const t = ctx.currentTime;
    const src = ctx.createBufferSource();
    src.buffer = getNoise(ctx);
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 15000;
    const hp = ctx.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = 3000;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.6, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 1.5);
    src.connect(lp).connect(hp).connect(gain).connect(dest);
    src.start(t);
    src.stop(t + 1.6);
  },

  ride(ctx, dest) {
    const t = ctx.currentTime;
    const src = ctx.createBufferSource();
    src.buffer = getNoise(ctx);
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = 8000;
    bp.Q.value = 2;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.35, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.8);
    src.connect(bp).connect(gain).connect(dest);
    src.start(t);
    src.stop(t + 0.85);

    // 金属泛音
    const osc = ctx.createOscillator();
    const oscGain = ctx.createGain();
    osc.type = 'square';
    osc.frequency.value = 5500;
    oscGain.gain.setValueAtTime(0.04, t);
    oscGain.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
    osc.connect(oscGain).connect(dest);
    osc.start(t);
    osc.stop(t + 0.55);
  },
};


// ============ 电子鼓组合成 (808 风格) ============

const electronicSynths: Record<DrumType, SynthFn> = {
  kick(ctx, dest) {
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(300, t);
    osc.frequency.exponentialRampToValueAtTime(30, t + 0.15);
    gain.gain.setValueAtTime(1, t);
    gain.gain.linearRampToValueAtTime(0.8, t + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.8);
    osc.connect(gain).connect(dest);
    osc.start(t);
    osc.stop(t + 0.85);
  },

  snare(ctx, dest) {
    const t = ctx.currentTime;
    // 808 snare: 音调 + 噪声
    const osc = ctx.createOscillator();
    const oscGain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(180, t);
    osc.frequency.exponentialRampToValueAtTime(80, t + 0.08);
    oscGain.gain.setValueAtTime(0.8, t);
    oscGain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
    osc.connect(oscGain).connect(dest);
    osc.start(t);
    osc.stop(t + 0.2);

    const src = ctx.createBufferSource();
    src.buffer = getNoise(ctx);
    const hp = ctx.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = 3000;
    const nGain = ctx.createGain();
    nGain.gain.setValueAtTime(0.5, t);
    nGain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
    src.connect(hp).connect(nGain).connect(dest);
    src.start(t);
    src.stop(t + 0.3);
  },

  hihat(ctx, dest) {
    const t = ctx.currentTime;
    // 808 hihat: 6个方波叠加
    const freqs = [800, 1000, 1500, 3000, 5300, 8000];
    freqs.forEach(f => {
      const osc = ctx.createOscillator();
      osc.type = 'square';
      osc.frequency.value = f;
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.06, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
      const hp = ctx.createBiquadFilter();
      hp.type = 'highpass';
      hp.frequency.value = 7000;
      osc.connect(gain).connect(hp).connect(dest);
      osc.start(t);
      osc.stop(t + 0.06);
    });
  },

  openhat(ctx, dest) {
    const t = ctx.currentTime;
    const freqs = [800, 1000, 1500, 3000, 5300, 8000];
    freqs.forEach(f => {
      const osc = ctx.createOscillator();
      osc.type = 'square';
      osc.frequency.value = f;
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.06, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
      const hp = ctx.createBiquadFilter();
      hp.type = 'highpass';
      hp.frequency.value = 7000;
      osc.connect(gain).connect(hp).connect(dest);
      osc.start(t);
      osc.stop(t + 0.4);
    });
  },

  rimshot(ctx, dest) {
    acousticSynths.rimshot(ctx, dest);
  },

  clap(ctx, dest) {
    const t = ctx.currentTime;
    // 808 clap: 多层噪声
    for (let i = 0; i < 4; i++) {
      const src = ctx.createBufferSource();
      src.buffer = getNoise(ctx);
      const bp = ctx.createBiquadFilter();
      bp.type = 'bandpass';
      bp.frequency.value = 1500;
      bp.Q.value = 3;
      const gain = ctx.createGain();
      const offset = i * 0.01;
      gain.gain.setValueAtTime(0, t + offset);
      gain.gain.linearRampToValueAtTime(0.9, t + offset + 0.003);
      gain.gain.exponentialRampToValueAtTime(0.001, t + offset + 0.02);
      src.connect(bp).connect(gain).connect(dest);
      src.start(t + offset);
      src.stop(t + offset + 0.03);
    }
    const tail = ctx.createBufferSource();
    tail.buffer = getNoise(ctx);
    const tailBp = ctx.createBiquadFilter();
    tailBp.type = 'bandpass';
    tailBp.frequency.value = 1500;
    tailBp.Q.value = 2;
    const tailGain = ctx.createGain();
    tailGain.gain.setValueAtTime(0.7, t + 0.04);
    tailGain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
    tail.connect(tailBp).connect(tailGain).connect(dest);
    tail.start(t + 0.04);
    tail.stop(t + 0.25);
  },

  lowtom(ctx, dest) {
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(200, t);
    osc.frequency.exponentialRampToValueAtTime(50, t + 0.2);
    gain.gain.setValueAtTime(0.9, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
    osc.connect(gain).connect(dest);
    osc.start(t);
    osc.stop(t + 0.55);
  },

  midtom(ctx, dest) {
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(280, t);
    osc.frequency.exponentialRampToValueAtTime(80, t + 0.15);
    gain.gain.setValueAtTime(0.9, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
    osc.connect(gain).connect(dest);
    osc.start(t);
    osc.stop(t + 0.45);
  },

  hightom(ctx, dest) {
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(380, t);
    osc.frequency.exponentialRampToValueAtTime(120, t + 0.12);
    gain.gain.setValueAtTime(0.9, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
    osc.connect(gain).connect(dest);
    osc.start(t);
    osc.stop(t + 0.35);
  },

  crash(ctx, dest) {
    acousticSynths.crash(ctx, dest);
  },

  ride(ctx, dest) {
    acousticSynths.ride(ctx, dest);
  },
};

// ============ 导出 ============

const SYNTH_MAP: Record<DrumKitType, Record<DrumType, SynthFn>> = {
  acoustic: acousticSynths,
  electronic: electronicSynths,
};

/**
 * 使用合成器播放鼓声（当采样文件不可用时的回退方案）
 */
export function synthDrum(
  ctx: AudioContext,
  dest: AudioNode,
  kit: DrumKitType,
  type: DrumType
): void {
  const synths = SYNTH_MAP[kit] || SYNTH_MAP.acoustic;
  const fn = synths[type];
  if (fn) fn(ctx, dest);
}
