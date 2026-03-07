import React, { useState, useRef } from 'react';
import { Upload, Play, Pause, Headphones, FileAudio, Trash2, Cpu, Activity, BarChart3, Loader2 } from 'lucide-react';
import { PALETTE } from '../../constants/palette';
import ProjectShell from './ProjectShell';

const AIRecordingStudioProject: React.FC<{ onComplete: () => void; onBack: () => void; theme?: 'light' | 'dark' }> = ({ onComplete, onBack }) => {
  const [audioFile, setAudioFile] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) { setAudioFile(URL.createObjectURL(file)); setIsComplete(false); setProgress(0); }
  };

  const startProcessing = () => {
    if (!audioFile) return;
    setIsProcessing(true); setProgress(0);
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) { clearInterval(interval); setIsProcessing(false); setIsComplete(true); return 100; }
        return prev + 1;
      });
    }, 40);
  };

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) audioRef.current.pause(); else audioRef.current.play();
      setIsPlaying(!isPlaying);
    }
  };

  const reset = () => { setAudioFile(null); setIsComplete(false); setProgress(0); setIsPlaying(false); };

  return (
    <ProjectShell lessonId={14} title="AI 录音棚" subtitle="AI INTELLIGENT MASTERING" color="blue"
      actionLabel="发布我的单曲" actionEnabled={isComplete} onAction={onComplete} onBack={onBack} footerText="AI Audio Engineering · L14">
      <audio ref={audioRef} src={audioFile || ''} onEnded={() => setIsPlaying(false)} />

      {!audioFile ? (
        /* Upload area */
        <div className="relative bg-white rounded-2xl border-2 border-dashed border-slate-200 shadow-[0_1px_4px_rgba(0,0,0,0.02)] p-8 sm:p-12 flex flex-col items-center gap-5 text-center hover:border-slate-300 transition-all">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-white" style={{ background: PALETTE.blue.accent }}>
            <Upload size={28} />
          </div>
          <h3 className="text-base sm:text-xl font-bold text-slate-800">上传你的灵感声轨</h3>
          <p className="text-xs font-medium text-slate-500 max-w-sm">请先在"灵感精灵"录制个人哼唱，下载后再上传到这里进行大师混音。</p>
          <input type="file" accept="audio/*" onChange={handleFileUpload} className="absolute inset-0 opacity-0 cursor-pointer" />
        </div>
      ) : (
        <div className="space-y-4 sm:space-y-6">
          {/* File info + stats row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            {/* File card */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-[0_1px_4px_rgba(0,0,0,0.02)] p-4 sm:p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: PALETTE.blue.bg, color: PALETTE.blue.accent }}>
                  <FileAudio size={18} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-800">待处理音轨</h4>
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">Raw Vocal</p>
                </div>
              </div>
              <div className="h-16 bg-[#F8FAFC] rounded-xl flex items-end gap-0.5 px-3 py-2 overflow-hidden">
                {[...Array(20)].map((_, i) => (
                  <div key={i} className="flex-1 rounded-t-sm" style={{ height: `${Math.random() * 80 + 10}%`, background: PALETTE.blue.accent + '40' }} />
                ))}
              </div>
              <button onClick={reset} className="flex items-center gap-2 text-slate-400 hover:text-slate-600 text-xs font-semibold mt-3 transition-all">
                <Trash2 size={14} /> 重新上传
              </button>
            </div>

            {/* AI processing center */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-[0_1px_4px_rgba(0,0,0,0.02)] p-4 sm:p-5 flex flex-col items-center justify-center text-center">
              {!isComplete && !isProcessing && (
                <>
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-white mb-3" style={{ background: PALETTE.blue.accent }}>
                    <Cpu size={24} />
                  </div>
                  <h4 className="text-sm font-bold text-slate-800 mb-3">准备 AI 混音</h4>
                  <button onClick={startProcessing}
                    className="px-6 py-2.5 rounded-xl font-semibold text-xs text-white transition-all hover:opacity-90 active:scale-95"
                    style={{ background: PALETTE.blue.accent }}>
                    开始母带优化
                  </button>
                </>
              )}
              {isProcessing && (
                <div className="space-y-3">
                  <div className="relative w-20 h-20 mx-auto">
                    <div className="absolute inset-0 border-4 rounded-full" style={{ borderColor: PALETTE.blue.bg }} />
                    <div className="absolute inset-0 border-4 rounded-full border-t-transparent animate-spin" style={{ borderColor: PALETTE.blue.accent, borderTopColor: 'transparent' }} />
                    <div className="absolute inset-0 flex items-center justify-center text-lg font-bold" style={{ color: PALETTE.blue.accent }}>{progress}%</div>
                  </div>
                  <h4 className="text-sm font-bold text-slate-800">
                    {progress < 30 ? '解析谐波结构...' : progress < 70 ? '优化均衡器参数...' : '应用多带压缩...'}
                  </h4>
                  <p className="text-xs font-medium text-slate-400">Jin-Bot 正在为你的声音注入魔力</p>
                </div>
              )}
              {isComplete && (
                <div>
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-white mx-auto mb-3" style={{ background: PALETTE.green.accent }}>
                    <Headphones size={24} />
                  </div>
                  <h4 className="text-sm font-bold" style={{ color: PALETTE.green.accent }}>混音大功告成！</h4>
                  <p className="text-xs font-medium text-slate-400 mt-1">CD 级解析度 · 动态增强 100%</p>
                </div>
              )}
            </div>

            {/* Mastering stats */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-[0_1px_4px_rgba(0,0,0,0.02)] p-4 sm:p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: PALETTE.pink.bg, color: PALETTE.pink.accent }}>
                  <Activity size={18} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-800">母带监测器</h4>
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">Mastering Stats</p>
                </div>
              </div>
              <div className="space-y-4">
                {[
                  { label: '清晰度', val: isComplete ? 98 : 52, color: PALETTE.blue.accent },
                  { label: '饱满度', val: isComplete ? 95 : 44, color: PALETTE.pink.accent },
                  { label: '响度', val: isComplete ? 86 : 24, color: PALETTE.green.accent },
                ].map(stat => (
                  <div key={stat.label}>
                    <div className="flex justify-between text-[10px] font-semibold uppercase tracking-widest mb-1">
                      <span className="text-slate-400">{stat.label}</span>
                      <span className="text-slate-800">{stat.val}%</span>
                    </div>
                    <div className="h-1.5 bg-[#F8FAFC] rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-1000" style={{ width: stat.val + '%', background: stat.color }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Playback console */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-[0_1px_4px_rgba(0,0,0,0.02)] p-4 sm:p-6 flex flex-col items-center gap-4">
            <div className="w-full h-20 sm:h-24 flex items-center justify-center gap-0.5 px-4 relative">
              {[...Array(50)].map((_, i) => (
                <div key={i} className="flex-1 rounded-full transition-all duration-300"
                  style={{
                    height: isPlaying ? `${Math.random() * (isComplete ? 90 : 40) + 5}%` : '3px',
                    background: isPlaying ? (isComplete ? PALETTE.blue.accent : '#94A3B8') : '#E2E8F0',
                    opacity: isPlaying ? 1 : 0.4,
                  }} />
              ))}
            </div>
            <div className="flex items-center gap-4 sm:gap-6">
              <button onClick={togglePlay}
                className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl flex items-center justify-center transition-all text-white active:scale-95"
                style={{ background: isPlaying ? PALETTE.pink.accent : PALETTE.blue.accent }}>
                {isPlaying ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" className="ml-0.5" />}
              </button>
              <div>
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: isComplete ? PALETTE.green.accent : '#94A3B8' }} />
                  <span className="text-xs font-semibold text-slate-800">{isComplete ? '大师混音模式' : '原始声轨模式'}</span>
                </div>
                <p className="text-xs font-medium text-slate-400 mt-0.5">
                  {isComplete ? '你现在的听感拥有 CD 级别的宽广声场。' : '当前为录音直出状态，动态范围较窄。'}
                </p>
              </div>
            </div>
          </div>

          {/* Knowledge card */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-[0_1px_4px_rgba(0,0,0,0.02)] p-4 sm:p-5"
            style={{ borderLeftColor: PALETTE.blue.accent, borderLeftWidth: 3 }}>
            <div className="flex gap-3 items-start">
              <BarChart3 size={18} style={{ color: PALETTE.blue.accent }} className="flex-shrink-0 mt-0.5" />
              <div>
                <h5 className="text-xs font-semibold text-slate-800 mb-1" style={{ color: PALETTE.blue.accent }}>什么是混音与母带？</h5>
                <p className="text-xs font-medium text-slate-500 leading-relaxed">
                  混音 (Mixing) 就像是在做菜时调整各种调料的比例。而母带 (Mastering) 则是最后的摆盘和打光，它让你的歌曲在所有的播放器上听起来都一样响亮、清晰且震撼。
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </ProjectShell>
  );
};

export default AIRecordingStudioProject;
