import React, { useState } from 'react';
import { ADVENTURE_LEVELS, AdventureLevel } from '../../constants';
import { Lock, CheckCircle2, Gift, X, Zap, Star } from 'lucide-react';
import SoundHuntingProject from '../projects/SoundHuntingProject';
import RhythmColoringProject from '../projects/RhythmColoringProject';
import RhythmLegoProject from '../projects/RhythmLegoProject';
import PitchLadderProject from '../projects/PitchLadderProject';
import MoodDoodleProject from '../projects/MoodDoodleProject';
import MelodyMirrorProject from '../projects/MelodyMirrorProject';
import InspirationRetroProject from '../projects/InspirationRetroProject';
import ChordBurgerProject from '../projects/ChordBurgerProject';
import ChordRouteProject from '../projects/ChordRouteProject';
import StyleTransformProject from '../projects/StyleTransformProject';
import MusicAtlasProject from '../projects/MusicAtlasProject';
import MemoryHookProject from '../projects/MemoryHookProject';
import MusicTrainProject from '../projects/MusicTrainProject';
import AIRecordingStudioProject from '../projects/AIRecordingStudioProject';
import PersonalDebutProject from '../projects/PersonalDebutProject';
import { PALETTE } from '../../constants/palette';

interface AdventureModeProps { theme?: 'light' | 'dark'; }

type Category = '初级' | '中级' | '高级';

const CATEGORY_CONFIG: Record<Category, {
  palette: typeof PALETTE[keyof typeof PALETTE];
  label: string;
  locked: boolean;
}> = {
  '初级': { palette: PALETTE.green, label: '新手制作人', locked: false },
  '中级': { palette: PALETTE.blue,  label: '进阶音乐人', locked: true  },
  '高级': { palette: PALETTE.pink,  label: '大师创作者', locked: true  },
};

const PHASE_COLORS: Record<string, keyof typeof PALETTE> = {
  '声音实验室': 'blue',
  '情绪调色盘': 'orange',
  '和声魔法屋': 'pink',
  '创作大拼图': 'green',
  '制作人舞台': 'yellow',
};

const AdventureMode: React.FC<AdventureModeProps> = ({ theme = 'light' }) => {
  const [selectedLevel, setSelectedLevel] = useState<AdventureLevel | null>(null);
  const [activeLevelId, setActiveLevelId] = useState<number | null>(null);
  const [activeCategory, setActiveCategory] = useState<Category>('初级');

  const handleLevelComplete = () => { setActiveLevelId(null); setSelectedLevel(null); };
  const handleBack = () => { setActiveLevelId(null); setSelectedLevel(null); };

  const renderActiveLevel = () => {
    const props = { theme, onComplete: handleLevelComplete, onBack: handleBack };
    switch (activeLevelId) {
      case 1:  return <SoundHuntingProject {...props} />;
      case 2:  return <RhythmColoringProject {...props} />;
      case 3:  return <RhythmLegoProject {...props} />;
      case 4:  return <PitchLadderProject {...props} />;
      case 5:  return <MoodDoodleProject {...props} />;
      case 6:  return <MelodyMirrorProject {...props} />;
      case 7:  return <InspirationRetroProject {...props} />;
      case 8:  return <ChordBurgerProject {...props} />;
      case 9:  return <ChordRouteProject {...props} />;
      case 10: return <StyleTransformProject {...props} />;
      case 11: return <MusicAtlasProject {...props} />;
      case 12: return <MemoryHookProject {...props} />;
      case 13: return <MusicTrainProject {...props} />;
      case 14: return <AIRecordingStudioProject {...props} />;
      case 15: return <PersonalDebutProject {...props} />;
      default: return null;
    }
  };

  const activeLevelView = renderActiveLevel();
  if (activeLevelView) return activeLevelView;

  const completedCount = ADVENTURE_LEVELS.filter(l => l.completed).length;
  const totalCount = ADVENTURE_LEVELS.length;
  const cfg = CATEGORY_CONFIG[activeCategory];
  const categoryLevels = ADVENTURE_LEVELS.filter(l => l.category === activeCategory);
  const catCompleted = categoryLevels.filter(l => l.completed).length;

  // Group levels by phase
  const phases = Array.from(new Set(categoryLevels.map(l => l.phase)));

  return (
    <div className="bg-[#F5F7FA]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-20 md:pb-10">

        {/* ── Hero ── */}
        <div className="pt-6 sm:pt-8 pb-4">
          <p className="text-[10px] font-semibold uppercase tracking-widest mb-2" style={{ color: PALETTE.green.accent }}>
            Adventure Map · 探险地图
          </p>
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 sm:gap-8">
            <div>
              <h1 className="text-3xl sm:text-5xl font-black leading-[1.1] tracking-tight text-slate-800 mb-2">
                解锁你的<br />
                <span style={{ color: PALETTE.green.accent }}>音乐超能力</span>
              </h1>
              <p className="text-sm font-medium text-slate-400 max-w-sm leading-relaxed">
                完成15节挑战课程，从新手制作人成长为大师创作者
              </p>
            </div>
            <div className="flex-shrink-0 flex items-center gap-6 pb-1">
              <div className="text-center">
                <div className="text-2xl sm:text-3xl font-black text-slate-800 leading-none mb-0.5">
                  {completedCount}<span className="text-base sm:text-lg text-slate-300">/{totalCount}</span>
                </div>
                <div className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">已完成</div>
              </div>
              <div className="w-px h-8 bg-slate-100" />
              <div className="text-center">
                <div className="text-2xl sm:text-3xl font-black leading-none mb-0.5" style={{ color: PALETTE.yellow.accent }}>
                  {completedCount * 100}
                </div>
                <div className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">积分</div>
              </div>
            </div>
          </div>
          <div className="mt-4 h-1 bg-slate-100 rounded-full overflow-hidden max-w-sm">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{ width: `${(completedCount / totalCount) * 100}%`, background: PALETTE.green.accent }}
            />
          </div>
        </div>

        {/* ── Category filter tabs ── */}
        <div className="flex items-center gap-2 py-3 overflow-x-auto scrollbar-hide">
          {(Object.entries(CATEGORY_CONFIG) as [Category, typeof cfg][]).map(([cat, c]) => {
            const active = activeCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => !c.locked && setActiveCategory(cat)}
                disabled={c.locked}
                className="flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold transition-all disabled:opacity-30 disabled:cursor-not-allowed whitespace-nowrap flex-shrink-0"
                style={active
                  ? { background: '#1e293b', color: '#fff' }
                  : { background: 'white', color: '#94A3B8' }
                }
              >
                {c.locked && <Lock size={10} />}
                {cat} · {c.label}
              </button>
            );
          })}
          <div className="flex-1" />
          <span className="text-xs font-semibold text-slate-300 whitespace-nowrap flex-shrink-0">{catCompleted}/{categoryLevels.length} 完成</span>
        </div>

        {/* ── Levels by phase ── */}
        <div className="space-y-6 mt-2">
          {phases.map(phase => {
            const phaseLevels = categoryLevels.filter(l => l.phase === phase);
            const phaseColorKey = PHASE_COLORS[phase] || 'blue';
            const phaseColor = PALETTE[phaseColorKey];
            const phaseCompleted = phaseLevels.filter(l => l.completed).length;
            return (
              <div key={phase}>
                <div className="flex items-center gap-2 mb-2.5">
                  <span
                    className="text-[10px] font-semibold uppercase tracking-widest px-2.5 py-1 rounded-full"
                    style={{ background: phaseColor.bg, color: phaseColor.accent }}
                  >
                    {phase}
                  </span>
                  <span className="text-[10px] font-semibold text-slate-300">{phaseCompleted}/{phaseLevels.length}</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {phaseLevels.map(level => {
                    const isCompleted = level.completed;
                    const isUnlocked = level.unlocked;
                    return (
                      <div
                        key={level.id}
                        onClick={() => isUnlocked && setSelectedLevel(level)}
                        className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-white border transition-all ${
                          isCompleted
                            ? 'border-emerald-100'
                            : isUnlocked
                            ? 'border-slate-100 hover:shadow-[0_2px_12px_rgba(0,0,0,0.05)] hover:-translate-y-0.5 cursor-pointer'
                            : 'border-slate-100 opacity-35 cursor-not-allowed'
                        }`}
                      >
                        <div
                          className="w-9 h-9 rounded-lg flex items-center justify-center text-lg flex-shrink-0"
                          style={{ background: isCompleted ? PALETTE.green.bg : isUnlocked ? phaseColor.bg : '#F8FAFC' }}
                        >
                          {isCompleted
                            ? <CheckCircle2 size={16} style={{ color: PALETTE.green.accent }} />
                            : isUnlocked
                            ? <span>{level.icon}</span>
                            : <Lock size={12} className="text-slate-300" />
                          }
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[9px] font-bold text-slate-300">L{level.id}</span>
                            {isCompleted && <Star size={8} fill="currentColor" style={{ color: PALETTE.yellow.accent }} />}
                          </div>
                          <p className="text-xs font-bold text-slate-700 truncate max-w-[100px]">{level.title}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Level detail modal ── */}
      {selectedLevel && (
        <div className="fixed inset-0 z-[120] bg-slate-900/30 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-6">
          <div className="w-full sm:max-w-sm bg-white rounded-t-2xl sm:rounded-2xl shadow-[0_8px_40px_rgba(0,0,0,0.10)] overflow-hidden max-h-[85vh] overflow-y-auto">
            <div className="relative p-6 flex items-center gap-4" style={{ background: cfg.palette.bg }}>
              <button
                onClick={() => setSelectedLevel(null)}
                className="absolute top-4 right-4 p-1.5 rounded-lg bg-white/70 text-slate-400 hover:text-slate-600 transition-all"
              >
                <X size={14} />
              </button>
              <div className="w-14 h-14 rounded-xl flex items-center justify-center text-3xl bg-white flex-shrink-0 shadow-sm">
                {selectedLevel.icon}
              </div>
              <div>
                <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">
                  Lesson {selectedLevel.id}
                </span>
                <h3 className="text-lg font-bold tracking-tight text-slate-800 mt-0.5">{selectedLevel.title}</h3>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-[#F8FAFC] rounded-xl p-4">
                <p className="text-sm font-medium text-slate-600 leading-relaxed">"{selectedLevel.homework}"</p>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-xl bg-[#FFFBE8]">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: PALETTE.yellow.bg }}>
                  <Gift size={16} style={{ color: PALETTE.yellow.accent }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">解锁徽章</p>
                  <p className="text-sm font-bold text-slate-800 truncate">{selectedLevel.reward}</p>
                </div>
              </div>
              <button
                onClick={() => setActiveLevelId(selectedLevel.id)}
                className="w-full py-3.5 rounded-xl font-semibold text-sm text-white flex items-center justify-center gap-2 transition-all hover:opacity-90 active:scale-95"
                style={{ background: '#1e293b' }}
              >
                <Zap size={16} /> 开启课程
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdventureMode;
