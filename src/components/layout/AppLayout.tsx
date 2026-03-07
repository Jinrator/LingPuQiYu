import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { ViewMode } from '../../types';
import { viewModeToPath, getViewModeFromPath } from '../../router';
import Navigation from './Navigation';
import AIAssistant from '../ui/AIAssistant';
import ExitConfirmation from '../ui/ExitConfirmation';
import { useExitConfirmation } from '../../hooks/useExitConfirmation';
import { Music4, Settings } from 'lucide-react';
import { PALETTE } from '../../constants/palette';
import { useSettings } from '../../contexts/SettingsContext';

const AUDIO_INIT_KEY = 'shenyin_audio_initialized';

const AppLayout: React.FC = () => {
  const { isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useSettings();
  const [isAudioInitialized, setIsAudioInitialized] = useState(() =>
    sessionStorage.getItem(AUDIO_INIT_KEY) === 'true'
  );
  const { showExitConfirm, hideExitConfirm } = useExitConfirmation();
  const currentView = getViewModeFromPath(location.pathname);

  useEffect(() => {
    if (!isAuthenticated && location.pathname !== '/login') {
      navigate('/login', { replace: true });
    } else if (isAuthenticated && location.pathname === '/login') {
      navigate('/lab', { replace: true });
    }
  }, [isAuthenticated, location.pathname, navigate]);

  useEffect(() => {
    if (isAudioInitialized || !isAuthenticated) return;
    const handleKeyPress = () => initAudio();
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isAudioInitialized, isAuthenticated]);

  const initAudio = async () => {
    if (isAudioInitialized) return;
    try {
      const Ctx = window.AudioContext || (window as any).webkitAudioContext;
      if (Ctx) { const ctx = new Ctx(); await ctx.resume(); }
    } catch {}
    setIsAudioInitialized(true);
    sessionStorage.setItem(AUDIO_INIT_KEY, 'true');
  };

  const handleLogout = () => {
    logout();
    sessionStorage.removeItem(AUDIO_INIT_KEY);
    setIsAudioInitialized(false);
    navigate('/login', { replace: true });
  };

  const handleViewChange = (view: ViewMode) => navigate(viewModeToPath[view]);

  if (!isAuthenticated && location.pathname !== '/login') {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-[#F5F7FA]">
        <div className="text-center">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 mx-auto" style={{ background: PALETTE.blue.bg }}>
            <Music4 size={20} style={{ color: PALETTE.blue.accent }} />
          </div>
          <p className="text-sm font-medium text-slate-400">{t('app.redirecting')}</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="h-screen w-full flex flex-col overflow-hidden bg-[#F5F7FA] select-none">
        <Outlet context={{ theme: 'light' }} />
      </div>
    );
  }

  return (
    <div
      className="min-h-screen w-full bg-[#F5F7FA] select-none"
      onClick={!isAudioInitialized ? initAudio : undefined}
    >
      {/* Navbar — floating island (desktop) */}
      <div className="hidden md:flex sticky top-0 z-30 justify-center px-6 pt-3 pb-0 pointer-events-none">
        <nav className="pointer-events-auto flex items-center justify-between gap-8 px-5 py-2.5 rounded-3xl bg-white shadow-[0_1px_8px_rgba(0,0,0,0.03)] transition-all duration-300 w-full max-w-7xl">
          {/* Left: Logo */}
          <button
            onClick={() => handleViewChange(ViewMode.FREE_LAB)}
            className="flex items-center gap-2.5 pl-1 hover:opacity-80 transition-opacity"
          >
            <div className="w-8 h-8 rounded-lg overflow-hidden">
              <img src="/logo/logo.png" alt="MelodyVerse" className="w-full h-full object-contain" />
            </div>
            <span className="font-fredoka font-bold text-base tracking-tight text-slate-800">{t('app.brand')}</span>
          </button>

          {/* Center: Nav */}
          <div className="flex items-center gap-0.5">
            <Navigation currentView={currentView} onViewChange={handleViewChange} theme="light" />
          </div>

          {/* Right: actions */}
          <div className="flex items-center gap-2 pr-1">
            <button
              onClick={() => handleViewChange(ViewMode.USER_PROFILE)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-500 hover:bg-slate-50 transition-all"
              style={currentView === ViewMode.USER_PROFILE ? { color: '#ffffff', background: '#1e293b' } : {}}
            >
              <div className="w-5 h-5 rounded-full overflow-hidden flex-shrink-0 bg-white">
                <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=JinBot" alt="User" className="w-full h-full object-cover" />
              </div>
              {t('nav.profile')}
            </button>
            <button
              onClick={() => navigate('/settings')}
              className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-all"
              style={location.pathname === '/settings' ? { color: '#ffffff', background: '#1e293b' } : {}}
            >
              <Settings size={16} />
            </button>
          </div>
        </nav>
      </div>

      {/* Mobile top bar */}
      <div className="md:hidden sticky top-0 z-30 flex items-center justify-between px-4 py-2.5 bg-white/90 backdrop-blur-md shadow-[0_1px_6px_rgba(0,0,0,0.03)]">
        <button
          onClick={() => handleViewChange(ViewMode.FREE_LAB)}
          className="flex items-center gap-2 hover:opacity-80 transition-opacity"
        >
          <div className="w-7 h-7 rounded-lg overflow-hidden">
            <img src="/logo/logo.png" alt="MelodyVerse" className="w-full h-full object-contain" />
          </div>
          <span className="font-fredoka font-bold text-sm tracking-tight text-slate-800">{t('app.brand')}</span>
        </button>
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleViewChange(ViewMode.USER_PROFILE)}
            className="w-8 h-8 rounded-xl overflow-hidden flex-shrink-0"
            style={currentView === ViewMode.USER_PROFILE ? { boxShadow: `0 0 0 2px #1e293b` } : {}}
          >
            <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=JinBot" alt="User" className="w-full h-full object-cover" />
          </button>
          <button
            onClick={() => navigate('/settings')}
            className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-all"
            style={location.pathname === '/settings' ? { color: '#ffffff', background: '#1e293b' } : {}}
          >
            <Settings size={16} />
          </button>
        </div>
      </div>

      {/* Mobile bottom nav */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-white/90 backdrop-blur-md px-2 pb-[env(safe-area-inset-bottom)]">
        <div className="flex items-center justify-around py-2">
          <Navigation currentView={currentView} onViewChange={handleViewChange} theme="light" />
        </div>
      </div>

      {/* Main */}
      <main className="pb-16 md:pb-0">
        <Outlet context={{ theme: 'light', onLogout: handleLogout }} />
      </main>

      <AIAssistant theme="light" />
      <ExitConfirmation show={showExitConfirm} theme="light" onHide={hideExitConfirm} />

      {/* Audio init overlay */}
      {!isAudioInitialized && (
        <div className="fixed inset-0 z-[100] bg-white/95 backdrop-blur-xl flex flex-col items-center justify-center text-center p-6">
          <div className="w-20 h-20 rounded-2xl overflow-hidden mb-8">
            <img src="/logo/logo.png" alt="MelodyVerse" className="w-full h-full object-contain" />
          </div>
          <h2 className="font-fredoka font-bold text-4xl text-slate-800 mb-3">{t('app.brandFull')}</h2>
          <p className="text-slate-400 text-sm font-medium max-w-sm mb-2">
            {t('app.slogan')}
          </p>
          <p className="text-slate-300 text-xs mb-10">{t('app.clickToEnter')}</p>
          <button
            onClick={initAudio}
            className="px-12 py-3.5 rounded-xl font-semibold text-sm text-white transition-all hover:opacity-90 active:scale-95"
            style={{ background: '#1e293b' }}
          >
            {t('app.enter')}
          </button>
        </div>
      )}
    </div>
  );
};

export default AppLayout;
