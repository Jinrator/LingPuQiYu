import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Upload, Play, Pause, Wand2, Sparkles, FileAudio, Trash2, Layers } from 'lucide-react';
import { audioService } from '../../services/audioService';
import { NOTES } from '../../utils/musicNotes';
import { PALETTE } from '../../constants/palette';
import ProjectShell from './ProjectShell';

interface InspirationRetroProjectProps { onComplete: () => void; onBack: () => void; theme?: 'light' | 'dark'; }

const SCALE = [
  { num: '1', name: 'C', note: NOTES.C4 }, { num: '2', name: 'D', note: NOTES.D4 },
  { num: '3', name: 'E', note: NOTES.E4 }, { num: '4', name: 'F', note: NOTES.F4 },
  { num: '5', name: 'G', note: NOTES.G4 }, { num: '6', name: 'A', note: NOTES.A4 },
  { num: '7', name: 'B', note: NOTES.B4 }, { num: 'i', name: 'C5', note: NOTES.C5 },
];

const InspirationRetroProject: React.FC<InspirationRetroProjectProps> = ({ onComplete, onBack }) => {
  const [audioFile, setAudioFile] = useState<string | null>(null);
  const [isConverting, setIsConverting] = useState(false);
  const [convertedGrid, setConvertedGrid] = useState<number[]>(new Array(16).fill(-1));
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStep, setCurrentStep] = useState(-1);
  const [conversionProgress, setConversionProgress] = useState(0);
  const timerRef = useRef<number | null>(null);

  const playNote = useCallback((note: any) => { audioService.playPianoNote(note, 0.5, 0.7); }, []);

  useEffect(() => {
    if (isPlaying) {
      timerRef.current = window.setInterval(() => {
        setCurrentStep(prev => {
          const next = (prev + 1) % 16;
          const idx = convertedGrid[next];
          if (idx !== -1) playNote(SCALE[idx].note);
          return next;
        });
      }, 250);
    } else { if (timerRef.current) clearInterval(timerRef.current); setCurrentStep(-1); }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isPlaying, convertedGrid, playNote]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) { setAudioFile(URL.createObjectURL(file)); setConvertedGrid(new Array(16).fill(-1)); }
  };

  const startConversion = () => {
    if (!audioFile) return;
    setIsConverting(true); setConversionProgress(0);
    const interval = setInterval(() => {
      setConversionProgress(prev => {
        if (prev >= 100) { clearInterval(interval); finishConversion(); return 100; }
        return prev + 2;
      });
    }, 50);
  };

  const finishConversion = () => {
    setConvertedGrid(new Array(16).fill(-1).map((_, i) => i % 2 === 0 ? Math.floor(Math.random() * 8) : -1));
    setIsConverting(false);
  };

  const resetAll = () => { setAudioFile(null); setConvertedGrid(new Array(16).fill(-1)); setIsPlaying(false); setConversionProgress(0); };
  const hasNotes = !convertedGrid.every(n => n === -1);

  return (
    <ProjectShell lessonId={7} title="灵感回溯录" subtitle="AI MELODY TRANSCRIPTION" color="blue"
      actionLabel="保存灵感音符" actionEnabled={hasNotes} onAction={onComplete} onBack={onBack} footerText="Audio-to-Note Engine · L7">

      {/* Upload area */}
      {!audioFile ? (
        <div className="flex flex-col items-center justify-center py-16 sm:py-24">
          <div className="w-full max-w-lg aspect-[2/1] rounded-2xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center gap-4 bg-white relative overflow-hidden hover:border-[#5BA4F5] transition-all">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: PALETTE.blue.bg }}>
              <Upload size={28} style={{ color: PALETTE.blue.accent }} />
            </div>
            <div className="text-center">
              <h3 className="text-base font-bold text-slate-800 mb-1">上传你的哼唱灵感</h3>
              <p className="text-xs font-medium text-slate-400">支持 WAV / MP3 / M4A 格式</p>
            </div>
            <input type="file" accept="audio/*" onChange={handleFileUpload} className="absolute inset-0 opacity-0 cursor-pointer" />
          </div>
        </div>
      ) : (
        <div className="space-y-4 sm:space-y-5">
          {/* Audio status */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-[0_1px_4px_rgba(0,0,0,0.02)] p-4 sm:p-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: PALETTE.blue.bg }}>
                <FileAudio size={18} style={{ color: PALETTE.blue.accent }} />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-800">灵感已捕捉</h4>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">Inspiration Captured</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {!hasNotes && !isConverting && (
                <button onClick={startConversion}
                  className="px-4 py-2.5 rounded-xl font-semibold text-xs text-white flex items-center gap-2 transition-all hover:opacity-90 active:scale-95"
                  style={{ background: PALETTE.blue.accent }}>
                  <Wand2 size={14} /> AI 灵感转换
                </button>
              )}
              <button onClick={resetAll} className="p-2 text-slate-300 hover:text-red-400 transition-colors"><Trash2 size={16} /></button>
            </div>
          </div>

          {/* Progress */}
          {isConverting && (
            <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: PALETTE.blue.accent }}>正在解析音频波形...</span>
                <span className="text-sm font-bold text-slate-800">{conversionProgress}%</span>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all duration-300" style={{ width: `${conversionProgress}%`, background: PALETTE.blue.accent }} />
              </div>
            </div>
          )}

          {/* Note grid */}
          {!isConverting && hasNotes && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-[0_1px_4px_rgba(0,0,0,0.02)] p-4 sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Sparkles size={18} style={{ color: PALETTE.blue.accent }} />
                  <h3 className="text-sm font-bold text-slate-700">正式音符网格</h3>
                </div>
                <button onClick={() => setIsPlaying(!isPlaying)}
                  className="px-4 py-2 rounded-xl font-semibold text-xs text-white flex items-center gap-2 transition-all hover:opacity-90 active:scale-95"
                  style={{ background: isPlaying ? '#ef4444' : PALETTE.green.accent }}>
                  {isPlaying ? <Pause size={14} fill="currentColor" /> : <Play size={14} fill="currentColor" />}
                  {isPlaying ? '停止' : '试听'}
                </button>
              </div>

              <div className="flex gap-2 sm:gap-3 overflow-x-auto pb-2">
                <div className="flex flex-col gap-1.5 min-w-[50px] flex-shrink-0">
                  {[...SCALE].reverse().map(n => (
                    <div key={n.name} className="h-8 flex items-center justify-center">
                      <span className="text-[10px] font-semibold" style={{ color: PALETTE.blue.accent }}>{n.num}</span>
                    </div>
                  ))}
                </div>
                <div className="flex-1 grid grid-cols-16 gap-1.5 min-w-[600px]">
                  {[...Array(16)].map((_, stepIdx) => (
                    <div key={stepIdx} className={`flex flex-col gap-1.5 ${currentStep === stepIdx ? 'bg-slate-50 rounded-lg' : ''}`}>
                      {[...SCALE].reverse().map((note, pitchIdx) => {
                        const pitch = 7 - pitchIdx;
                        const isActive = convertedGrid[stepIdx] === pitch;
                        return (
                          <div key={pitchIdx} className="h-8 rounded-lg border flex items-center justify-center transition-all"
                            style={isActive ? { background: PALETTE.blue.accent, borderColor: '#fff' } : { background: '#F8FAFC', borderColor: '#E2E8F0', opacity: 0.3 }}>
                            {isActive && <span className="text-[10px] font-semibold text-white">{note.num}</span>}
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Info card */}
      <div className="mt-4 bg-white rounded-2xl border border-slate-200 shadow-[0_1px_4px_rgba(0,0,0,0.02)] p-4 sm:p-5 flex items-start gap-3"
        style={{ borderLeftColor: PALETTE.blue.accent, borderLeftWidth: 3 }}>
        <Layers size={18} style={{ color: PALETTE.blue.accent }} className="flex-shrink-0 mt-0.5" />
        <p className="text-xs font-medium text-slate-500 leading-relaxed">
          灵感精灵会分析你录音中的音高和节奏，将其对应到网格里的简谱和音名。你可以试听这些音符，不满意可以重新上传。
        </p>
      </div>
    </ProjectShell>
  );
};

export default InspirationRetroProject;
