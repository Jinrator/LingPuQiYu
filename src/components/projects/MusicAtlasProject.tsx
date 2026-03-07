import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Wind, Zap, X, Info } from 'lucide-react';
import { audioService } from '../../services/audioService';
import { NOTES, CHORDS } from '../../utils/musicNotes';
import { PALETTE } from '../../constants/palette';
import ProjectShell from './ProjectShell';

const MusicAtlasProject: React.FC<{ onComplete: () => void; onBack: () => void; theme?: 'light' | 'dark' }> = ({ onComplete, onBack }) => {
  const [activeSection, setActiveSection] = useState<'A' | 'B'>('A');
  const [isPlaying, setIsPlaying] = useState(false);
  const [energy, setEnergy] = useState(30);
  const [showAITip, setShowAITip] = useState(false);

  const timerRef = useRef<number | null>(null);
  const currentStepRef = useRef(0);
  const cMajor = CHORDS.C;

  const runSequence = useCallback(() => {
    const step = currentStepRef.current % 8;
    if (activeSection === 'A') {
      if (step === 0 || step === 4) audioService.playPianoNote(NOTES.C4, 0.8, 0.3);
      if (step === 2) audioService.playPianoNote(NOTES.E4, 0.6, 0.2);
    } else {
      if (step % 2 === 0) audioService.playDrum('kick');
      if (step % 1 === 0) {
        const velocity = energy > 70 ? 0.6 : 0.4;
        audioService.playPianoNote(NOTES.C5, 0.15, velocity);
      }
      if (step === 0 || step === 4) audioService.playPianoChord(cMajor, 1.0, 0.3);
    }
    currentStepRef.current++;
  }, [activeSection, energy, cMajor]);

  useEffect(() => {
    if (isPlaying) {
      timerRef.current = window.setInterval(runSequence, 200);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isPlaying, runSequence]);

  const handleSwitch = (section: 'A' | 'B') => {
    if (section === 'B' && activeSection === 'A') { setShowAITip(true); setEnergy(80); }
    else if (section === 'A') { setEnergy(30); }
    setActiveSection(section);
  };

  const sectionColor = activeSection === 'A' ? PALETTE.blue : PALETTE.orange;

  return (
    <ProjectShell lessonId={11} title="音乐地图册" subtitle="AB STRUCTURE ATLAS" color={activeSection === 'A' ? 'blue' : 'orange'}
      actionLabel="绘制完成" actionEnabled onAction={onComplete} onBack={onBack} footerText="Musical Structure Atlas · L11">

      {/* Section switcher */}
      <div className="flex gap-2 sm:gap-3 mb-4 sm:mb-6">
        <button onClick={() => handleSwitch('A')}
          className="flex-1 p-3.5 sm:p-5 rounded-2xl border-2 flex items-center gap-3 transition-all hover:scale-[1.02] active:scale-95"
          style={activeSection === 'A'
            ? { background: PALETTE.blue.bg, borderColor: PALETTE.blue.accent, color: PALETTE.blue.accent }
            : { background: '#F8FAFC', borderColor: '#E2E8F0', color: '#94A3B8' }
          }>
          <Wind size={20} />
          <div className="text-left">
            <div className="text-sm font-bold leading-none">主歌段 (A)</div>
            <div className="text-[10px] font-semibold uppercase tracking-widest mt-1 opacity-60">Verse</div>
          </div>
        </button>
        <button onClick={() => handleSwitch('B')}
          className="flex-1 p-3.5 sm:p-5 rounded-2xl border-2 flex items-center gap-3 transition-all hover:scale-[1.02] active:scale-95"
          style={activeSection === 'B'
            ? { background: PALETTE.orange.bg, borderColor: PALETTE.orange.accent, color: PALETTE.orange.accent }
            : { background: '#F8FAFC', borderColor: '#E2E8F0', color: '#94A3B8' }
          }>
          <Zap size={20} />
          <div className="text-left">
            <div className="text-sm font-bold leading-none">副歌段 (B)</div>
            <div className="text-[10px] font-semibold uppercase tracking-widest mt-1 opacity-60">Chorus</div>
          </div>
        </button>
      </div>

      {/* Energy slider panel */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-[0_1px_4px_rgba(0,0,0,0.02)] p-4 sm:p-6 mb-4 sm:mb-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white" style={{ background: sectionColor.accent }}>
            {activeSection === 'A' ? <Wind size={18} /> : <Zap size={18} />}
          </div>
          <h3 className="text-sm font-bold text-slate-800">能量拉杆</h3>
        </div>
        <div className="space-y-3">
          <div className="flex justify-between text-[10px] font-semibold uppercase tracking-widest text-slate-400">
            <span>散漫</span><span>密集</span>
          </div>
          <input type="range" min="10" max="100" value={energy}
            onChange={(e) => setEnergy(parseInt(e.target.value))}
            className="w-full h-2 rounded-full appearance-none cursor-pointer"
            style={{ accentColor: sectionColor.accent }} />
          <div className="flex justify-between items-end">
            <span className="text-xl font-bold" style={{ color: sectionColor.accent }}>{energy}</span>
            <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">
              {energy > 70 ? '能量溢出' : '状态稳定'}
            </span>
          </div>
        </div>
      </div>

      {/* Info card */}
      <div className="rounded-2xl border p-4 sm:p-5 mb-4 sm:mb-6"
        style={{ background: sectionColor.bg, borderColor: sectionColor.accent + '33' }}>
        <div className="flex items-start gap-3">
          <Info size={18} style={{ color: sectionColor.accent }} className="flex-shrink-0 mt-0.5" />
          <p className="text-xs font-medium text-slate-600 leading-relaxed">
            {activeSection === 'A'
              ? '主歌是在讲故事，保持安静和整齐，让听众听清你的话。'
              : '副歌是你的呐喊！把音量加大，节奏加密，让大家和你一起跳！'}
          </p>
        </div>
      </div>

      {/* Play button */}
      <button onClick={() => setIsPlaying(!isPlaying)}
        className="w-full py-3.5 rounded-xl font-semibold text-sm text-white flex items-center justify-center gap-2 transition-all hover:opacity-90 active:scale-95"
        style={{ background: isPlaying ? PALETTE.pink.accent : sectionColor.accent }}>
        {isPlaying ? '停止预览' : '开启航行'}
      </button>

      {/* AI tip toast */}
      {showAITip && (
        <div className="fixed inset-0 z-[250] bg-slate-900/30 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-6">
          <div className="w-full sm:max-w-md bg-white rounded-t-2xl sm:rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.06)] p-6 sm:p-8 flex flex-col items-center gap-5 text-center">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl" style={{ background: PALETTE.orange.bg }}>🤖</div>
            <h3 className="text-base font-bold text-slate-800">AI 助教：发现高潮！</h3>
            <p className="text-sm font-medium text-slate-500 leading-relaxed">
              副歌部分能量爆棚！我已经自动帮你把底鼓加密了，听听看，是不是更有那种"大声喊出来"的感觉？
            </p>
            <button onClick={() => setShowAITip(false)}
              className="w-full py-3.5 rounded-xl font-semibold text-sm text-white flex items-center justify-center gap-2 transition-all hover:opacity-90 active:scale-95 bg-[#1e293b]">
              知道了 <X size={16} />
            </button>
          </div>
        </div>
      )}
    </ProjectShell>
  );
};

export default MusicAtlasProject;
