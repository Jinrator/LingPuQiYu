import React, { useState, useEffect } from 'react';
import { ViewMode } from './types';
import AdventureMode from './components/modes/AdventureMode';
import FreeLab from './components/modes/FreeLab';
import StageMode from './components/modes/StageMode';
import UserProfile from './components/layout/UserProfile';
import AIAssistant from './components/ui/AIAssistant';
import AuthPage from './components/layout/AuthPage';
import { useAuth } from './contexts/AuthContext';
import { Music4, Map, Palette, Disc, LogOut, Headphones } from 'lucide-react';
import { PALETTE } from './constants/palette';

const AUDIO_INIT_KEY = 'shenyin_audio_initialized';

const NAV_ITEMS = [
  { id: ViewMode.ADVENTURE, label: '冒险模式', icon: Map,     accent: PALETTE.green },
  { id: ViewMode.FREE_LAB,  label: '自由工坊', icon: Palette, accent: PALETTE.blue  },
  { id: ViewMode.STAGE,     label: '演出舞台', icon: Disc,    accent: PALETTE.pink  },
];

const App: React.FC = () => {
  const { isAuthenticated, logout } = useAuth();
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
      {/* ── Floating island navbar ── */}
      <div className="flex-shrink-0 flex items-center justify-center pt-4 px-6 z-30 pointer-events-none">
        <nav className="pointer-events-auto flex items-center gap-1 px-2 py-2 rounded-2xl bg-white/90 backdrop-blur-md shadow-[0_4px_24px_rgba(0,0,0,0.08)] transition-all duration-300">
          {/* Logo */}
          <button
            onClick={() => setView(ViewMode.FREE_LAB)}
            className="flex items-center gap-2 px-3 py-2 rounded-xl transition-all hover:scale-105 active:scale-95 mr-1"
            style={{ background: PALETTE.blue.bg }}
          >
            <div className="w-5 h-5 rounded overflow-hidden">
              <img src="/samples/logo/logo.png" alt="生音科技" className="w-full h-full object-contain" />
            </div>
            <span className="font-fredoka font-bold text-sm tracking-tight" style={{ color: PALETTE.blue.accent }}>生音科技</span>
          </button>

          {/* Divider */}
          <div className="w-px h-5 bg-slate-100 mx-1" />

          {/* Nav items */}
          {NAV_ITEMS.map(({ id, label, icon: Icon, accent }) => {
            const active = view === id;
            return (
              <button
                key={id}
                onClick={() => setView(id)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all hover:scale-[1.03] active:scale-95"
                style={active
                  ? { background: accent.bg, color: accent.accent }
                  : { color: '#94A3B8' }
                }
              >
                <Icon size={14} />
                {label}
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
            <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=JinBot" alt="User" className="w-full h-full object-cover" />
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

      {/* ── Main content ── */}
      <main className="flex-1 overflow-hidden relative">
        {view === ViewMode.ADVENTURE    && <AdventureMode theme="light" />}
        {view === ViewMode.FREE_LAB     && <FreeLab theme="light" />}
        {view === ViewMode.STAGE        && <StageMode theme="light" />}
        {view === ViewMode.USER_PROFILE && <UserProfile theme="light" onLogout={handleLogout} />}
      </main>

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
              <img src="/samples/logo/logo.png" alt="生音科技" className="w-full h-full object-contain" />
            </div>
            <h2 className="font-fredoka font-bold text-4xl text-slate-800 mb-2 tracking-tight">生音科技</h2>
            <p className="text-[10px] font-semibold uppercase tracking-widest mb-6" style={{ color: PALETTE.blue.accent }}>
              灵谱奇域
            </p>
            <p className="text-slate-400 text-sm font-medium max-w-xs mb-1 leading-relaxed">
              每一个孩子都可以在音乐中快乐成长
            </p>
            <p className="text-slate-300 text-xs mb-10">点击任意位置或按任意键进入</p>
            <button
              onClick={initAudio}
              className="px-10 py-3.5 rounded-xl font-semibold text-sm text-white transition-all hover:opacity-90 active:scale-95 shadow-sm"
              style={{ background: '#1e293b' }}
            >
              立即进入
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
