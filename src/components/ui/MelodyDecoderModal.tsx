import React, { useState, useRef, useCallback, useEffect } from 'react';
import { X, Upload, Play, Pause, Wand2, Music2, Sparkles, FileAudio, Trash2, Download, AlertCircle, Volume2, VolumeX, SkipBack, SkipForward, Loader2 } from 'lucide-react';
import { pitchDetectionService, PitchDetectionResult } from '../../services/pitchDetectionService';
import { exportToMidi, downloadMidi } from '../../services/midiExportService';
import { PALETTE } from '../../constants/palette';
import TranscriptionPianoRoll from '../music/TranscriptionPianoRoll';

interface MelodyDecoderModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const MelodyDecoderModal: React.FC<MelodyDecoderModalProps> = ({ isOpen, onClose }) => {
  const [audioFile, setAudioFile] = useState<string | null>(null);
  const [audioFileName, setAudioFileName] = useState<string>('');
  const [isConverting, setIsConverting] = useState(false);
  const [conversionProgress, setConversionProgress] = useState(0);
  const [conversionStatus, setConversionStatus] = useState('');
  const [detectionResult, setDetectionResult] = useState<PitchDetectionResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [audioVolume, setAudioVolume] = useState(0.8);
  const [audioProgress, setAudioProgress] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  
  const audioRef = useRef<HTMLAudioElement>(null);
  const animationRef = useRef<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = audioVolume;
    }
  }, [audioVolume]);

  useEffect(() => {
    if (!isOpen) {
      resetAll();
    }
  }, [isOpen]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (audioFile) {
        URL.revokeObjectURL(audioFile);
      }
      const url = URL.createObjectURL(file);
      setAudioFile(url);
      setAudioFileName(file.name);
      setDetectionResult(null);
      setError(null);
      setConversionProgress(0);
      setIsPlayingAudio(false);
      setAudioProgress(0);
      setCurrentTime(0);
    }
  };

  const toggleAudioPlayback = () => {
    if (!audioRef.current) return;
    
    if (isPlayingAudio) {
      audioRef.current.pause();
      setIsPlayingAudio(false);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
    } else {
      audioRef.current.play();
      setIsPlayingAudio(true);
      updateAudioProgress();
    }
  };

  const updateAudioProgress = () => {
    if (!audioRef.current) return;
    
    const progress = (audioRef.current.currentTime / audioRef.current.duration) * 100;
    setAudioProgress(progress);
    setCurrentTime(audioRef.current.currentTime);
    
    if (isPlayingAudio && progress < 100) {
      animationRef.current = requestAnimationFrame(updateAudioProgress);
    }
  };

  const handleAudioTimeUpdate = () => {
    if (audioRef.current) {
      const progress = (audioRef.current.currentTime / audioRef.current.duration) * 100;
      setAudioProgress(progress);
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleAudioEnded = () => {
    setIsPlayingAudio(false);
    setAudioProgress(100);
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
  };

  const handleAudioLoaded = () => {
    if (audioRef.current) {
      setAudioDuration(audioRef.current.duration);
    }
  };

  const handleAudioSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (audioRef.current) {
      const seekTime = (parseFloat(e.target.value) / 100) * audioRef.current.duration;
      audioRef.current.currentTime = seekTime;
      setAudioProgress(parseFloat(e.target.value));
      setCurrentTime(seekTime);
    }
  };

  const skipBackward = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = Math.max(0, audioRef.current.currentTime - 5);
    }
  };

  const skipForward = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = Math.min(audioRef.current.duration, audioRef.current.currentTime + 5);
    }
  };

  const startConversion = async () => {
    if (!audioFile) return;
    
    setIsConverting(true);
    setConversionProgress(0);
    setError(null);
    setConversionStatus('正在加载音频文件...');
    
    try {
      const result = await pitchDetectionService.analyzeAudio(audioFile, (progress) => {
        setConversionProgress(Math.round(progress));
        if (progress < 20) {
          setConversionStatus('正在解码音频...');
        } else if (progress < 90) {
          setConversionStatus('正在使用 YIN 算法分析音高...');
        } else {
          setConversionStatus('正在量化音符...');
        }
      });
      
      setDetectionResult(result);
      setConversionStatus(`完成！检测到 ${result.notes.length} 个音符`);
      setConversionProgress(100);
    } catch (err) {
      console.error('转换失败:', err);
      setError(err instanceof Error ? err.message : '音频分析失败，请重试');
    } finally {
      setIsConverting(false);
    }
  };

  const handleExportMidi = () => {
    if (!detectionResult) return;
    
    const midiBlob = exportToMidi(detectionResult.notes, { bpm: detectionResult.bpm });
    const timestamp = new Date().toISOString().slice(0, 10);
    const baseName = audioFileName.replace(/\.[^/.]+$/, '') || 'melody';
    downloadMidi(midiBlob, `${baseName}-${timestamp}.mid`);
  };

  const resetAll = () => {
    if (audioFile) {
      URL.revokeObjectURL(audioFile);
    }
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setAudioFile(null);
    setAudioFileName('');
    setDetectionResult(null);
    setError(null);
    setConversionProgress(0);
    setConversionStatus('');
    setIsPlayingAudio(false);
    setAudioProgress(0);
    setAudioDuration(0);
    setCurrentTime(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-0 sm:p-6">
      <div className="absolute inset-0 bg-slate-900/30 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full sm:max-w-5xl max-h-[90vh] bg-white rounded-t-2xl sm:rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.06)] overflow-hidden flex flex-col">
        {/* Header */}
        <header className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-200" style={{ background: PALETTE.blue.bg }}>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-400 hover:text-slate-600 transition-all"
            >
              <X size={14} />
            </button>
            <img src="/images/InspirationGenie.svg" alt="灵感精灵" className="w-11 h-11 rounded-full object-cover" />
            <div>
              <h2 className="text-base sm:text-lg font-bold tracking-tight text-slate-800">灵感精灵</h2>
              <p className="text-[10px] font-semibold uppercase tracking-widest mt-0.5" style={{ color: PALETTE.blue.accent }}>INSPIRATION GENIE</p>
            </div>
          </div>

          {detectionResult && detectionResult.notes.length > 0 && (
            <button
              onClick={handleExportMidi}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm text-white transition-all hover:opacity-90 active:scale-95"
              style={{ background: '#1e293b' }}
            >
              <Download size={16} />
              导出 MIDI
            </button>
          )}
        </header>

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {!audioFile ? (
            /* Upload zone */
            <div className="flex flex-col items-center justify-center py-8 sm:py-12">
              <div
                className="w-full max-w-2xl rounded-2xl border-2 border-dashed border-slate-200 hover:border-[#5BA4F5] bg-[#F8FAFC] hover:bg-[#E8F4FF] transition-all cursor-pointer flex flex-col items-center justify-center gap-5 py-12 sm:py-16"
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-white transition-all group-hover:scale-110" style={{ background: PALETTE.blue.accent }}>
                  <Upload size={28} />
                </div>
                <div className="text-center">
                  <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-800 mb-1.5">上传你的哼唱灵感</h3>
                  <p className="text-sm font-medium text-slate-500">支持 WAV / MP3 / M4A 等音频格式</p>
                  <p className="text-xs text-slate-400 mt-1.5">建议录制清晰的哼唱或乐器演奏</p>
                </div>
                <input ref={fileInputRef} type="file" accept="audio/*" onChange={handleFileUpload} className="hidden" />
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* File card */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-[0_1px_4px_rgba(0,0,0,0.02)] p-4 sm:p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl flex items-center justify-center text-white flex-shrink-0" style={{ background: PALETTE.blue.accent }}>
                      <FileAudio size={20} />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-800 truncate max-w-[200px] sm:max-w-xs">{audioFileName || '灵感已捕捉'}</h4>
                      <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 mt-0.5">Inspiration Captured</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {!detectionResult && !isConverting && (
                      <button
                        onClick={startConversion}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm text-white transition-all hover:opacity-90 active:scale-95"
                        style={{ background: PALETTE.blue.accent }}
                      >
                        <Wand2 size={16} />
                        开始 AI 分析
                      </button>
                    )}
                    <button onClick={resetAll} className="p-2 text-slate-300 hover:text-red-400 transition-colors">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                {/* Audio player */}
                <div className="bg-[#F8FAFC] rounded-xl p-3 sm:p-4">
                  <div className="flex items-center gap-3">
                    <button onClick={skipBackward} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-white transition-all">
                      <SkipBack size={16} />
                    </button>
                    <button
                      onClick={toggleAudioPlayback}
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-white transition-all active:scale-95"
                      style={{ background: isPlayingAudio ? '#ef4444' : PALETTE.blue.accent }}
                    >
                      {isPlayingAudio ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" className="ml-0.5" />}
                    </button>
                    <button onClick={skipForward} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-white transition-all">
                      <SkipForward size={16} />
                    </button>

                    <span className="text-xs font-semibold font-mono text-slate-400 w-10 text-right">{formatTime(currentTime)}</span>
                    <div className="flex-1">
                      <input
                        type="range" min="0" max="100" value={audioProgress} onChange={handleAudioSeek}
                        className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
                        style={{ background: `linear-gradient(to right, ${PALETTE.blue.accent} 0%, ${PALETTE.blue.accent} ${audioProgress}%, #E2E8F0 ${audioProgress}%, #E2E8F0 100%)` }}
                      />
                    </div>
                    <span className="text-xs font-semibold font-mono text-slate-400 w-10">{formatTime(audioDuration)}</span>

                    <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-white border border-slate-200">
                      <button onClick={() => setAudioVolume(Math.max(0, audioVolume - 0.1))}>
                        {audioVolume < 0.1 ? <VolumeX size={14} className="text-slate-400" /> : <Volume2 size={14} className="text-slate-400" />}
                      </button>
                      <input
                        type="range" min="0" max="1" step="0.05" value={audioVolume}
                        onChange={(e) => setAudioVolume(parseFloat(e.target.value))}
                        className="w-14 h-1 rounded-full appearance-none cursor-pointer"
                        style={{ background: `linear-gradient(to right, ${PALETTE.blue.accent} 0%, ${PALETTE.blue.accent} ${audioVolume * 100}%, #E2E8F0 ${audioVolume * 100}%, #E2E8F0 100%)` }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <audio ref={audioRef} src={audioFile} onTimeUpdate={handleAudioTimeUpdate} onEnded={handleAudioEnded} onLoadedMetadata={handleAudioLoaded} className="hidden" />

              {/* Error */}
              {error && (
                <div className="flex items-center gap-3 p-4 rounded-2xl border border-red-100 bg-red-50">
                  <AlertCircle size={16} className="text-red-400 flex-shrink-0" />
                  <p className="text-sm font-medium text-red-500">{error}</p>
                </div>
              )}

              {/* Converting progress */}
              {isConverting && (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-[0_1px_4px_rgba(0,0,0,0.02)] p-4 sm:p-5">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Loader2 size={14} className="animate-spin" style={{ color: PALETTE.blue.accent }} />
                      <span className="text-xs font-semibold text-slate-500">{conversionStatus}</span>
                    </div>
                    <span className="text-xs font-bold" style={{ color: PALETTE.blue.accent }}>{conversionProgress}%</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-300" style={{ width: `${conversionProgress}%`, background: PALETTE.blue.accent }} />
                  </div>
                </div>
              )}

              {/* Results */}
              {detectionResult && detectionResult.notes.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Sparkles size={16} style={{ color: PALETTE.blue.accent }} />
                    <h3 className="text-sm font-bold tracking-tight text-slate-700">音高分析结果</h3>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold border"
                      style={{ background: PALETTE.blue.bg, color: PALETTE.blue.accent, borderColor: PALETTE.blue.accent + '33' }}>
                      {detectionResult.notes.length} 个音符
                    </span>
                  </div>

                  <div className="bg-white rounded-2xl border border-slate-200 shadow-[0_1px_4px_rgba(0,0,0,0.02)] p-4 sm:p-5">
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                      {[
                        { label: '音频时长', value: formatTime(detectionResult.duration) },
                        { label: '音符数', value: String(detectionResult.notes.length) },
                        { label: '速度', value: `${detectionResult.bpm} BPM` },
                        { label: '拍号', value: `${detectionResult.timeSignature[0]}/${detectionResult.timeSignature[1]}` },
                        { label: '声部类型', value: '单声部' },
                      ].map(({ label, value }) => (
                        <div key={label} className="p-3 rounded-xl bg-[#F8FAFC]">
                          <div className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 mb-1">{label}</div>
                          <div className="text-base font-bold font-mono text-slate-800">{value}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-200 overflow-hidden">
                    <TranscriptionPianoRoll
                      detectedNotes={detectionResult.notes}
                      duration={detectionResult.duration}
                      bpm={detectionResult.bpm}
                      theme="light"
                    />
                  </div>
                </div>
              )}

              {detectionResult && detectionResult.notes.length === 0 && (
                <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center">
                  <AlertCircle className="mx-auto mb-3" size={32} style={{ color: PALETTE.yellow.accent }} />
                  <h3 className="text-base font-bold text-slate-800 mb-1">未检测到有效音符</h3>
                  <p className="text-sm font-medium text-slate-400">请尝试上传更清晰的音频，或确保音频中包含明显的音高变化</p>
                </div>
              )}
            </div>
          )}

          {/* Footer note */}
          <div className="flex items-start gap-3 p-4 rounded-2xl border border-slate-200 bg-white">
            <Music2 size={16} className="flex-shrink-0 mt-0.5" style={{ color: PALETTE.blue.accent }} />
            <p className="text-xs font-medium text-slate-500 leading-relaxed">
              关于 AI 音高分析: 系统使用 YIN 音高检测算法提取音频中的音高信息，支持人声哼唱、乐器演奏等多种音源。分析结果以钢琴卷帘形式展示，你可以试听并导出为 MIDI 文件。
            </p>
          </div>
        </main>
      </div>
    </div>
  );
};

export default MelodyDecoderModal;
