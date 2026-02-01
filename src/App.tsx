
import React, { useState, useEffect } from 'react';
import { ViewMode } from './types';
import AdventureMode from './components/modes/AdventureMode';
import FreeLab from './components/modes/FreeLab';
import StageMode from './components/modes/StageMode';
import UserProfile from './components/layout/UserProfile';
import AIAssistant from './components/ui/AIAssistant';
import Navigation from './components/layout/Navigation';
import AuthPage from './components/layout/AuthPage';
import { Sun, Moon, LogOut, User } from 'lucide-react';

const App: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [view, setView] = useState<ViewMode>(ViewMode.FREE_LAB);
  const [theme, setTheme] = useState<'light' | 'dark'>('light'); // 默认改为白天模式
  const [isAudioInitialized, setIsAudioInitialized] = useState(false);

  const initAudio = async () => {
    if (isAudioInitialized) return;
    
    // 尝试创建一个临时的 AudioContext 来解锁浏览器音频
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
  };

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setView(ViewMode.FREE_LAB); // Reset view for next login
  };

  return (
    <div className={`h-screen w-full flex flex-col overflow-hidden transition-colors duration-700 ${theme === 'dark' ? 'bg-[#000b1a] text-slate-100' : 'bg-[#f8fafc] text-slate-900'} select-none`} onClick={initAudio}>
      {!isLoggedIn ? (
        <AuthPage onLogin={() => setIsLoggedIn(true)} theme={theme} />
      ) : (
        <>
          {/* 科技感背景装饰 */}
          <div className="fixed inset-0 pointer-events-none overflow-hidden">
            <div className={`absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full blur-[150px] transition-opacity duration-1000 ${theme === 'dark' ? 'bg-blue-600/10 opacity-100' : 'bg-blue-400/20 opacity-60'}`}></div>
            <div className={`absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full blur-[120px] transition-opacity duration-1000 ${theme === 'dark' ? 'bg-sky-400/10 opacity-100' : 'bg-blue-200/30 opacity-60'}`}></div>
          </div>

          <header className="relative z-10 flex items-center justify-between px-10 py-8">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-4">
                <div className="relative group cursor-pointer" onClick={() => setView(ViewMode.FREE_LAB)}>
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
                  onClick={() => setView(ViewMode.USER_PROFILE)}
                  className={`flex items-center gap-3 px-1.5 py-1.5 rounded-full border transition-all ${view === ViewMode.USER_PROFILE ? 'bg-blue-600 border-blue-400 text-white' : theme === 'dark' ? 'bg-white/5 border-white/10 text-slate-400 hover:text-white' : 'bg-white border-blue-100 text-blue-600'}`}
                >
                  <div className="w-8 h-8 rounded-full bg-slate-200 overflow-hidden border-2 border-white/20">
                    <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=JinBot" alt="User" />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest pr-2 hidden sm:inline">我的档案</span>
                </button>
              </div>
            </div>
            
            <Navigation currentView={view} onViewChange={setView} theme={theme} />
          </header>

          <main className="flex-1 relative z-10 overflow-hidden">
            {view === ViewMode.ADVENTURE && <AdventureMode theme={theme} />}
            {view === ViewMode.FREE_LAB && <FreeLab theme={theme} />}
            {view === ViewMode.STAGE && <StageMode theme={theme} />}
            {view === ViewMode.USER_PROFILE && (
              <UserProfile 
                theme={theme} 
                onLogout={handleLogout} 
              />
            )}
          </main>

          <AIAssistant theme={theme} />
          
          {!isAudioInitialized && (
            <div className={`fixed inset-0 z-[100] backdrop-blur-xl flex flex-col items-center justify-center text-center p-6 transition-colors duration-500 ${theme === 'dark' ? 'bg-[#000b1a]/90' : 'bg-white/90'}`}>
               <div className="w-28 h-28 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-[2.5rem] animate-bounce-subtle flex items-center justify-center mb-8 border border-white/20">
                 <span className="text-5xl">🎧</span>
               </div>
               <h2 className={`text-4xl font-fredoka mb-4 transition-colors ${theme === 'dark' ? 'text-white' : 'text-blue-900'}`}>生音科技 · 灵谱奇域</h2>
               <p className="text-blue-400 max-w-lg mb-10 font-medium text-lg">每一个孩子都可以在音乐中快乐成长，<br/>成为自己人生的的建筑师。</p>
               <button 
                 onClick={initAudio}
                 className={`px-16 py-5 rounded-full font-black text-xl transition-all active:scale-95 ${theme === 'dark' ? 'bg-white text-blue-900 hover:bg-blue-50' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
               >
                 立即进入
               </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default App;
