import { Note, NoteName } from '../types';
import { ALL_NOTES, NOTE_NAMES } from '../constants';

export interface DetectedNote {
  note: Note;
  startTime: number;
  endTime: number;
  duration: number;
  velocity: number;
  confidence: number;
  midiNumber: number;
}

export interface PitchDetectionResult {
  notes: DetectedNote[];
  duration: number;
  bpm: number;
  timeSignature: [number, number];
}

interface PitchFrame {
  time: number;
  frequency: number;
  probability: number;
  rms: number;
}

class PitchDetectionService {
  private audioContext: AudioContext | null = null;

  private async initAudioContext(): Promise<AudioContext> {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
    }
    return this.audioContext;
  }

  async analyzeAudio(audioUrl: string, onProgress?: (progress: number) => void): Promise<PitchDetectionResult> {
    const ctx = await this.initAudioContext();
    
    onProgress?.(Math.round(5));
    
    const response = await fetch(audioUrl);
    const arrayBuffer = await response.arrayBuffer();
    const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
    
    onProgress?.(Math.round(15));
    
    let channelData = audioBuffer.getChannelData(0);
    if (audioBuffer.numberOfChannels > 1) {
      const rightChannel = audioBuffer.getChannelData(1);
      const mixed = new Float32Array(channelData.length);
      for (let i = 0; i < channelData.length; i++) {
        mixed[i] = (channelData[i] + rightChannel[i]) / 2;
      }
      channelData = mixed;
    }
    
    const sampleRate = audioBuffer.sampleRate;
    const duration = audioBuffer.duration;
    
    console.log('Audio info:', {
      duration,
      sampleRate,
      samples: channelData.length,
      channels: audioBuffer.numberOfChannels
    });
    
    const pitchTrack = this.computeYINPitchTrack(channelData, sampleRate, onProgress);
    console.log('Pitch track frames:', pitchTrack.length);
    
    const notes = this.detectNotesFromPitchTrack(pitchTrack, sampleRate);
    console.log('Detected notes before refinement:', notes.length);
    
    const refinedNotes = this.refineNotes(notes);
    console.log('Refined notes:', refinedNotes.length);
    
    const bpm = this.estimateTempo(refinedNotes);
    console.log('Estimated tempo:', bpm);
    
    onProgress?.(Math.round(100));
    
    return {
      notes: refinedNotes,
      duration,
      bpm,
      timeSignature: [4, 4]
    };
  }

  private computeYINPitchTrack(
    audioData: Float32Array,
    sampleRate: number,
    onProgress?: (progress: number) => void
  ): PitchFrame[] {
    const frameSize = 2048;
    const hopSize = 256;
    const threshold = 0.12;
    const minFreq = 50;
    const maxFreq = 2000;
    
    const minTau = Math.floor(sampleRate / maxFreq);
    const maxTau = Math.min(Math.floor(sampleRate / minFreq), frameSize / 2);
    
    const frames: PitchFrame[] = [];
    const totalFrames = Math.floor((audioData.length - frameSize) / hopSize);
    
    for (let i = 0; i < totalFrames; i++) {
      const startSample = i * hopSize;
      const time = startSample / sampleRate;
      
      const frame = audioData.slice(startSample, startSample + frameSize);
      
      const rms = Math.sqrt(frame.reduce((sum, s) => sum + s * s, 0) / frame.length);
      
      if (rms < 0.008) {
        frames.push({
          time,
          frequency: 0,
          probability: 0,
          rms
        });
        continue;
      }
      
      const yinBuffer = new Float32Array(maxTau + 1);
      yinBuffer[0] = 1;
      
      for (let tau = 1; tau <= maxTau; tau++) {
        let sum = 0;
        for (let j = 0; j < frameSize / 2; j++) {
          const delta = frame[j] - frame[j + tau];
          sum += delta * delta;
        }
        yinBuffer[tau] = sum;
      }
      
      let runningSum = 0;
      for (let tau = 1; tau <= maxTau; tau++) {
        runningSum += yinBuffer[tau];
        yinBuffer[tau] = yinBuffer[tau] * tau / runningSum;
      }
      
      let tauEstimate = -1;
      for (let tau = minTau; tau <= maxTau; tau++) {
        if (yinBuffer[tau] < threshold) {
          while (tau + 1 <= maxTau && yinBuffer[tau + 1] < yinBuffer[tau]) {
            tau++;
          }
          tauEstimate = tau;
          break;
        }
      }
      
      let frequency = 0;
      let probability = 0;
      
      if (tauEstimate !== -1) {
        const betterTau = this.parabolicInterpolation(yinBuffer, tauEstimate);
        frequency = sampleRate / betterTau;
        probability = 1 - yinBuffer[tauEstimate];
      }
      
      frames.push({
        time,
        frequency,
        probability,
        rms
      });
      
      if (onProgress && i % 100 === 0) {
        const progress = Math.round(15 + (i / totalFrames) * 75);
        onProgress(progress);
      }
    }
    
    return frames;
  }

  private parabolicInterpolation(yinBuffer: Float32Array, tau: number): number {
    if (tau === 0 || tau === yinBuffer.length - 1) return tau;
    
    const s0 = yinBuffer[tau - 1];
    const s1 = yinBuffer[tau];
    const s2 = yinBuffer[tau + 1];
    
    const denominator = 2 * s1 - s2 - s0;
    if (Math.abs(denominator) < 0.0001) return tau;
    
    const adjustment = (s2 - s0) / (2 * denominator);
    
    if (Math.abs(adjustment) > 1) return tau;
    
    return tau + adjustment;
  }

  private detectNotesFromPitchTrack(pitchTrack: PitchFrame[], sampleRate: number): DetectedNote[] {
    if (pitchTrack.length === 0) return [];
    
    const hopSize = 256;
    const hopTime = hopSize / sampleRate;
    const minNoteDuration = 0.04;
    const probabilityThreshold = 0.45;
    
    const smoothedPitchTrack = this.smoothPitchTrack(pitchTrack);
    
    const notes: DetectedNote[] = [];
    let currentNote: {
      startTime: number;
      midiNumber: number;
      probabilities: number[];
      rmsValues: number[];
      lastFrameIndex: number;
    } | null = null;
    
    const midiTolerance = 0.3;
    const rmsDropThreshold = 0.4;
    
    for (let i = 0; i < smoothedPitchTrack.length; i++) {
      const frame = smoothedPitchTrack[i];
      
      if (frame.frequency > 0 && frame.probability > probabilityThreshold) {
        const midiNumber = this.frequencyToMidi(frame.frequency);
        const roundedMidi = Math.round(midiNumber);
        
        if (roundedMidi < 21 || roundedMidi > 108) {
          if (currentNote) {
            this.finalizeNote(currentNote, notes, hopTime, minNoteDuration);
            currentNote = null;
          }
          continue;
        }
        
        if (currentNote === null) {
          currentNote = {
            startTime: frame.time,
            midiNumber: roundedMidi,
            probabilities: [frame.probability],
            rmsValues: [frame.rms],
            lastFrameIndex: i
          };
        } else {
          const avgRms = currentNote.rmsValues.reduce((a, b) => a + b, 0) / currentNote.rmsValues.length;
          const rmsRatio = frame.rms / avgRms;
          
          const isPitchChange = Math.abs(roundedMidi - currentNote.midiNumber) > midiTolerance;
          const isSignificantRmsDrop = rmsRatio < rmsDropThreshold && currentNote.rmsValues.length > 2;
          const isRmsRecovery = rmsRatio > 1.5 && currentNote.rmsValues.length > 2;
          
          if (isPitchChange || isSignificantRmsDrop || isRmsRecovery) {
            this.finalizeNote(currentNote, notes, hopTime, minNoteDuration);
            currentNote = {
              startTime: frame.time,
              midiNumber: roundedMidi,
              probabilities: [frame.probability],
              rmsValues: [frame.rms],
              lastFrameIndex: i
            };
          } else {
            currentNote.probabilities.push(frame.probability);
            currentNote.rmsValues.push(frame.rms);
            currentNote.lastFrameIndex = i;
          }
        }
      } else {
        if (currentNote) {
          this.finalizeNote(currentNote, notes, hopTime, minNoteDuration);
          currentNote = null;
        }
      }
    }
    
    if (currentNote) {
      this.finalizeNote(currentNote, notes, hopTime, minNoteDuration);
    }
    
    return notes;
  }

  private smoothPitchTrack(pitchTrack: PitchFrame[]): PitchFrame[] {
    const smoothed: PitchFrame[] = [];
    const windowSize = 3;
    
    for (let i = 0; i < pitchTrack.length; i++) {
      const start = Math.max(0, i - windowSize);
      const end = Math.min(pitchTrack.length, i + windowSize + 1);
      
      let validFrames = 0;
      let freqSum = 0;
      let probSum = 0;
      let rmsSum = 0;
      
      for (let j = start; j < end; j++) {
        if (pitchTrack[j].frequency > 0) {
          freqSum += pitchTrack[j].frequency;
          probSum += pitchTrack[j].probability;
          rmsSum += pitchTrack[j].rms;
          validFrames++;
        }
      }
      
      if (validFrames >= 2 && pitchTrack[i].frequency > 0) {
        const avgFreq = freqSum / validFrames;
        const currentMidi = this.frequencyToMidi(pitchTrack[i].frequency);
        const avgMidi = this.frequencyToMidi(avgFreq);
        
        if (Math.abs(currentMidi - avgMidi) < 1) {
          smoothed.push({
            ...pitchTrack[i],
            frequency: avgFreq,
            probability: probSum / validFrames,
            rms: rmsSum / validFrames
          });
        } else {
          smoothed.push(pitchTrack[i]);
        }
      } else {
        smoothed.push(pitchTrack[i]);
      }
    }
    
    return smoothed;
  }

  private finalizeNote(
    currentNote: {
      startTime: number;
      midiNumber: number;
      probabilities: number[];
      rmsValues: number[];
      lastFrameIndex: number;
    },
    notes: DetectedNote[],
    hopTime: number,
    minNoteDuration: number
  ): void {
    const duration = currentNote.probabilities.length * hopTime;
    
    if (duration < minNoteDuration) return;
    
    const avgProbability = currentNote.probabilities.reduce((a, b) => a + b, 0) / currentNote.probabilities.length;
    const avgRms = currentNote.rmsValues.reduce((a, b) => a + b, 0) / currentNote.rmsValues.length;
    
    const velocity = Math.min(127, Math.round((avgRms / 0.25) * 100));
    
    const note = this.midiToNote(currentNote.midiNumber);
    
    notes.push({
      note,
      startTime: currentNote.startTime,
      endTime: currentNote.startTime + duration,
      duration,
      velocity: Math.max(20, velocity),
      midiNumber: currentNote.midiNumber,
      confidence: avgProbability
    });
  }

  private frequencyToMidi(freq: number): number {
    if (freq <= 0) return 0;
    return 12 * Math.log2(freq / 440) + 69;
  }

  private midiToNote(midi: number): Note {
    const NOTE_NAMES: NoteName[] = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const octave = Math.floor(midi / 12) - 1;
    const noteIndex = Math.round(midi) % 12;
    const name = NOTE_NAMES[noteIndex < 0 ? noteIndex + 12 : noteIndex];
    const full = `${name}${octave}`;
    const frequency = 440 * Math.pow(2, (midi - 69) / 12);
    
    const existingNote = ALL_NOTES.find(n => n.name === name && n.octave === octave);
    if (existingNote) return existingNote;
    
    return { name, octave, full, frequency };
  }

  private refineNotes(notes: DetectedNote[]): DetectedNote[] {
    if (notes.length === 0) return [];
    
    const sortedNotes = [...notes].sort((a, b) => a.startTime - b.startTime);
    
    const refined: DetectedNote[] = [];
    
    for (const note of sortedNotes) {
      const lastNote = refined[refined.length - 1];
      
      if (lastNote && 
          lastNote.midiNumber === note.midiNumber &&
          note.startTime - lastNote.endTime < 0.03) {
        lastNote.endTime = note.endTime;
        lastNote.duration = lastNote.endTime - lastNote.startTime;
        lastNote.confidence = (lastNote.confidence + note.confidence) / 2;
        lastNote.velocity = Math.max(lastNote.velocity, note.velocity);
      } else {
        refined.push({ ...note });
      }
    }
    
    const filtered = refined.filter(note => note.duration >= 0.06 && note.confidence > 0.25);
    
    return filtered;
  }

  private estimateTempo(notes: DetectedNote[]): number {
    if (notes.length < 4) return 120;
    
    const onsets = notes.map(n => n.startTime).sort((a, b) => a - b);
    const intervals: number[] = [];
    
    for (let i = 1; i < onsets.length; i++) {
      const interval = onsets[i] - onsets[i - 1];
      if (interval > 0.1 && interval < 2) {
        intervals.push(interval);
      }
    }
    
    if (intervals.length === 0) return 120;
    
    const bpmCandidates: number[] = [];
    for (const interval of intervals) {
      let bpm = 60 / interval;
      while (bpm < 60) bpm *= 2;
      while (bpm > 200) bpm /= 2;
      bpmCandidates.push(bpm);
    }
    
    bpmCandidates.sort((a, b) => a - b);
    
    const median = bpmCandidates[Math.floor(bpmCandidates.length / 2)];
    
    return Math.round(median / 5) * 5;
  }
}

export const pitchDetectionService = new PitchDetectionService();
