import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Compass, Play, Pause, ArrowRight, Heart, Star, Ghost, X } from 'lucide-react';
import { audioService } from '../../services/audioService';
import { NOTES, CHORDS } from '../../utils/musicNotes';
import { PALETTE } from '../../constants/palette';
import ProjectShell from './ProjectShell';

interface Route {
  id: string; name: string; desc: string; icon: React.ReactNode;
  paletteKey: keyof typeof PALETTE; progression: string[];
}

const ROUTES: Route[] = [
  { id: 'A', name: '无敌幸运星', desc: '英雄出发，充满希望与力量', icon: <Star size={20} />, paletteKey: 'yellow', progression: ['C','G','Am','F'] },
  { id: 'B', name: '甜甜圈派对', desc: '甜美可爱，像好朋友在野餐', icon: <Heart size={20} />, paletteKey: 'pink', progression: ['C','Am','F','G'] },
  { id: 'C', name: '神秘森林', desc: '酷酷的忧伤，带点神秘感', icon: <Ghost size={20} />, paletteKey: 'blue', progression: ['Am','F','C','G'] },
];

const ChordRouteProject: React.FC<{ onComplete: () => void; onBack: () => void; theme?: 'light' | 'dark' }> = ({ onComplete, onBack }) => {
  const [selectedRoute, setSelectedRoute] = useState<Route | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStep, setCurrentStep] = useState(-1);
  const [showAIQuestion, setShowAIQuestion] = useState(false);
  const [hasTestedTension, setHasTestedTension] = useState(false);
  const timerRef = useRef<number | null>(null);

  const playChord = useCallback((chordName: string) => {
    const chord = CHORDS[chordName];
    if (chord) audioService.playPianoChord(chord, 1.2, 0.6);
  }, []);

  useEffect(() => {
    if (isPlaying && selectedRoute) {
      timerRef.current = window.setInterval(() => {
        setCurrentStep(prev => {
          const next = (prev + 1) % 4;
          if (next === 0 && prev === 3 && !hasTestedTension) {
            setIsPlaying(false); setShowAIQuestion(true); setHasTestedTension(true); return 3;
          }
          playChord(selectedRoute.progression[next]);
          return next;
        });
      }, 1200);
    } else { if (timerRef.current) clearInterval(timerRef.current); }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isPlaying, selectedRoute, playChord, hasTestedTension]);

  const handleSelectRoute = (route: Route) => {
    setSelectedRoute(route); setCurrentStep(-1); setIsPlaying(true); setShowAIQuestion(false);
  };

  const handleGoHome = () => {
    setShowAIQuestion(false); setIsPlaying(true);
    if (selectedRoute) { playChord(selectedRoute.progression[0]); setCurrentStep(0); }
  };

  return (
    <ProjectShell lessonId={9} title="音乐探险路线" subtitle="CHORD PROGRESSION ROUTES" color="yellow"
      actionLabel="铺设歌曲骨架" actionEnabled={!!selectedRoute} onAction={onComplete} onBack={onBack} footerText="Harmonic Route Engine · L9">

      {/* AI tip */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-[0_1px_4px_rgba(0,0,0,0.02)] p-4 sm:p-5 mb-4"
        style={{ borderLeftColor: PALETTE.blue.accent, borderLeftWidth: 3 }}>
        <div className="flex gap-3 items-start">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0" style={{ background: PALETTE.blue.bg }}>🤖</div>
          <div>
            <h3 className="text-sm font-bold text-slate-800 mb-1">AI 助教：离家去远航</h3>
            <p className="text-xs font-medium text-slate-500 leading-relaxed">
              一直待在家里（1级和弦）虽然舒服，但没有故事。我们需要出门旅行，最后再回到家。请尝试不同的探险路线，听听哪一个最适合你的旋律。
            </p>
          </div>
        </div>
      </div>

      {/* Route selector */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-4 sm:mb-6">
        {ROUTES.map(route => {
          const color = PALETTE[route.paletteKey];
          const isSelected = selectedRoute?.id === route.id;
          return (
            <button key={route.id} onClick={() => handleSelectRoute(route)}
              className="p-4 sm:p-5 rounded-2xl border-2 transition-all flex flex-col items-center gap-3 text-center hover:scale-[1.02] active:scale-95"
              style={isSelected
                ? { background: color.bg, borderColor: color.accent, color: color.accent }
                : { background: '#F8FAFC', borderColor: '#E2E8F0', color: '#94A3B8' }
              }>
              <div className="w-12 h-12 rounded-xl flex items-center justify-center"
                style={isSelected ? { background: color.accent, color: '#fff' } : { background: '#F8FAFC' }}>
                {route.icon}
              </div>
              <h4 className="text-sm font-bold">{route.name}</h4>
              <p className="text-[10px] font-semibold uppercase tracking-widest">Route {route.id}</p>
              <p className="text-xs font-medium" style={{ color: isSelected ? color.accent : '#94A3B8' }}>{route.desc}</p>
            </button>
          );
        })}
      </div>

      {/* Chord visualization */}
      <div className="flex items-center gap-2 sm:gap-3">
        {[0,1,2,3].map(s => {
          const routeColor = selectedRoute ? PALETTE[selectedRoute.paletteKey] : PALETTE.blue;
          return (
            <div key={s} className="flex-1 flex flex-col items-center gap-2">
              <div className={`w-full h-16 sm:h-20 rounded-xl border-2 transition-all flex flex-col items-center justify-center ${currentStep === s ? 'scale-105' : 'opacity-30'}`}
                style={currentStep === s ? { background: '#fff', borderColor: routeColor.accent } : { background: '#F8FAFC', borderColor: '#E2E8F0' }}>
                {selectedRoute && (
                  <>
                    <span className="text-base sm:text-lg font-bold" style={{ color: currentStep === s ? routeColor.accent : '#94A3B8' }}>
                      {selectedRoute.progression[s]}
                    </span>
                    <span className="text-[10px] font-semibold text-slate-300">
                      {s === 0 ? '家 (Tonic)' : s === 3 ? '悬念' : '出发'}
                    </span>
                  </>
                )}
              </div>
              <div className="w-2 h-2 rounded-full transition-all" style={{ background: currentStep === s ? routeColor.accent : '#E2E8F0' }} />
            </div>
          );
        })}
      </div>

      {/* AI tension test modal */}
      {showAIQuestion && (
        <div className="fixed inset-0 z-[250] bg-slate-900/30 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-6">
          <div className="w-full sm:max-w-md bg-white rounded-t-2xl sm:rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.06)] p-6 sm:p-8 flex flex-col items-center gap-5 text-center">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl" style={{ background: PALETTE.blue.bg }}>🤔</div>
            <h3 className="text-base font-bold text-slate-800">听出这种"悬念"了吗？</h3>
            <p className="text-sm font-medium text-slate-500 leading-relaxed">
              现在音乐停在第 4 个和弦。是不是有一种"没说完，急着想回第一个音（家）"的感觉？
            </p>
            <button onClick={handleGoHome}
              className="w-full py-3.5 rounded-xl font-semibold text-sm text-white flex items-center justify-center gap-2 transition-all hover:opacity-90 active:scale-95 bg-[#1e293b]">
              让它回"家" <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}
    </ProjectShell>
  );
};

export default ChordRouteProject;
