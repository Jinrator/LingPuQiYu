import React, { useState, Suspense, lazy } from 'react';
import { ADVENTURE_LEVELS, AdventureLevel } from '../../constants';
import { Lock, CheckCircle2, Gift, X, Zap, Star, Target, MessageCircle, Loader2 } from 'lucide-react';
import { PALETTE } from '../../constants/palette';
import { useSettings } from '../../contexts/SettingsContext';
import PageDecoration from '../ui/PageDecoration';

// 懒加载项目组件，避免一次性加载 15 个组件阻塞渲染
const SoundHuntingProject = lazy(() => import('../projects/SoundHuntingProject'));
const RhythmColoringProject = lazy(() => import('../projects/RhythmColoringProject'));
const RhythmLegoProject = lazy(() => import('../projects/RhythmLegoProject'));
const PitchLadderProject = lazy(() => import('../projects/PitchLadderProject'));
const MoodDoodleProject = lazy(() => import('../projects/MoodDoodleProject'));
const MelodyMirrorProject = lazy(() => import('../projects/MelodyMirrorProject'));
const InspirationRetroProject = lazy(() => import('../projects/InspirationRetroProject'));
const ChordBurgerProject = lazy(() => import('../projects/ChordBurgerProject'));
const ChordRouteProject = lazy(() => import('../projects/ChordRouteProject'));
const StyleTransformProject = lazy(() => import('../projects/StyleTransformProject'));
const MusicAtlasProject = lazy(() => import('../projects/MusicAtlasProject'));
const MemoryHookProject = lazy(() => import('../projects/MemoryHookProject'));
const MusicTrainProject = lazy(() => import('../projects/MusicTrainProject'));
const AIRecordingStudioProject = lazy(() => import('../projects/AIRecordingStudioProject'));
const PersonalDebutProject = lazy(() => import('../projects/PersonalDebutProject'));

const ProjectFallback: React.FC = () => (
  <div className="h-screen w-full flex items-center justify-center bg-[#F5F7FA]">
    <div className="text-center">
      <Loader2 size={24} className="animate-spin mx-auto mb-3" style={{ color: PALETTE.green.accent }} />
      <p className="text-sm font-medium text-slate-400">加载中...</p>
    </div>
  </div>
);

interface AdventureModeProps { theme?: 'light' | 'dark'; }
type Category = '初级' | '中级' | '高级';

const CATEGORY_CONFIG: Record<Category, {
  palette: typeof PALETTE[keyof typeof PALETTE];
  labelKey: string;
  locked: boolean;
}> = {
  '初级': { palette: PALETTE.green, labelKey: 'adv.beginner', locked: false },
  '中级': { palette: PALETTE.blue,  labelKey: 'adv.intermediate', locked: true  },
  '高级': { palette: PALETTE.pink,  labelKey: 'adv.advanced', locked: true  },
};

const PHASE_COLORS: Record<string, keyof typeof PALETTE> = {
  'adv.phase.soundLab': 'blue',
  'adv.phase.emotionPalette': 'orange',
  'adv.phase.harmonyHouse': 'pink',
  'adv.phase.composePuzzle': 'yellow',
  'adv.phase.producerStage': 'blue',
};

const PHASE_ICONS: Record<string, string> = {
  'adv.phase.soundLab': '🔬',
  'adv.phase.emotionPalette': '🎨',
  'adv.phase.harmonyHouse': '🏰',
  'adv.phase.composePuzzle': '🧩',
  'adv.phase.producerStage': '🎤',
};

const AdventureMode: React.FC<AdventureModeProps> = ({ theme = 'light' }) => {
  const { t } = useSettings();
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
  if (activeLevelView) return <Suspense fallback={<ProjectFallback />}>{activeLevelView}</Suspense>;

  const completedCount = ADVENTURE_LEVELS.filter(l => l.completed).length;
  const totalCount = ADVENTURE_LEVELS.length;
  const categoryLevels = ADVENTURE_LEVELS.filter(l => l.category === activeCategory);
  const catCompleted = categoryLevels.filter(l => l.completed).length;
  const phaseKeys = Array.from(new Set(categoryLevels.map(l => l.phaseKey)));
  const progressPct = Math.round((completedCount / totalCount) * 100);

  return (
    <div className="relative min-h-screen bg-[#F5F7FA] overflow-hidden">
      <PageDecoration />
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 pb-28 md:pb-10">

        {/* ── Hero ── */}
        <div className="pt-5 sm:pt-8 pb-3">
          <p className="text-xs sm:text-[10px] font-semibold uppercase tracking-widest mb-1.5 sm:mb-2" style={{ color: PALETTE.green.accent }}>
            {t('adv.subtitle')}
          </p>
          <div className="flex items-end justify-between gap-4 sm:gap-6">
            <div>
              <h1 className="text-2xl sm:text-5xl font-black leading-[1.1] tracking-tight text-slate-800 mb-1.5 sm:mb-2">
                {t('adv.hero')}<br />
                <span style={{ color: PALETTE.green.accent }}>{t('adv.heroAccent')}</span>
              </h1>
              <p className="text-sm font-medium text-slate-400 max-w-sm leading-relaxed">{t('adv.heroDesc')}</p>
            </div>
            <div className="flex-shrink-0 flex items-center gap-5 sm:gap-6 pb-1">
              <div className="text-center">
                <div className="text-xl sm:text-3xl font-black text-slate-800 leading-none mb-0.5">
                  {completedCount}<span className="text-sm sm:text-lg text-slate-300">/{totalCount}</span>
                </div>
                <div className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">{t('adv.completed')}</div>
              </div>
              <div className="w-px h-7 sm:h-8 bg-slate-200/50" />
              <div className="text-center">
                <div className="text-xl sm:text-3xl font-black leading-none mb-0.5" style={{ color: PALETTE.yellow.accent }}>
                  {completedCount * 100}
                </div>
                <div className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">{t('adv.points')}</div>
              </div>
            </div>
          </div>
          <div className="mt-3 sm:mt-4 h-1 bg-white/50 rounded-full overflow-hidden max-w-sm">
            <div className="h-full rounded-full transition-all duration-700" style={{ width: `${progressPct}%`, background: PALETTE.green.accent }} />
          </div>
        </div>

        {/* ── Category tabs ── */}
        <div className="flex items-center gap-1.5 sm:gap-2 py-3 sm:py-4 mt-1 overflow-x-auto scrollbar-hide">
          {(Object.entries(CATEGORY_CONFIG) as [Category, typeof CATEGORY_CONFIG[Category]][]).map(([cat, c]) => {
            const active = activeCategory === cat;
            const catKey = cat === '初级' ? 'adv.catBeginner' : cat === '中级' ? 'adv.catIntermediate' : 'adv.catAdvanced';
            return (
              <button
                key={cat}
                onClick={() => !c.locked && setActiveCategory(cat)}
                disabled={c.locked}
                className="flex items-center gap-1.5 sm:gap-2 px-3.5 sm:px-4 py-2 rounded-full text-xs font-semibold transition-all disabled:opacity-30 disabled:cursor-not-allowed whitespace-nowrap flex-shrink-0"
                style={active ? { background: '#1e293b', color: '#fff' } : { background: 'white', color: '#94A3B8' }}
              >
                {c.locked && <Lock size={10} />}
                {t(catKey)} · {t(c.labelKey)}
              </button>
            );
          })}
          <div className="flex-1" />
          <span className="text-xs font-semibold text-slate-300 whitespace-nowrap flex-shrink-0">
            {catCompleted}/{categoryLevels.length} {t('adv.done')}
          </span>
        </div>

        {/* ── Phase sections ── */}
        <div className="space-y-5 sm:space-y-6 mt-1">
          {phaseKeys.map((pk) => {
            const phaseLevels = categoryLevels.filter(l => l.phaseKey === pk);
            const phaseColorKey = PHASE_COLORS[pk] || 'blue';
            const phaseColor = PALETTE[phaseColorKey];
            const phaseCompleted = phaseLevels.filter(l => l.completed).length;
            const phaseIcon = PHASE_ICONS[pk] || '📚';
            const phasePct = phaseLevels.length > 0 ? Math.round((phaseCompleted / phaseLevels.length) * 100) : 0;
            const subKey = pk + '.sub';
            const goalKey = pk + '.goal';
            const feedbackKey = pk + '.feedback';
            const hasFeedback = t(feedbackKey) !== feedbackKey;

            return (
              <div key={pk} className="bg-white rounded-2xl shadow-[0_1px_4px_rgba(0,0,0,0.02)] border border-slate-200/60 border-l-[3px] overflow-hidden" style={{ borderLeftColor: phaseColor.accent }}>
                {/* Phase header */}
                <div className="relative p-4 sm:p-5" style={{ background: phaseColor.bg }}>
                  {/* Decorative blocks */}
                  <div className="absolute top-[-16px] right-[-16px] w-24 h-24 rounded-2xl rotate-12 opacity-40 hidden sm:block"
                    style={{ background: phaseColor.accent + '22', border: `1.5px solid ${phaseColor.accent}22` }} />
                  <div className="absolute bottom-[-8px] right-[40px] w-14 h-14 rounded-xl rotate-6 opacity-30 hidden sm:block"
                    style={{ background: phaseColor.accent + '22', border: `1.5px solid ${phaseColor.accent}22` }} />

                  <div className="relative flex items-start gap-3 sm:gap-4">
                    {/* Phase icon */}
                    <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center text-xl sm:text-2xl bg-white flex-shrink-0 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
                      {phaseIcon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: phaseColor.accent }}>
                          {t('adv.lesson')} {phaseLevels[0]?.id}-{phaseLevels[phaseLevels.length - 1]?.id}
                        </span>
                        <span className="text-[10px] font-semibold text-slate-300">·</span>
                        <span className="text-[10px] font-semibold text-slate-300">{phaseCompleted}/{phaseLevels.length}</span>
                      </div>
                      <h3 className="text-sm sm:text-base font-bold tracking-tight text-slate-800">{t(pk)}</h3>
                      <p className="text-xs font-medium text-slate-400 mt-0.5">{t(subKey)}</p>
                    </div>
                    {/* Phase progress ring */}
                    <div className="flex-shrink-0 hidden sm:flex items-center gap-2">
                      <div className="relative w-10 h-10">
                        <svg className="w-10 h-10 -rotate-90" viewBox="0 0 36 36">
                          <circle cx="18" cy="18" r="15" fill="none" stroke="#E2E8F0" strokeWidth="2.5" />
                          <circle cx="18" cy="18" r="15" fill="none" stroke={phaseColor.accent} strokeWidth="2.5"
                            strokeDasharray={`${phasePct * 0.942} 94.2`} strokeLinecap="round" />
                        </svg>
                        <span className="absolute inset-0 flex items-center justify-center text-[9px] font-bold text-slate-600">
                          {phasePct}%
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Goal row */}
                  <div className="relative flex items-center gap-2 mt-3 px-3 py-2 rounded-xl bg-white/60">
                    <Target size={13} style={{ color: phaseColor.accent }} className="flex-shrink-0" />
                    <p className="text-xs font-medium text-slate-500 leading-relaxed">{t(goalKey)}</p>
                  </div>
                </div>

                {/* Level cards */}
                <div className="p-3.5 sm:p-4">
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-2.5">
                    {phaseLevels.map(level => {
                      const isCompleted = level.completed;
                      const isUnlocked = level.unlocked;
                      return (
                        <div
                          key={level.id}
                          onClick={() => isUnlocked && setSelectedLevel(level)}
                          className={`group flex items-center gap-2.5 px-3 py-2.5 rounded-xl transition-all ${
                            isCompleted
                              ? 'bg-[#E8FFF0] border'
                              : isUnlocked
                              ? 'cursor-pointer hover:shadow-[0_1px_6px_rgba(0,0,0,0.03)] hover:-translate-y-0.5'
                              : 'bg-[#F8FAFC] opacity-35 cursor-not-allowed'
                          }`}
                          style={
                            isCompleted
                              ? { borderColor: PALETTE.green.accent + '33' }
                              : isUnlocked
                              ? { background: phaseColor.bg }
                              : {}
                          }
                        >
                          <div className="w-9 h-9 rounded-lg flex items-center justify-center text-lg flex-shrink-0 bg-white">
                            {isCompleted
                              ? <CheckCircle2 size={16} style={{ color: PALETTE.green.accent }} />
                              : isUnlocked
                              ? <span>{level.icon}</span>
                              : <Lock size={12} className="text-slate-300" />
                            }
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="text-[10px] font-semibold text-slate-300">L{level.id}</span>
                              {isCompleted && <Star size={8} fill="currentColor" style={{ color: PALETTE.yellow.accent }} />}
                            </div>
                            <p className="text-xs font-bold text-slate-700 truncate max-w-[110px] sm:max-w-[140px]">{t(level.titleKey)}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Parent feedback note */}
                  {hasFeedback && (
                    <div className="mt-3 flex items-start gap-2 px-3 py-2.5 rounded-xl bg-[#F8FAFC] border border-slate-100">
                      <MessageCircle size={13} className="text-slate-300 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-300 mb-0.5">{t('adv.parentFeedback')}</p>
                        <p className="text-xs font-medium text-slate-400 leading-relaxed">{t(feedbackKey)}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Level detail modal ── */}
      {selectedLevel && (() => {
        const modalColorKey = PHASE_COLORS[selectedLevel.phaseKey] || 'blue';
        const modalColor = PALETTE[modalColorKey];
        return (
          <div className="fixed inset-0 z-[120] bg-slate-900/30 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-6">
            <div className="w-full sm:max-w-md bg-white rounded-t-2xl sm:rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.06)] overflow-hidden max-h-[85vh] overflow-y-auto">
              {/* Header */}
              <div className="relative p-5 sm:p-6" style={{ background: modalColor.bg }}>
                {/* Decorative blocks */}
                <div className="absolute top-[-20px] right-[-20px] w-28 h-28 rounded-3xl rotate-12 opacity-50"
                  style={{ background: modalColor.accent + '22', border: `1.5px solid ${modalColor.accent}22` }} />
                <div className="absolute bottom-[-10px] right-[30px] w-16 h-16 rounded-2xl rotate-6 opacity-40"
                  style={{ background: modalColor.accent + '22', border: `1.5px solid ${modalColor.accent}22` }} />

                <button
                  onClick={() => setSelectedLevel(null)}
                  className="absolute top-4 right-4 p-1.5 rounded-lg bg-white text-slate-400 hover:text-slate-600 transition-all z-10"
                >
                  <X size={14} />
                </button>
                <div className="relative flex items-center gap-4">
                  <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl flex items-center justify-center text-2xl sm:text-3xl bg-white flex-shrink-0 shadow-[0_1px_4px_rgba(0,0,0,0.02)]">
                    {selectedLevel.icon}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: modalColor.accent }}>
                        Lesson {selectedLevel.id}
                      </span>
                      <span
                        className="px-2 py-0.5 rounded-full text-[10px] font-semibold border"
                        style={{ background: modalColor.bg, color: modalColor.accent, borderColor: modalColor.accent + '33' }}
                      >
                        {t(selectedLevel.phaseKey)}
                      </span>
                    </div>
                    <h3 className="text-base sm:text-lg font-bold tracking-tight text-slate-800">{t(selectedLevel.titleKey)}</h3>
                  </div>
                </div>
              </div>

              {/* Body */}
              <div className="p-5 sm:p-6 space-y-3">
                {/* Mission */}
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-300 mb-1.5">{t('adv.mission')}</p>
                  <div className="bg-[#F8FAFC] rounded-xl p-3.5 sm:p-4">
                    <p className="text-sm font-medium text-slate-600 leading-relaxed">{t(selectedLevel.homeworkKey)}</p>
                  </div>
                </div>

                {/* Phase goal */}
                <div className="flex items-start gap-3 p-3 rounded-xl" style={{ background: modalColor.bg }}>
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 bg-white">
                    <Target size={14} style={{ color: modalColor.accent }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">{t('adv.phaseGoal')}</p>
                    <p className="text-xs font-medium text-slate-600 mt-0.5">{t(selectedLevel.phaseKey + '.goal')}</p>
                  </div>
                </div>

                {/* Reward */}
                <div className="flex items-center gap-3 p-3 rounded-xl border border-slate-100">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: PALETTE.yellow.bg }}>
                    <Gift size={14} style={{ color: PALETTE.yellow.accent }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">{t('adv.reward')}</p>
                    <p className="text-sm font-bold text-slate-800 truncate">{t(selectedLevel.rewardKey)}</p>
                  </div>
                </div>

                {/* Start button */}
                <button
                  onClick={() => setActiveLevelId(selectedLevel.id)}
                  className="w-full py-3.5 rounded-xl font-semibold text-sm text-white flex items-center justify-center gap-2 transition-all hover:opacity-90 active:scale-95"
                  style={{ background: '#1e293b' }}
                >
                  <Zap size={16} /> {t('adv.startLesson')}
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};

export default AdventureMode;
