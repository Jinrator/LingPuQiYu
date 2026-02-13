/**
 * 音频服务 - 统一乐器管理
 *
 * 支持：
 * - 钢琴（Tone.Sampler，真实采样）
 * - 鼓组（Tone.Players 真实采样 + Web Audio 合成回退）
 *   - 原声鼓组 / 电子鼓组(808) / 中国打击乐
 *
 * 采样文件自托管在 public/samples/，确保中国大陆可正常访问。
 */

import { Note, DrumType, DrumKitType } from '../types';
import * as Tone from 'tone';
import {
  DRUM_KIT_CONFIGS,
  PIANO_SAMPLES,
  PIANO_BASE_URLS,
} from './instrumentConfig';
import { synthDrum } from './drumSynthesizer';

class AudioService {
  private audioContext: AudioContext | null = null;
  private masterGain: GainNode | null = null;

  // 钢琴
  private piano: Tone.Sampler | null = null;
  private pianoReady = false;

  // 鼓组
  private currentDrumKit: DrumKitType = 'acoustic';
  private drumPlayers: Map<DrumKitType, Tone.Players> = new Map();
  private drumPlayersReady: Map<DrumKitType, boolean> = new Map();
  private drumSamplesFailed: Map<DrumKitType, boolean> = new Map();

  constructor() {}

  // ============ 初始化 ============

  private init() {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.masterGain = this.audioContext.createGain();
      this.masterGain.gain.value = 0.4;
      this.masterGain.connect(this.audioContext.destination);
    }
  }

  public async resume() {
    this.init();
    if (this.audioContext?.state === 'suspended') {
      await this.audioContext.resume();
    }
    if (Tone.getContext().state !== 'running') {
      await Tone.start();
    }
    if (!this.piano) this.initPiano();
    if (!this.drumPlayers.has(this.currentDrumKit)) {
      this.initDrumKit(this.currentDrumKit);
    }
  }

  // ============ 钢琴 ============

  private initPiano() {
    if (this.piano) return;

    const tryLoad = (urlIndex: number) => {
      if (urlIndex >= PIANO_BASE_URLS.length) {
        console.warn('⚠️ 所有钢琴采样源均不可用');
        this.pianoReady = true;
        return;
      }

      const baseUrl = PIANO_BASE_URLS[urlIndex];
      this.piano = new Tone.Sampler({
        urls: PIANO_SAMPLES,
        release: 1,
        baseUrl,
        onload: () => {
          this.pianoReady = true;
          console.log(`✅ 钢琴采样加载成功 (源: ${baseUrl})`);
        },
        onerror: () => {
          console.warn(`⚠️ 钢琴采样源不可用: ${baseUrl}，尝试下一个...`);
          this.piano?.dispose();
          this.piano = null;
          tryLoad(urlIndex + 1);
        },
      }).toDestination();
    };

    tryLoad(0);
    console.log('🎹 钢琴采样初始化中...');
  }

  private async waitForPiano(): Promise<void> {
    if (this.pianoReady) return;
    return new Promise((resolve) => {
      const check = setInterval(() => {
        if (this.pianoReady) { clearInterval(check); resolve(); }
      }, 100);
      setTimeout(() => { clearInterval(check); this.pianoReady = true; resolve(); }, 10000);
    });
  }

  public async playPianoNote(note: Note, duration: number = 0.5, velocity: number = 0.8) {
    await this.resume();
    await this.waitForPiano();
    if (this.piano) {
      this.piano.triggerAttackRelease(note.full, duration, undefined, velocity);
    }
  }

  public async playPianoChord(notes: Note[], duration: number = 1.0, velocity: number = 0.7) {
    await this.resume();
    await this.waitForPiano();
    if (this.piano) {
      notes.forEach(note => {
        this.piano!.triggerAttackRelease(note.full, duration, undefined, velocity);
      });
    }
  }

  // ============ 鼓组 ============

  private initDrumKit(kit: DrumKitType) {
    if (this.drumPlayers.has(kit) || this.drumPlayersReady.get(kit)) return;

    const config = DRUM_KIT_CONFIGS[kit];
    if (!config) return;

    if (!config.samples) {
      this.drumSamplesFailed.set(kit, true);
      this.drumPlayersReady.set(kit, true);
      console.log(`🎵 ${config.nameZh}：使用合成音色`);
      return;
    }

    const urls: Record<string, string> = {};
    for (const [type, url] of Object.entries(config.samples)) {
      urls[type] = url;
    }

    try {
      const players = new Tone.Players(urls, {
        onload: () => {
          this.drumPlayersReady.set(kit, true);
          console.log(`✅ 鼓组采样加载成功: ${config.nameZh}`);
        },
        onerror: () => {
          console.warn(`⚠️ 鼓组采样加载失败: ${config.nameZh}，将使用合成音色`);
          this.drumSamplesFailed.set(kit, true);
          this.drumPlayersReady.set(kit, true);
        },
      }).toDestination();
      this.drumPlayers.set(kit, players);
    } catch {
      console.warn(`⚠️ 鼓组初始化异常: ${config.nameZh}，将使用合成音色`);
      this.drumSamplesFailed.set(kit, true);
      this.drumPlayersReady.set(kit, true);
    }
  }

  public switchDrumKit(kit: DrumKitType) {
    this.currentDrumKit = kit;
    if (!this.drumPlayers.has(kit)) this.initDrumKit(kit);
    console.log(`🥁 切换鼓组: ${DRUM_KIT_CONFIGS[kit]?.nameZh || kit}`);
  }

  public getCurrentDrumKit(): DrumKitType {
    return this.currentDrumKit;
  }

  public getAvailableDrumKits(): { type: DrumKitType; name: string; nameZh: string }[] {
    return Object.entries(DRUM_KIT_CONFIGS).map(([type, config]) => ({
      type: type as DrumKitType,
      name: config.name,
      nameZh: config.nameZh,
    }));
  }

  public playDrum(type: DrumType) {
    this.init();
    const kit = this.currentDrumKit;
    const players = this.drumPlayers.get(kit);
    const isReady = this.drumPlayersReady.get(kit);
    const hasFailed = this.drumSamplesFailed.get(kit);

    if (players && isReady && !hasFailed) {
      try {
        if (players.has(type)) {
          const player = players.player(type);
          if (player.state === 'started') player.stop();
          player.start();
          return;
        }
      } catch {
        // 采样播放失败，回退到合成
      }
    }

    if (this.audioContext && this.masterGain) {
      synthDrum(this.audioContext, this.masterGain, kit, type);
    }
  }

  // ============ 通用合成音色（向后兼容） ============

  public playNote(frequency: number, duration: number = 0.5, type: OscillatorType = 'sine', startTime: number = 0) {
    this.init();
    if (!this.audioContext || !this.masterGain) return;

    const osc = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(frequency, this.audioContext.currentTime + startTime);

    const now = this.audioContext.currentTime + startTime;
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(0.6, now + 0.02);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + duration);

    osc.connect(gainNode);
    gainNode.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + duration + 0.1);
  }

  public playChord(notes: Note[], duration: number = 1.0) {
    notes.forEach(note => {
      this.playNote(note.frequency, duration, 'triangle');
    });
  }
}

export const audioService = new AudioService();
