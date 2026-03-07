import React, { useState, useRef, useEffect, useCallback } from 'react';
import { TrainFront, Play, Pause, Sparkles, Trash2, Zap, Wind, ZapOff, Radio } from 'lucide-react';
import { audioService } from '../../services/audioService';
import { NOTES } from '../../utils/musicNotes';
import { PALETTE } from '../../constants/palette';
import ProjectShell from './ProjectShell';

type SectionType = 'INTRO' | 'VERSE' | 'CHORUS' | 'BRIDGE' | 'OUTRO' | 'EMPTY';

interface TrainCarConfig {
  type: SectionType; name: string; paletteKey: keyof typeof PALETTE;
  icon: React.ReactNode; desc: string;
}

const CAR_CONFIGS: Record<SectionType, TrainCarConfig> = {
  INTRO:  { type: 'INTRO',  name: '星际引擎', paletteKey: 'blue',   icon: <TrainFront size={20} />, desc: '启动能量' },
  VERSE:  { type: 'VERSE',  name: '故事货舱', paletteKey: 'blue',   icon: <Wind size={20} />,       desc: '平稳航行' },
  CHORUS: { type: 'CHORUS', name: '跃迁动力', paletteKey: 'orange', icon: <Zap size={20} />,        desc: '情感爆发' },
  BRIDGE: { type: 'BRIDGE', name: '虫洞隧道', paletteKey: 'pink',   icon: <Sparkles size={20} />,   desc: '时空转折' },
  OUTRO:  { type: 'OUTRO',  name: '着陆尾翼', paletteKey: 'green',  icon: <ZapOff size={20} />,     desc: '平稳降落' },
  EMPTY:  { type: 'EMPTY',  name: '空余轨道', paletteKey: 'blue',   icon: null,                     desc: '等待挂载' },
};

const MusicTrainProject: React.FC<{ onComplete: () => void; onBack: () => void; theme?: 'light' | 'dark' }> = ({ onComplete, onBack }) => {
  const [track, setTrack] = useState<SectionType[]>(['INTRO', 'EMPTY', 'EMPTY', 'EMPTY', 'EMPTY', 'OUTRO']);
  const [fills, setFills] = useState<boolean[]>(new Array(5).fill(false));
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentCarIdx, setCurrentCarIdx] = useState(-1);
  const timerRef = useRef<number | null>(null);

  const notes = { C2: NOTES.C2, E2: NOTES.E2, G2: NOTES.G2, A2: NOTES.A2, A1: NOTES.A1, G4: NOTES.G4 };

  const playSegmentSound = useCallback((type: SectionType, hasFill: boolean) => {
    switch (type) {
      case 'INTRO':  audioService.playPianoNote(notes.C2, 1.5, 0.6); break;
      case 'VERSE':  audioService.playPianoNote(notes.E2, 0.8, 0.4); break;
      case 'CHORUS':
        audioService.playPianoNote(notes.G2, 0.6, 0.7);
        setTimeout(() => audioService.playPianoNote(notes.G4, 0.4, 0.3), 100);
        break;
      case 'BRIDGE': audioService.playPianoNote(notes.A2, 2.0, 0.5); break;
      case 'OUTRO':  audioService.playPianoNote(notes.A1, 2.5, 0.4); break;
    }
    if (hasFill) {
      setTimeout(() => audioService.playDrum('kick'), 600);
      setTimeout(() => audioService.playDrum('snare'), 720);
      setTimeout(() => audioService.playDrum('hihat'), 840);
    }
  }, [notes]);

  useEffect(() => {
    if (isPlaying) {
      timerRef.current = window.setInterval(() => {
        setCurrentCarIdx(prev => {
          const next = (prev + 1) % track.length;
          const type = track[next];
          if (type !== 'EMPTY') playSegmentSound(type, fills[next]);
          return next;
        });
      }, 1200);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      setCurrentCarIdx(-1);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isPlaying, track, fills, playSegmentSound]);

  const placeModule = (type: SectionType) => {
    const firstEmpty = track.indexOf('EMPTY');
    if (firstEmpty !== -1) {
      const newTrack = [...track];
      newTrack[firstEmpty] = type;
      setTrack(newTrack);
    }
  };

  const clearCar = (idx: number) => {
    if (idx === 0 || idx === track.length - 1) return;
    const newTrack = [...track];
    newTrack[idx] = 'EMPTY';
    setTrack(newTrack);
  };

  const toggleFill = (idx: number) => {
    const newFills = [...fills];
    newFills[idx] = !newFills[idx];
    setFills(newFills);
  };

  return (
    <ProjectShell lessonId={13} title="音乐火车组装" subtitle="SONG STRUCTURE TRAIN" color="orange"
      actionLabel="发车！我的大作" actionEnabled={!track.includes('EMPTY')} onAction={onComplete} onBack={onBack} footerText="Voyage Sequencer · L13">

      {/* Module depot */}
      <div className="mb-4 sm:mb-6">
        <h3 className="text-sm font-bold text-slate-700 flex items-center gap-2 mb-3">
          <Radio size={16} style={{ color: PALETTE.orange.accent }} /> 点击挂载核心舱
        </h3>
        <div className="flex gap-2 sm:gap-3">
          {(['VERSE', 'CHORUS', 'BRIDGE'] as SectionType[]).map(type => {
            const cfg = CAR_CONFIGS[type];
            const c = PALETTE[cfg.paletteKey];
            return (
              <button key={type} onClick={() => placeModule(type)}
                className="flex-1 p-3 sm:p-4 rounded-2xl border-2 flex items-center gap-2 sm:gap-3 transition-all hover:scale-[1.02] active:scale-95"
                style={{ background: c.bg, borderColor: c.accent, color: c.accent }}>
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center" style={{ background: c.accent, color: '#fff' }}>
                  {cfg.icon}
                </div>
                <div className="text-left">
                  <div className="text-xs sm:text-sm font-bold leading-none">{cfg.name}</div>
                  <div className="text-[10px] font-semibold uppercase tracking-widest mt-0.5 opacity-60">{cfg.desc}</div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Train track */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-[0_1px_4px_rgba(0,0,0,0.02)] p-4 sm:p-6 mb-4 sm:mb-6">
        <div className="flex items-stretch gap-1 sm:gap-1.5 overflow-x-auto pb-2">
          {track.map((type, idx) => {
            const car = CAR_CONFIGS[type];
            const c = PALETTE[car.paletteKey];
            const isActive = currentCarIdx === idx;
            const isEmpty = type === 'EMPTY';
            const isEdge = idx === 0 || idx === track.length - 1;

            return (
              <React.Fragment key={idx}>
                <div className="flex flex-col items-center gap-2 flex-1 min-w-0">
                  <button onClick={() => !isEdge && clearCar(idx)}
                    className={`relative w-full h-20 sm:h-24 rounded-xl border-2 transition-all flex flex-col items-center justify-center gap-1 ${isActive ? 'scale-105' : ''}`}
                    style={isEmpty
                      ? { background: '#F8FAFC', borderColor: '#E2E8F0', borderStyle: 'dashed' }
                      : { background: c.bg, borderColor: isActive ? c.accent : c.accent + '66' }
                    }>
                    {!isEmpty && (
                      <>
                        <div style={{ color: c.accent }}>{car.icon}</div>
                        <span className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: c.accent }}>{car.name}</span>
                        {!isEdge && (
                          <div className="absolute -top-2 -right-2 opacity-0 hover:opacity-100 transition-opacity">
                            <div className="w-5 h-5 rounded-full flex items-center justify-center text-white" style={{ background: PALETTE.pink.accent }}>
                              <Trash2 size={10} />
                            </div>
                          </div>
                        )}
                      </>
                    )}
                    {isEmpty && <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-300">空</span>}
                  </button>
                  {/* Indicator dot */}
                  <div className="w-2 h-2 rounded-full transition-all" style={{ background: isActive ? c.accent : '#E2E8F0' }} />
                </div>

                {/* Fill connector */}
                {idx < track.length - 1 && (
                  <div className="flex items-center self-start mt-8 sm:mt-10">
                    <button onClick={() => toggleFill(idx)}
                      className="w-6 h-6 sm:w-7 sm:h-7 rounded-full border-2 flex items-center justify-center transition-all text-xs flex-shrink-0"
                      style={fills[idx]
                        ? { background: PALETTE.yellow.bg, borderColor: PALETTE.yellow.accent, color: PALETTE.yellow.accent }
                        : { background: '#F8FAFC', borderColor: '#E2E8F0', color: '#CBD5E1' }
                      }>
                      🥁
                    </button>
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Play button */}
      <div className="flex justify-center mb-4 sm:mb-6">
        <button onClick={() => setIsPlaying(!isPlaying)}
          className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl flex items-center justify-center transition-all text-white active:scale-95"
          style={{ background: isPlaying ? PALETTE.pink.accent : PALETTE.orange.accent }}>
          {isPlaying ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" className="ml-0.5" />}
        </button>
      </div>

      {/* Guide card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-[0_1px_4px_rgba(0,0,0,0.02)] p-4 sm:p-5"
        style={{ borderLeftColor: PALETTE.blue.accent, borderLeftWidth: 3 }}>
        <div className="flex gap-3 items-start">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0" style={{ background: PALETTE.blue.bg }}>🤖</div>
          <div>
            <h3 className="text-sm font-bold text-slate-800 mb-1">任务指南</h3>
            <p className="text-xs font-medium text-slate-500 leading-relaxed">
              挂载中间舱段，确保动力衔接。点击缝隙处的鼓可以添加转场鼓点。完成所有舱段后即可发车。
            </p>
          </div>
        </div>
      </div>
    </ProjectShell>
  );
};

export default MusicTrainProject;
