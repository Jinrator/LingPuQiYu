import React, { useState, useEffect, lazy, Suspense } from 'react';
import { ViewMode } from './types';
import FreeLab from './components/modes/FreeLab';
import AIAssistant from './components/ui/AIAssistant';
import AuthPage from './components/layout/AuthPage';
import { useAuth } from './contexts/AuthContext';
import { Music4, Map, Palette, Disc, LogOut, Headphones, Loader2, User } from 'lucide-react';
import { PALETTE } from './constants/palette';
import { useSettings } from './contexts/SettingsContext';

// Lazy load heavy mode components to avoid blocking first render
const AdventureMode = lazy(() => import('./components/modes/AdventureMode'));
const StageMode = lazy(() => import('./components/modes/StageMode'));
const UserProfile = lazy(() => import('./components/layout/UserProfile'));

const LazyFallback: React.FC = () => (
  <div className="h-full w-full flex items-center justify-center bg-[#F5F7FA]">
    <Loader2 size={24} className="animate-spin" style={{ color: PALETTE.blue.accent }} />
  </div>
);

const AUDIO_INIT_KEY = 'shenyin_audio_initialized';

const NAV_ITEMS = [
  { id: ViewMode.ADVENTURE, labelKey: 'nav.adventure', icon: Map,     accent: PALETTE.green },
  { id: ViewMode.FREE_LAB,  labelKey: 'nav.lab',       icon: Palette, accent: PALETTE.blue  },
  { id: ViewMode.STAGE,     labelKey: 'nav.stage',     icon: Disc,    accent: PALETTE.pink  },
];

/** Avatar with fallback — handles external URL failures gracefully */
const Avatar: React.FC<{ src: string; className?: string }> = ({ src, className = '' }) => {
  const [failed, setFailed] = useState(false);
  if (failed) {
    return (
      <div className={`${className} flex items-center justify-center bg-slate-100`}>
        <User size={16} className="text-slate-400" />
      </div>
    );
  }
  return <img src={src} alt="User" className={`${className} object-cover`} onError={() => setFailed(true)} />;
};

const App: React.FC = () => {
  const { isAuthenticated, logout, user } = useAuth();
  const { t } = useSettings();
  const avatarUrl = user?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(user?.id || 'JinBot')}`;
  const [view, setView] = useState<ViewMode>(ViewMode.FREE_LAB);
  const [isAudioInitialized, setIsAudioInitialized] = useState(() =>
    sessionStorage.getItem(AUDIO_INIT_KEY) === 'true'
  );

  useEffect(() => {
    if (isAudioInitialized || !isAuthenticated) return;
    const h = () => initAudio();
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [isAudioInitialized, isAuthenticated]);

  const initAudio = async () => {
    if (isAudioInitialized) return;
    try {
      const Ctx = window.AudioContext || (window as any).webkitAudioContext;
      if (Ctx) { const c = new Ctx(); await c.resume(); }
    } catch {}
    setIsAudioInitialized(true);
    sessionStorage.setItem(AUDIO_INIT_KEY, 'true');
  };

  const handleLogout = () => {
    logout();
    setView(ViewMode.FREE_LAB);
    sessionStorage.removeItem(AUDIO_INIT_KEY);
    setIsAudioInitialized(false);
  };

  if (!isAuthenticated) return <AuthPage theme="light" />;

  return (
    <div
      className="h-screen w-full flex flex-col overflow-hidden bg-[#F5F7FA] select-none"
      onClick={!isAudioInitialized ? initAudio : undefined}
    >
      {/* ── Floating island navbar (desktop) ── */}
      <div className="hidden md:flex flex-shrink-0 items-center justify-center pt-4 px-6 z-30 pointer-events-none">
        <nav className="pointer-events-auto flex items-center gap-1 px-2 py-2 rounded-2xl bg-white/90 backdrop-blur-md shadow-[0_2px_12px_rgba(0,0,0,0.04)] transition-all duration-300">
          {/* Logo */}
          <button
            onClick={() => setView(ViewMode.FREE_LAB)}
            className="flex items-center gap-2 px-3 py-2 rounded-xl transition-all hover:scale-105 active:scale-95 mr-1"
            style={{ background: PALETTE.blue.bg }}
          >
            <div className="w-5 h-5 rounded overflow-hidden">
              <img src="/logo/logo.png" alt="MelodyVerse" className="w-full h-full object-contain" />
            </div>
            <span className="font-fredoka font-bold text-sm tracking-tight" style={{ color: PALETTE.blue.accent }}>{t('app.brand')}</span>
          </button>

          {/* Divider */}
          <div className="w-px h-5 bg-slate-100 mx-1" />

          {/* Nav items */}
          {NAV_ITEMS.map(({ id, labelKey, icon: Icon, accent }) => {
            const active = view === id;
            return (
              <button
                key={id}
                onClick={() => setView(id)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all hover:scale-[1.03] active:scale-95"
                style={active
                  ? { background: '#1e293b', color: '#ffffff' }
                  : { color: '#94A3B8' }
                }
              >
                <Icon size={14} />
                {t(labelKey)}
              </button>
            );
          })}

          {/* Divider */}
          <div className="w-px h-5 bg-slate-100 mx-1" />

          {/* Profile */}
          <button
            onClick={() => setView(ViewMode.USER_PROFILE)}
            className="relative w-9 h-9 rounded-xl overflow-hidden transition-all hover:scale-105 active:scale-95 flex-shrink-0"
            style={view === ViewMode.USER_PROFILE
              ? { boxShadow: `0 0 0 2px ${PALETTE.blue.accent}` }
              : { boxShadow: '0 0 0 2px transparent' }
            }
          >
            <Avatar src={avatarUrl} className="w-full h-full" />
          </button>

          {/* Logout */}
          <button
            onClick={handleLogout}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-300 hover:text-red-400 hover:bg-red-50 transition-all"
          >
            <LogOut size={15} />
          </button>
        </nav>
      </div>

      {/* ── Mobile top bar ── */}
      <div className="md:hidden flex-shrink-0 flex items-center justify-between px-4 py-3 bg-white/90 backdrop-blur-md shadow-[0_1px_6px_rgba(0,0,0,0.03)] z-30">
        <button
          onClick={() => setView(ViewMode.FREE_LAB)}
          className="flex items-center gap-2.5 hover:opacity-80 transition-opacity"
        >
          <div className="w-8 h-8 rounded overflow-hidden">
            <img src="/logo/logo.png" alt="MelodyVerse" className="w-full h-full object-contain" />
          </div>
          <span className="font-fredoka font-bold text-base tracking-tight" style={{ color: PALETTE.blue.accent }}>{t('app.brand')}</span>
        </button>
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setView(ViewMode.USER_PROFILE)}
            className="w-9 h-9 rounded-xl overflow-hidden flex-shrink-0"
            style={view === ViewMode.USER_PROFILE ? { boxShadow: `0 0 0 2px ${PALETTE.blue.accent}` } : {}}
          >
            <Avatar src={avatarUrl} className="w-full h-full" />
          </button>
          <button
            onClick={handleLogout}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-300 hover:text-red-400 hover:bg-red-50 transition-all"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>

      {/* ── Main content ── */}
      <main className="flex-1 overflow-hidden relative">
        <Suspense fallback={<LazyFallback />}>
          {view === ViewMode.ADVENTURE    && <AdventureMode theme="light" />}
          {view === ViewMode.FREE_LAB     && <FreeLab theme="light" />}
          {view === ViewMode.STAGE        && <StageMode theme="light" />}
          {view === ViewMode.USER_PROFILE && <UserProfile theme="light" onLogout={handleLogout} />}
        </Suspense>
      </main>

      {/* ── Mobile bottom nav ── */}
      <div className="md:hidden flex-shrink-0 flex items-center justify-around bg-white/90 backdrop-blur-md border-t border-slate-100 px-2 py-2.5 pb-[calc(0.625rem+env(safe-area-inset-bottom))] z-30">
        {NAV_ITEMS.map(({ id, labelKey, icon: Icon, accent }) => {
          const active = view === id;
          return (
            <button
              key={id}
              onClick={() => setView(id)}
              className="flex flex-col items-center gap-1 px-4 py-1.5 rounded-xl text-xs font-semibold transition-all"
              style={active ? { color: '#1e293b' } : { color: '#94A3B8' }}
            >
              <Icon size={20} />
              {t(labelKey)}
            </button>
          );
        })}
      </div>

      <AIAssistant theme="light" />

      {/* Audio init overlay */}
      {!isAudioInitialized && (
        <div className="fixed inset-0 z-[100] bg-white/96 backdrop-blur-xl flex flex-col items-center justify-center text-center p-6">
          {/* Decorative blocks */}
          <div className="absolute top-[-40px] right-[-40px] w-64 h-64 rounded-3xl rotate-12 opacity-40 pointer-events-none"
            style={{ background: PALETTE.blue.bg, border: `2px solid ${PALETTE.blue.accent}22` }} />
          <div className="absolute bottom-[-20px] left-[-20px] w-48 h-48 rounded-2xl -rotate-6 opacity-30 pointer-events-none"
            style={{ background: PALETTE.pink.bg, border: `2px solid ${PALETTE.pink.accent}22` }} />

          <div className="relative z-10 flex flex-col items-center">
            <div
              className="w-16 h-16 rounded-2xl overflow-hidden mb-6 shadow-sm"
            >
              <img src="/logo/logo.png" alt="MelodyVerse" className="w-full h-full object-contain" />
            </div>
            <h2 className="font-fredoka font-bold text-3xl sm:text-4xl text-slate-800 mb-6 tracking-tight">{t('app.brand')}</h2>
            <p className="text-slate-400 text-base sm:text-sm font-medium max-w-xs mb-1 leading-relaxed">
              {t('app.slogan')}
            </p>
            <p className="text-slate-400 text-sm sm:text-xs mb-10">{t('app.clickToEnter')}</p>
            <button
              onClick={initAudio}
              className="px-10 py-3.5 rounded-xl font-semibold text-base sm:text-sm text-white transition-all hover:opacity-90 active:scale-95 shadow-sm"
              style={{ background: '#1e293b' }}
            >
              {t('app.enter')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
