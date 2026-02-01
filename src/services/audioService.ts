
import { Note, DrumType } from '../types';
import * as Tone from 'tone';

class AudioService {
  private audioContext: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private noiseBuffer: AudioBuffer | null = null;
  private piano: Tone.Sampler | null = null;
  private pianoReady: boolean = false;

  constructor() {
    // Initialize on first user interaction
  }

  private init() {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.masterGain = this.audioContext.createGain();
      this.masterGain.gain.value = 0.4; // Master volume
      this.masterGain.connect(this.audioContext.destination);
      this.noiseBuffer = this.createNoiseBuffer();
    }
  }

  private initPiano() {
    if (this.piano) return;
    
    // 使用 Tone.js Sampler 加载真实钢琴采样
    // 使用 tonejs-instruments 的轻量级钢琴采样（只加载关键音符）
    this.piano = new Tone.Sampler({
      urls: {
        C3: "C3.mp3",
        "D#3": "Ds3.mp3",
        "F#3": "Fs3.mp3",
        A3: "A3.mp3",
        C4: "C4.mp3",
        "D#4": "Ds4.mp3",
        "F#4": "Fs4.mp3",
        A4: "A4.mp3",
        C5: "C5.mp3",
        "D#5": "Ds5.mp3",
        "F#5": "Fs5.mp3",
        A5: "A5.mp3",
      },
      release: 1,
      baseUrl: "https://tonejs.github.io/audio/salamander/",
      onload: () => {
        this.pianoReady = true;
        console.log('✅ Piano samples loaded successfully');
      }
    }).toDestination();
    
    console.log('🎹 Piano sampler initializing...');
  }

  private createNoiseBuffer(): AudioBuffer {
    if (!this.audioContext) throw new Error("AudioContext not initialized");
    const bufferSize = this.audioContext.sampleRate * 2; // 2 seconds of noise
    const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    return buffer;
  }

  public async resume() {
    this.init();
    if (this.audioContext?.state === 'suspended') {
      await this.audioContext.resume();
    }
    // 启动 Tone.js
    if (Tone.context.state !== 'running') {
      await Tone.start();
    }
    // 初始化钢琴合成器
    if (!this.piano) {
      this.initPiano();
    }
  }

  // 播放钢琴音色
  public async playPianoNote(note: Note, duration: number = 0.5, velocity: number = 0.8) {
    await this.resume();
    
    // 等待采样加载完成
    if (this.piano && !this.pianoReady) {
      console.log('⏳ Waiting for piano samples to load...');
      await new Promise<void>((resolve) => {
        const checkInterval = setInterval(() => {
          if (this.pianoReady) {
            clearInterval(checkInterval);
            resolve();
          }
        }, 100);
      });
    }
    
    if (this.piano && this.pianoReady) {
      // 使用 Tone.js 播放真实钢琴采样
      this.piano.triggerAttackRelease(note.full, duration, undefined, velocity);
    }
  }

  // 播放钢琴和弦
  public async playPianoChord(notes: Note[], duration: number = 1.0, velocity: number = 0.7) {
    await this.resume();
    
    // 等待采样加载完成
    if (this.piano && !this.pianoReady) {
      console.log('⏳ Waiting for piano samples to load...');
      await new Promise<void>((resolve) => {
        const checkInterval = setInterval(() => {
          if (this.pianoReady) {
            clearInterval(checkInterval);
            resolve();
          }
        }, 100);
      });
    }
    
    if (this.piano && this.pianoReady) {
      notes.forEach(note => {
        this.piano!.triggerAttackRelease(note.full, duration, undefined, velocity);
      });
    }
  }

  public playNote(frequency: number, duration: number = 0.5, type: OscillatorType = 'sine', startTime: number = 0) {
    this.init();
    if (!this.audioContext || !this.masterGain) return;

    const osc = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(frequency, this.audioContext.currentTime + startTime);

    // Envelope
    const now = this.audioContext.currentTime + startTime;
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(0.6, now + 0.02); // Attack
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + duration); // Decay

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

  public playDrum(type: DrumType) {
    this.init();
    if (!this.audioContext || !this.masterGain || !this.noiseBuffer) return;
    const t = this.audioContext.currentTime;

    const playNoise = (filterType: BiquadFilterType, freq: number, decay: number, vol: number = 1) => {
        const src = this.audioContext!.createBufferSource();
        src.buffer = this.noiseBuffer;
        const filter = this.audioContext!.createBiquadFilter();
        const gain = this.audioContext!.createGain();
        
        filter.type = filterType;
        filter.frequency.value = freq;
        
        src.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain!);
        
        gain.gain.setValueAtTime(vol, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + decay);
        
        src.start(t);
        src.stop(t + decay + 0.1);
    };

    const playOsc = (freqStart: number, freqEnd: number, decay: number, type: OscillatorType = 'sine', vol: number = 1) => {
        const osc = this.audioContext!.createOscillator();
        const gain = this.audioContext!.createGain();
        
        osc.type = type;
        osc.frequency.setValueAtTime(freqStart, t);
        osc.frequency.exponentialRampToValueAtTime(freqEnd, t + decay);
        
        gain.gain.setValueAtTime(vol, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + decay);
        
        osc.connect(gain);
        gain.connect(this.masterGain!);
        
        osc.start(t);
        osc.stop(t + decay + 0.1);
    };

    switch (type) {
        case 'kick':
            playOsc(150, 0.01, 0.5, 'sine', 1);
            break;
        case 'snare':
            playNoise('highpass', 1000, 0.2);
            playOsc(180, 100, 0.1, 'triangle', 0.5);
            break;
        case 'rimshot':
            playOsc(800, 100, 0.05, 'square', 0.3);
            playNoise('highpass', 2000, 0.05, 0.2);
            break;
        case 'hihat':
            playNoise('highpass', 5000, 0.05, 0.4);
            break;
        case 'openhat':
            playNoise('highpass', 4000, 0.4, 0.4);
            break;
        case 'clap':
            const noiseSrc = this.audioContext.createBufferSource();
            noiseSrc.buffer = this.noiseBuffer;
            const noiseGain = this.audioContext.createGain();
            const noiseFilter = this.audioContext.createBiquadFilter();
            noiseFilter.type = 'bandpass';
            noiseFilter.frequency.value = 1200;
            noiseSrc.connect(noiseFilter);
            noiseFilter.connect(noiseGain);
            noiseGain.connect(this.masterGain);
            noiseGain.gain.setValueAtTime(0, t);
            noiseGain.gain.linearRampToValueAtTime(0.8, t + 0.01);
            noiseGain.gain.exponentialRampToValueAtTime(0.01, t + 0.15);
            noiseSrc.start(t);
            noiseSrc.stop(t + 0.2);
            break;
        case 'lowtom':
            playOsc(100, 50, 0.3, 'sine', 0.8);
            break;
        case 'midtom':
            playOsc(150, 80, 0.25, 'sine', 0.8);
            break;
        case 'hightom':
            playOsc(200, 100, 0.2, 'sine', 0.8);
            break;
        case 'crash':
            playNoise('lowpass', 15000, 1.5, 0.6); // Long decay
            break;
        case 'ride':
            // Metallic ring
            playNoise('bandpass', 6000, 0.8, 0.4);
            playOsc(5000, 5000, 0.5, 'square', 0.05); // Ringing tone
            break;
    }
  }
}

export const audioService = new AudioService();
