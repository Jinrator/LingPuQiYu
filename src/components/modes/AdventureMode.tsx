
import React, { useState } from 'react';
import { ADVENTURE_LEVELS, AdventureLevel } from '../../constants';
import { Lock, Star, Trophy, Sparkles, X, CheckCircle2, PlayCircle, Gift, ArrowRightCircle, ShieldAlert } from 'lucide-react';
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

interface AdventureModeProps {
  theme?: 'light' | 'dark';
}

const AdventureMode: React.FC<AdventureModeProps> = ({ theme = 'dark' }) => {
  const [selectedLevel, setSelectedLevel] = useState<AdventureLevel | null>(null);
  const [activeLevelId, setActiveLevelId] = useState<number | null>(null);
  const isDark = theme === 'dark';

  const categories: ('初级' | '中级' | '高级')[] = ['初级', '中级', '高级'];

  const getCategoryTheme = (category: string) => {
    switch (category) {
      case '初级':
        return {
          icon: '🌱',
          label: '新手制作人 · 15课完整地图',
          color: 'from-emerald-400 to-teal-600',
          bg: isDark ? 'bg-emerald-500/10' : 'bg-emerald-50',
          text: isDark ? 'text-emerald-400' : 'text-emerald-600'
        };
      case '中级':
        return {
          icon: '⚡',
          label: '进阶课程 · 即将开启',
          color: 'from-blue-400 to-indigo-600',
          bg: isDark ? 'bg-blue-500/10' : 'bg-blue-50',
          text: isDark ? 'text-blue-400' : 'text-blue-600'
        };
      case '高级':
        return {
          icon: '👑',
          label: '大师课程 · 敬请期待',
          color: 'from-purple-400 to-rose-600',
          bg: isDark ? 'bg-purple-500/10' : 'bg-purple-50',
          text: isDark ? 'text-purple-400' : 'text-purple-600'
        };
      default:
        return { icon: '❓', label: '未知', color: 'from-slate-400 to-slate-600', bg: 'bg-slate-500/10', text: 'text-slate-400' };
    }
  };

  const handleLevelComplete = () => {
    setActiveLevelId(null);
    setSelectedLevel(null);
  };

  const renderActiveLevel = () => {
    switch(activeLevelId) {
      case 1: return <SoundHuntingProject theme={theme} onComplete={handleLevelComplete} onBack={() => setActiveLevelId(null)} />;
      case 2: return <RhythmColoringProject theme={theme} onComplete={handleLevelComplete} onBack={() => setActiveLevelId(null)} />;
      case 3: return <RhythmLegoProject theme={theme} onComplete={handleLevelComplete} onBack={() => setActiveLevelId(null)} />;
      case 4: return <PitchLadderProject theme={theme} onComplete={handleLevelComplete} onBack={() => setActiveLevelId(null)} />;
      case 5: return <MoodDoodleProject theme={theme} onComplete={handleLevelComplete} onBack={() => setActiveLevelId(null)} />;
      case 6: return <MelodyMirrorProject theme={theme} onComplete={handleLevelComplete} onBack={() => setActiveLevelId(null)} />;
      case 7: return <InspirationRetroProject theme={theme} onComplete={handleLevelComplete} onBack={() => setActiveLevelId(null)} />;
      case 8: return <ChordBurgerProject theme={theme} onComplete={handleLevelComplete} onBack={() => setActiveLevelId(null)} />;
      case 9: return <ChordRouteProject theme={theme} onComplete={handleLevelComplete} onBack={() => setActiveLevelId(null)} />;
      case 10: return <StyleTransformProject theme={theme} onComplete={handleLevelComplete} onBack={() => setActiveLevelId(null)} />;
      case 11: return <MusicAtlasProject theme={theme} onComplete={handleLevelComplete} onBack={() => setActiveLevelId(null)} />;
      case 12: return <MemoryHookProject theme={theme} onComplete={handleLevelComplete} onBack={() => setActiveLevelId(null)} />;
      case 13: return <MusicTrainProject theme={theme} onComplete={handleLevelComplete} onBack={() => setActiveLevelId(null)} />;
      case 14: return <AIRecordingStudioProject theme={theme} onComplete={handleLevelComplete} onBack={() => setActiveLevelId(null)} />;
      case 15: return <PersonalDebutProject theme={theme} onComplete={handleLevelComplete} onBack={() => setActiveLevelId(null)} />;
      default: return null;
    }
  };

  const activeLevelView = renderActiveLevel();
  if (activeLevelView) return activeLevelView;

  return (
    <div className={`h-full flex flex-col items-center px-8 pb-32 overflow-y-auto animate-in zoom-in duration-700 scrollbar-hide transition-colors duration-500 ${isDark ? 'bg-[radial-gradient(circle_at_50%_50%,rgba(15,23,42,1)_0%,rgba(2,6,23,1)_100%)]' : 'bg-white'}`}>
      <div className="max-w-6xl w-full py-20 relative">
        <header className="text-center mb-28 relative z-10">
          <div className={`inline-block px-6 py-2 border rounded-full mb-6 shadow-xl backdrop-blur-md transition-colors ${isDark ? 'bg-blue-500/10 border-blue-500/30' : 'bg-blue-50 border-blue-200'}`}>
             <span className={`text-sm font-black tracking-[0.3em] uppercase ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>ADVENTURE MAP</span>
          </div>
          <h2 className={`text-7xl font-fredoka mb-6 drop-shadow-xl tracking-tight transition-all duration-500 ${isDark ? 'bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-sky-300 to-blue-400' : 'text-blue-900'}`}>
            生音探险地图
          </h2>
          <p className={`text-xl font-medium max-w-2xl mx-auto leading-relaxed transition-colors ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
            完成 15 节挑战课程，解锁全套音色徽章。你的音乐传奇从这里开始！✨
          </p>
        </header>

        <div className="flex flex-col gap-24 relative">
          {categories.map((cat) => {
            const catTheme = getCategoryTheme(cat);
            const levelInSection = ADVENTURE_LEVELS.filter(l => l.category === cat);
            const isSectionLocked = cat !== '初级';

            return (
              <div key={cat} className={`relative rounded-[4rem] p-12 border-4 transition-all duration-700 ${isSectionLocked ? 'opacity-40 grayscale pointer-events-none' : 'opacity-100'} ${isDark ? 'border-white/5 bg-slate-900/40 shadow-2xl' : 'border-blue-50 bg-slate-50/50 shadow-xl'}`}>
                <div className="flex items-center justify-between mb-16 px-4">
                  <div className="flex items-center gap-6">
                    <div className={`w-20 h-20 rounded-3xl bg-gradient-to-br ${catTheme.color} flex items-center justify-center text-4xl shadow-2xl border border-white/20 transform rotate-[-5deg]`}>
                      {catTheme.icon}
                    </div>
                    <div>
                      <div className="flex items-center gap-3">
                        <h3 className={`text-4xl font-black tracking-tight transition-colors ${isDark ? 'text-white' : 'text-blue-950'}`}>{cat}模式</h3>
                        {isSectionLocked && (
                          <div className="flex items-center gap-2 px-3 py-1 bg-rose-500/10 text-rose-500 rounded-full text-xs font-black uppercase border border-rose-500/20">
                            <Lock size={14} />
                            暂未解锁
                          </div>
                        )}
                      </div>
                      <p className={`font-bold text-lg mt-1 transition-colors ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                        {catTheme.label}
                      </p>
                    </div>
                  </div>
                </div>

                {!isSectionLocked && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-y-16 gap-x-8 px-4">
                    {levelInSection.map((level) => (
                      <button 
                        key={level.id}
                        onClick={() => level.unlocked && setSelectedLevel(level)}
                        className={`relative group flex flex-col items-center transition-all duration-500 ${!level.unlocked ? 'cursor-not-allowed' : 'hover:scale-110 active:scale-95'}`}
                      >
                        <div className={`w-32 h-32 rounded-[2.5rem] flex items-center justify-center shadow-2xl relative border-4 transition-all duration-500 ${level.completed ? 'bg-gradient-to-br from-emerald-400 to-teal-500 border-emerald-300/40 shadow-emerald-500/20' : level.unlocked ? `bg-gradient-to-br ${catTheme.color} border-white/20 shadow-blue-500/20` : isDark ? 'bg-slate-800 border-slate-700 opacity-40' : 'bg-slate-100 border-slate-200 opacity-50'}`}>
                          {level.unlocked ? <span className="text-5xl filter drop-shadow-lg group-hover:rotate-12 transition-transform duration-500">{level.icon}</span> : <Lock className={isDark ? 'text-slate-600' : 'text-slate-400'} size={36} />}
                          {level.completed && <div className="absolute -top-3 -right-3 bg-emerald-500 text-white rounded-2xl p-2 shadow-2xl ring-4 ring-white z-20"><CheckCircle2 size={20} /></div>}
                          {level.unlocked && !level.completed && <div className="absolute inset-[-4px] border-4 border-blue-400 rounded-[2.5rem] animate-ping opacity-20 pointer-events-none" />}
                        </div>
                        <div className="mt-4 flex flex-col items-center gap-1">
                          <span className={`text-base font-black tracking-tight transition-colors ${level.unlocked ? isDark ? 'text-white' : 'text-blue-900' : isDark ? 'text-slate-600' : 'text-slate-400'}`}>L{level.id} {level.title}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {selectedLevel && (
          <div className="fixed inset-0 z-[120] backdrop-blur-3xl flex items-center justify-center p-6 animate-in fade-in zoom-in duration-300 bg-slate-950/70">
             <div className={`w-full max-w-xl rounded-[4rem] overflow-hidden shadow-2xl border transition-all duration-500 ${isDark ? 'bg-slate-900 border-white/5' : 'bg-white border-blue-100'}`}>
                <div className={`relative p-12 bg-gradient-to-br ${getCategoryTheme(selectedLevel.category).color} text-white overflow-hidden`}>
                  <div className="absolute -top-20 -right-20 w-80 h-80 bg-white/10 rounded-full blur-[100px]" />
                  <button onClick={() => setSelectedLevel(null)} className="absolute top-10 right-10 p-3 bg-black/20 hover:bg-black/40 rounded-full transition-all hover:rotate-90"><X size={24} /></button>
                  <div className="flex items-center gap-8 mb-8 relative z-10">
                    <div className="w-24 h-24 bg-white/20 backdrop-blur-2xl rounded-[2.5rem] flex items-center justify-center text-5xl border border-white/30">{selectedLevel.icon}</div>
                    <div>
                      <h4 className="text-xs font-black tracking-[0.4em] text-white/60 uppercase mb-2">LESSON {selectedLevel.id}</h4>
                      <h3 className="text-4xl font-fredoka tracking-tight leading-none">{selectedLevel.title}</h3>
                    </div>
                  </div>
                </div>
                <div className="p-12 flex flex-col gap-10">
                   <div className={`rounded-[3rem] p-8 border shadow-inner transition-colors ${isDark ? 'bg-slate-800/40 border-slate-700/30' : 'bg-blue-50/50 border-blue-100'}`}>
                      <p className={`text-2xl font-bold leading-relaxed transition-colors ${isDark ? 'text-slate-100' : 'text-blue-950'}`}>“ {selectedLevel.homework} ”</p>
                   </div>
                   <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                         <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border transition-colors ${isDark ? 'bg-yellow-500/10 border-yellow-500/20' : 'bg-yellow-50 border-yellow-200'}`}><Gift className="text-yellow-500" size={28} /></div>
                         <div>
                            <div className="text-xs text-slate-500 font-black uppercase mb-1">解锁徽章</div>
                            <div className={`text-xl font-black transition-colors ${isDark ? 'text-white' : 'text-blue-950'}`}>{selectedLevel.reward}</div>
                         </div>
                      </div>
                      <button 
                        onClick={() => setActiveLevelId(selectedLevel.id)} 
                        className="px-12 py-5 bg-blue-600 rounded-[2rem] font-black text-xl text-white shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center gap-3"
                      >
                        开启课程 <ArrowRightCircle size={24} />
                      </button>
                   </div>
                </div>
             </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdventureMode;
