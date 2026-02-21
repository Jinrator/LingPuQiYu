import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { ViewMode } from '../../types';
import { viewModeToPath, getViewModeFromPath } from '../../router';
import Navigation from './Navigation';
import AIAssistant from '../ui/AIAssistant';
import ExitConfirmation from '../ui/ExitConfirmation';
import { useExitConfirmation } from '../../hooks/useExitConfirmation';
import { Sun, Moon, LogOut } from 'lucide-react';

const AUDIO_INIT_KEY = 'shenyin_audio_initialized';

const AppLayout: React.FC = () => {
  const { isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [isAudioInitialized, setIsAudioInitialized] = useState(() => {
    return sessionStorage.getItem(AUDIO_INIT_KEY) === 'true';
  });

  // 退出确认功能（可选）
  const { showExitConfirm, hideExitConfirm } = useExitConfirmation();

  // 根据当前路径获取视图模式（支持多层级）
  const currentView = getViewModeFromPath(location.pathname);

  // 处理认证状态变化
  useEffect(() => {
    if (!isAuthenticated && location.pathname !== '/login') {
      navigate('/login', { replace: true });
    } else if (isAuthenticated && location.pathname === '/login') {
      navigate('/lab', { replace: true });
    }
  }, [isAuthenticated, location.pathname, navigate]);

  // 添加键盘事件监听，用于音频初始化
  useEffect(() => {
    if (isAudioInitialized || !isAuthenticated) return;

    const handleKeyPress = () => initAudio();
    window.addEventListener('keydown', handleKeyPress);
    
    return () => {
      window.removeEventListener('keydown', handleKeyPress);
    };
  }, [isAudioInitialized, isAuthenticated]);

  const initAudio = async () => {
    if (isAudioInitialized) return;
    
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        const tempCtx = new AudioContextClass();
        await tempCtx.resume();
        console.log('Audio Engine Unlocked');
      }
    } catch (e) {
      console.warn('Audio unlock failed', e);
    }
    
    setIsAudioInitialized(true);
    sessionStorage.setItem(AUDIO_INIT_KEY, 'true');
  };

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const handleLogout = () => {
    logout();
    sessionStorage.removeItem(AUDIO_INIT_KEY);
    setIsAudioInitialized(false);
    navigate('/login', { replace: true });
  };

  const handleViewChange = (view: ViewMode) => {
    const path = viewModeToPath[view];
    navigate(path);
  };

  // 如果未认证且不在登录页，显示加载状态而不是白页
  if (!isAuthenticated && location.pathname !== '/login') {
    return (
      <div className={`h-screen w-full flex items-center justify-center transition-colors duration-700 ${theme === 'dark' ? 'bg-[#000b1a] text-slate-100' : 'bg-[#f8fafc] text-slate-900'}`}>
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl animate-pulse flex items-center justify-center mb-4 mx-auto">
            <span className="text-2xl">🎵</span>
          </div>
          <p className="text-slate-500">正在跳转到登录页面...</p>
        </div>
      </div>
    );
  }

  // 如果未认证，只显示登录页面
  if (!isAuthenticated) {
    return (
      <div className={`h-screen w-full flex flex-col overflow-hidden transition-colors duration-700 ${theme === 'dark' ? 'bg-[#000b1a] text-slate-100' : 'bg-[#f8fafc] text-slate-900'} select-none`}>
        <Outlet context={{ theme }} />
      </div>
    );
  }

  return (
    <div 
      className={`h-screen w-full flex flex-col overflow-hidden transition-colors duration-700 ${theme === 'dark' ? 'bg-[#000b1a] text-slate-100' : 'bg-[#f8fafc] text-slate-900'} select-none`}
      onClick={!isAudioInitialized ? initAudio : undefined}
    >
      {/* 科技感背景装饰 */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className={`absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full blur-[150px] transition-opacity duration-1000 ${theme === 'dark' ? 'bg-blue-600/10 opacity-100' : 'bg-blue-400/20 opacity-60'}`}></div>
        <div className={`absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full blur-[120px] transition-opacity duration-1000 ${theme === 'dark' ? 'bg-sky-400/10 opacity-100' : 'bg-blue-200/30 opacity-60'}`}></div>
      </div>

      <header className="relative z-10 flex items-center justify-between px-10 py-8">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-4">
            <div className="relative group cursor-pointer" onClick={() => handleViewChange(ViewMode.FREE_LAB)}>
              <div className={`absolute inset-0 bg-blue-400 blur-md opacity-20 group-hover:opacity-40 transition-opacity`}></div>
              <div className="relative w-14 h-14 bg-gradient-to-br from-[#00b4ff] to-[#0052cc] rounded-2xl flex items-center justify-center border border-white/20 transform rotate-[-5deg]">
                <svg viewBox="0 0 100 100" className="w-10 h-10 text-white fill-current">
                  <path d="M20,40 Q20,20 50,20 Q80,20 80,40 L80,50 Q80,60 70,60 L40,60 L40,45 L65,45 L65,50 L35,50 L35,70 Q35,85 65,85 Q95,85 95,60" fill="none" stroke="currentColor" strokeWidth="8" strokeLinecap="round"/>
                </svg>
              </div>
            </div>
            <div className="flex flex-col">
              <h1 className={`text-3xl font-fredoka tracking-tighter drop-shadow-[0_0_10px_rgba(255,255,255,0.3)] transition-colors ${theme === 'dark' ? 'text-white' : 'text-blue-900'}`}>
                生音科技
              </h1>
              <span className="text-[10px] font-black text-blue-500 tracking-[0.4em] uppercase leading-none mt-1">灵谱奇域</span>
            </div>
          </div>
          
          {/* 模式切换开关 */}
          <div className="flex items-center gap-3">
            <button 
              onClick={(e) => { e.stopPropagation(); toggleTheme(); }}
              className={`flex items-center gap-2 px-4 py-2 rounded-full border transition-all duration-500 ${theme === 'dark' ? 'bg-white/5 border-white/10 text-blue-400' : 'bg-blue-100 border-blue-200 text-blue-700'}`}
            >
              {theme === 'dark' ? <Moon size={18} /> : <Sun size={18} />}
              <span className="text-xs font-black uppercase tracking-widest">{theme === 'dark' ? '夜晚' : '白天'}</span>
            </button>
            <button 
              onClick={() => handleViewChange(ViewMode.USER_PROFILE)}
              className={`flex items-center gap-3 px-1.5 py-1.5 rounded-full border transition-all ${currentView === ViewMode.USER_PROFILE ? 'bg-blue-600 border-blue-400 text-white' : theme === 'dark' ? 'bg-white/5 border-white/10 text-slate-400 hover:text-white' : 'bg-white border-blue-100 text-blue-600'}`}
            >
              <div className="w-8 h-8 rounded-full bg-slate-200 overflow-hidden border-2 border-white/20">
                <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=JinBot" alt="User" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest pr-2 hidden sm:inline">我的档案</span>
            </button>
            <button 
              onClick={handleLogout}
              className={`flex items-center gap-2 px-4 py-2 rounded-full border transition-all ${theme === 'dark' ? 'bg-white/5 border-white/10 text-slate-400 hover:text-red-400 hover:border-red-500/30' : 'bg-white border-blue-100 text-slate-500 hover:text-red-500 hover:border-red-200'}`}
              title="退出登录"
            >
              <LogOut size={16} />
              <span className="text-[10px] font-black uppercase tracking-widest hidden sm:inline">退出</span>
            </button>
          </div>
        </div>
        
        <Navigation currentView={currentView} onViewChange={handleViewChange} theme={theme} />
      </header>

      <main className="flex-1 relative z-10 overflow-hidden">
        <Outlet context={{ theme, onLogout: handleLogout }} />
      </main>

      <AIAssistant theme={theme} />
      
      {/* 退出确认提示（可选功能） */}
      <ExitConfirmation 
        show={showExitConfirm} 
        theme={theme} 
        onHide={hideExitConfirm} 
      />
      
      {!isAudioInitialized && (
        <div className={`fixed inset-0 z-[100] backdrop-blur-xl flex flex-col items-center justify-center text-center p-6 transition-colors duration-500 ${theme === 'dark' ? 'bg-[#000b1a]/90' : 'bg-white/90'}`}>
           <div className="w-28 h-28 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-[2.5rem] animate-bounce-subtle flex items-center justify-center mb-8 border border-white/20">
             <span className="text-5xl">🎧</span>
           </div>
           <h2 className={`text-4xl font-fredoka mb-4 transition-colors ${theme === 'dark' ? 'text-white' : 'text-blue-900'}`}>生音科技 · 灵谱奇域</h2>
           <p className="text-blue-400 max-w-lg mb-6 font-medium text-lg">每一个孩子都可以在音乐中快乐成长，<br/>成为自己人生的的建筑师。</p>
           <p className={`text-sm mb-10 opacity-70 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}>
             点击按钮、按任意键或点击屏幕任意位置即可进入
           </p>
           <button 
             onClick={initAudio}
             className={`px-16 py-5 rounded-full font-black text-xl transition-all active:scale-95 ${theme === 'dark' ? 'bg-white text-blue-900 hover:bg-blue-50' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
           >
             立即进入
           </button>
        </div>
      )}
    </div>
  );
};

export default AppLayout;