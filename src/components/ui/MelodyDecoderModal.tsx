import React, { useState, useRef, useCallback, useEffect } from 'react';
import { X, Check, Upload, Play, Pause, Wand2, Music2, Sparkles, FileAudio, Trash2, Download, AlertCircle, Volume2, VolumeX, SkipBack, SkipForward } from 'lucide-react';
import { pitchDetectionService, PitchDetectionResult } from '../../services/pitchDetectionService';
import { exportToMidi, downloadMidi } from '../../services/midiExportService';
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
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative w-full max-w-5xl max-h-[90vh] bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-300">
        <header className="p-6 flex items-center justify-between border-b border-blue-100 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-center gap-4">
            <button 
              onClick={onClose} 
              className="p-3 rounded-2xl transition-all bg-white border border-blue-100 text-blue-600 hover:border-blue-300 hover:bg-blue-50"
            >
              <X size={20} />
            </button>
            <div>
              <h2 className="text-xl font-black tracking-tight text-blue-950">旋律解码</h2>
              <p className="text-[10px] font-black uppercase tracking-[0.3em] mt-0.5 text-blue-600">MELODY DECODER</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {detectionResult && detectionResult.notes.length > 0 && (
              <button
                onClick={handleExportMidi}
                className="px-6 py-3 rounded-2xl font-bold text-sm text-white transition-all flex items-center gap-2 bg-indigo-500 hover:bg-indigo-600"
              >
                <Download size={16} />
                导出 MIDI
              </button>
            )}
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6">
          {!audioFile ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div 
                className="w-full max-w-2xl aspect-[21/9] rounded-[3rem] border-4 border-dashed flex flex-col items-center justify-center gap-6 transition-all group relative overflow-hidden bg-white border-blue-100 hover:border-blue-300 cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white group-hover:scale-110 group-hover:rotate-6 transition-all shadow-lg">
                  <Upload size={36} />
                </div>
                <div className="text-center">
                  <h3 className="text-2xl font-black mb-2 text-blue-900">上传你的哼唱灵感</h3>
                  <p className="text-sm font-bold text-slate-500">支持 WAV / MP3 / M4A 等音频格式</p>
                  <p className="text-xs text-slate-400 mt-2">建议录制清晰的哼唱或乐器演奏</p>
                </div>
                <input 
                  ref={fileInputRef}
                  type="file" 
                  accept="audio/*" 
                  onChange={handleFileUpload} 
                  className="hidden" 
                />
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-6">
              <div className="p-6 rounded-[2rem] border bg-white border-blue-50">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-lg">
                      <FileAudio size={28} />
                    </div>
                    <div>
                      <h4 className="text-lg font-black text-blue-900">{audioFileName || '灵感已捕捉'}</h4>
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Inspiration Captured</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {!detectionResult && !isConverting && (
                      <button 
                        onClick={startConversion}
                        className="px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-2xl font-black flex items-center gap-2 hover:opacity-90 active:scale-95 transition-all shadow-lg"
                      >
                        <Wand2 size={18} />
                        开始 AI 音高分析
                      </button>
                    )}
                    <button onClick={resetAll} className="p-3 text-slate-500 hover:text-rose-500 transition-colors">
                      <Trash2 size={20} />
                    </button>
                  </div>
                </div>
                
                <div className="p-4 rounded-2xl bg-slate-100">
                  <div className="flex items-center gap-4 mb-3">
                    <button
                      onClick={skipBackward}
                      className="p-2 rounded-xl transition-all hover:bg-black/5 text-slate-500"
                    >
                      <SkipBack size={18} />
                    </button>
                    
                    <button
                      onClick={toggleAudioPlayback}
                      className={`w-12 h-12 rounded-full flex items-center justify-center text-white transition-all shadow-lg ${
                        isPlayingAudio ? 'bg-rose-500 hover:bg-rose-600' : 'bg-emerald-500 hover:bg-emerald-600'
                      }`}
                    >
                      {isPlayingAudio ? <Pause size={22} fill="currentColor" /> : <Play size={22} fill="currentColor" style={{ marginLeft: '2px' }} />}
                    </button>
                    
                    <button
                      onClick={skipForward}
                      className="p-2 rounded-xl transition-all hover:bg-black/5 text-slate-500"
                    >
                      <SkipForward size={18} />
                    </button>
                    
                    <div className="flex-1 flex items-center gap-3">
                      <span className="text-xs font-bold font-mono w-12 text-right text-slate-500">
                        {formatTime(currentTime)}
                      </span>
                      
                      <div className="flex-1 relative group">
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={audioProgress}
                          onChange={handleAudioSeek}
                          className="w-full h-2 rounded-full appearance-none cursor-pointer bg-slate-200"
                          style={{
                            background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${audioProgress}%, #e2e8f0 ${audioProgress}%, #e2e8f0 100%)`
                          }}
                        />
                      </div>
                      
                      <span className="text-xs font-bold font-mono w-12 text-slate-500">
                        {formatTime(audioDuration)}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-200/50">
                      <button
                        onClick={() => setAudioVolume(Math.max(0, audioVolume - 0.1))}
                        className="hover:scale-110 transition-transform"
                      >
                        {audioVolume < 0.1 ? (
                          <VolumeX size={16} className="text-slate-500" />
                        ) : (
                          <Volume2 size={16} className="text-slate-500" />
                        )}
                      </button>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.05"
                        value={audioVolume}
                        onChange={(e) => setAudioVolume(parseFloat(e.target.value))}
                        className="w-16 h-1 rounded-full appearance-none cursor-pointer bg-slate-300"
                        style={{
                          background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${audioVolume * 100}%, #cbd5e1 ${audioVolume * 100}%, #cbd5e1 100%)`
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <audio
                ref={audioRef}
                src={audioFile}
                onTimeUpdate={handleAudioTimeUpdate}
                onEnded={handleAudioEnded}
                onLoadedMetadata={handleAudioLoaded}
                className="hidden"
              />

              {error && (
                <div className="p-4 rounded-2xl border flex items-center gap-3 bg-rose-50 border-rose-200">
                  <AlertCircle className="text-rose-500" size={20} />
                  <p className="text-sm font-bold text-rose-500">{error}</p>
                </div>
              )}

              {isConverting && (
                <div className="p-6 rounded-[2rem] border bg-white border-blue-50">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-black text-blue-500 uppercase tracking-[0.2em] animate-pulse">{conversionStatus}</span>
                    <span className="font-fredoka text-blue-500">{conversionProgress}%</span>
                  </div>
                  <div className="w-full h-3 rounded-full overflow-hidden bg-slate-200">
                    <div className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full transition-all duration-300" style={{ width: `${conversionProgress}%` }} />
                  </div>
                  <p className="text-xs mt-3 text-slate-400">
                    正在使用 YIN 算法提取音高信息...
                  </p>
                </div>
              )}

              {detectionResult && detectionResult.notes.length > 0 && (
                <div className="animate-in zoom-in-95 duration-700">
                  <div className="flex items-center gap-3 mb-4">
                    <Sparkles className="text-blue-500" size={24} />
                    <h3 className="text-xl font-black text-blue-900">音高分析结果</h3>
                    <span className="text-xs px-3 py-1 rounded-full font-bold bg-blue-100 text-blue-600">
                      {detectionResult.notes.length} 个音符
                    </span>
                  </div>
                  
                  <div className="p-6 rounded-[2rem] border mb-6 bg-white border-blue-50">
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                      <div className="p-4 rounded-xl bg-slate-50">
                        <div className="text-[10px] font-bold uppercase tracking-widest mb-1 text-slate-500">音频时长</div>
                        <div className="text-lg font-black font-mono text-blue-900">
                          {formatTime(detectionResult.duration)}
                        </div>
                      </div>
                      
                      <div className="p-4 rounded-xl bg-slate-50">
                        <div className="text-[10px] font-bold uppercase tracking-widest mb-1 text-slate-500">检测到的音符数</div>
                        <div className="text-lg font-black font-mono text-blue-900">
                          {detectionResult.notes.length}
                        </div>
                      </div>
                      
                      <div className="p-4 rounded-xl bg-slate-50">
                        <div className="text-[10px] font-bold uppercase tracking-widest mb-1 text-slate-500">速度</div>
                        <div className="text-lg font-black font-mono text-blue-900">
                          {detectionResult.bpm} BPM
                        </div>
                      </div>
                      
                      <div className="p-4 rounded-xl bg-slate-50">
                        <div className="text-[10px] font-bold uppercase tracking-widest mb-1 text-slate-500">拍号</div>
                        <div className="text-lg font-black font-mono text-blue-900">
                          {detectionResult.timeSignature[0]}/{detectionResult.timeSignature[1]}
                        </div>
                      </div>
                      
                      <div className="p-4 rounded-xl bg-slate-50">
                        <div className="text-[10px] font-bold uppercase tracking-widest mb-1 text-slate-500">声部类型</div>
                        <div className="text-lg font-black text-blue-900">
                          单声部
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="rounded-[2rem] border bg-white border-blue-50 overflow-hidden">
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
                <div className="p-8 rounded-[2rem] border text-center bg-white border-blue-50">
                  <AlertCircle className="mx-auto text-yellow-500 mb-4" size={48} />
                  <h3 className="text-xl font-black mb-2 text-blue-900">未检测到有效音符</h3>
                  <p className="text-sm text-slate-600">
                    请尝试上传更清晰的音频，或确保音频中包含明显的音高变化
                  </p>
                </div>
              )}
            </div>
          )}

          <div className="flex items-center gap-4 p-5 rounded-[2rem] border backdrop-blur-md mt-6 bg-white border-blue-50">
            <Music2 className="text-blue-500 flex-shrink-0" size={28} />
            <p className="text-sm font-medium leading-relaxed text-slate-600">
              <b>关于 AI 音高分析:</b> 系统使用 YIN 音高检测算法提取音频中的音高信息，支持人声哼唱、乐器演奏等多种音源。分析结果以钢琴卷帘形式展示，你可以试听并导出为 MIDI 文件。
            </p>
          </div>
        </main>
      </div>
    </div>
  );
};

export default MelodyDecoderModal;
