
import React, { useState, useEffect } from 'react';
import { ViewMode } from './types';
import AdventureMode from './components/modes/AdventureMode';
import FreeLab from './components/modes/FreeLab';
import StageMode from './components/modes/StageMode';
import UserProfile from './components/layout/UserProfile';
import AIAssistant from './components/ui/AIAssistant';
import Navigation from './components/layout/Navigation';
import AuthPage from './components/layout/AuthPage';
import { useAuth } from './contexts/AuthContext';
import { Sun, Moon, LogOut } from 'lucide-react';

const AUDIO_INIT_KEY = 'shenyin_audio_initialized';

const App: React.FC = () => {
  const { isAuthenticated, logout, user } = useAuth();
  const [view, setView] = useState<ViewMode>(ViewMode.FREE_LAB);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [isAudioInitialized, setIsAudioInitialized] = useState(() => {
    // 从 sessionStorage 恢复音频初始化状态（会话级别，关闭浏览器后重置）
    return sessionStorage.getItem(AUDIO_INIT_KEY) === 'true';
  });
  const [showBackButtonHint, setShowBackButtonHint] = useState(false);
  const [backButtonMessage, setBackButtonMessage] = useState('');
  const [navigationHistory, setNavigationHistory] = useState<ViewMode[]>([ViewMode.FREE_LAB]);

  // 监听视图变化，更新导航历史
  useEffect(() => {
    setNavigationHistory(prev => {
      // 避免重复添加相同的视图
      if (prev[prev.length - 1] === view) return prev;
      
      // 保持历史记录不超过10个条目
      const newHistory = [...prev, view];
      return newHistory.length > 10 ? newHistory.slice(-10) : newHistory;
    });
  }, [view]);

  // 在应用启动时建立历史记录屏障
  useEffect(() => {
    // 只在首次加载时建立屏障
    const hasBarrier = sessionStorage.getItem('history_barrier_set');
    if (!hasBarrier) {
      // 建立多层历史记录屏障
      for (let i = 0; i < 10; i++) {
        window.history.pushState(
          { page: 'app', barrier: true, level: i }, 
          '', 
          window.location.href
        );
      }
      sessionStorage.setItem('history_barrier_set', 'true');
    }

    // 添加beforeunload事件作为最后的防线
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '确定要离开生音科技吗？';
      return '确定要离开生音科技吗？';
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  // 处理浏览器历史记录，防止后退按钮退出整个应用
  useEffect(() => {
    // 创建一个包含当前视图信息的历史记录条目
    const state = { 
      page: 'app', 
      view: view, 
      timestamp: Date.now(),
      preventBack: true 
    };
    window.history.pushState(state, '', window.location.href);

    const handlePopState = (event: PopStateEvent) => {
      // 每次后退时，立即推送一个新的状态
      const newState = { 
        page: 'app', 
        view: view, 
        timestamp: Date.now(),
        preventBack: true 
      };
      window.history.pushState(newState, '', window.location.href);
      
      // 获取之前的状态信息
      const previousState = event.state;
      
      // 智能路由逻辑
      if (isAuthenticated) {
        // 尝试从导航历史中获取上一个视图
        const currentIndex = navigationHistory.length - 1;
        const previousView = currentIndex > 0 ? navigationHistory[currentIndex - 1] : null;
        
        if (previousView && previousView !== view) {
          // 如果有历史记录，返回到上一个视图
          setView(previousView);
          
          // 更新导航历史（移除当前视图）
          setNavigationHistory(prev => prev.slice(0, -1));
          
          // 设置提示信息
          const viewNames = {
            [ViewMode.FREE_LAB]: '自由实验室',
            [ViewMode.ADVENTURE]: '冒险模式',
            [ViewMode.STAGE]: '舞台模式',
            [ViewMode.USER_PROFILE]: '我的档案'
          };
          
          setBackButtonMessage(`已从${viewNames[view]}返回到${viewNames[previousView]}`);
          setShowBackButtonHint(true);
          setTimeout(() => setShowBackButtonHint(false), 2500);
        } else {
          // 如果没有历史记录或已经在根视图，使用默认层级逻辑
          const viewHierarchy = {
            [ViewMode.FREE_LAB]: null, // 根视图
            [ViewMode.ADVENTURE]: ViewMode.FREE_LAB,
            [ViewMode.STAGE]: ViewMode.FREE_LAB,
            [ViewMode.USER_PROFILE]: ViewMode.FREE_LAB
          };
          
          const parentView = viewHierarchy[view];
          
          if (parentView) {
            setView(parentView);
            
            const viewNames = {
              [ViewMode.FREE_LAB]: '自由实验室',
              [ViewMode.ADVENTURE]: '冒险模式',
              [ViewMode.STAGE]: '舞台模式',
              [ViewMode.USER_PROFILE]: '我的档案'
            };
            
            setBackButtonMessage(`已从${viewNames[view]}返回到${viewNames[parentView]}`);
            setShowBackButtonHint(true);
            setTimeout(() => setShowBackButtonHint(false), 2500);
          } else {
            // 已经在根视图，完全阻止退出
            setBackButtonMessage('已在主页面，使用右上角退出按钮离开应用');
            setShowBackButtonHint(true);
            setTimeout(() => setShowBackButtonHint(false), 3000);
            
            // 添加多个缓冲历史记录条目，确保不会退出
            for (let i = 0; i < 5; i++) {
              window.history.pushState(
                { page: 'app', buffer: true, index: i }, 
                '', 
                window.location.href
              );
            }
          }
        }
      } else {
        // 未登录状态也要阻止退出
        setBackButtonMessage('请先登录使用应用');
        setShowBackButtonHint(true);
        setTimeout(() => setShowBackButtonHint(false), 2000);
        
        // 添加缓冲历史记录
        for (let i = 0; i < 3; i++) {
          window.history.pushState(
            { page: 'app', loginRequired: true, index: i }, 
            '', 
            window.location.href
          );
        }
      }
    };

    window.addEventListener('popstate', handlePopState);
    
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [isAuthenticated, view, navigationHistory]);

  // 添加键盘事件监听，用于音频初始化
  useEffect(() => {
    if (isAudioInitialized || !isAuthenticated) return;

    const handleKeyPress = (event: KeyboardEvent) => {
      // 任意键按下都可以初始化音频
      initAudio();
    };

    window.addEventListener('keydown', handleKeyPress);
    
    return () => {
      window.removeEventListener('keydown', handleKeyPress);
    };
  }, [isAudioInitialized, isAuthenticated]);

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
    // 保存音频初始化状态到 sessionStorage
    sessionStorage.setItem(AUDIO_INIT_KEY, 'true');
  };

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const handleLogout = () => {
    logout(); // 清除 localStorage 和 auth 状态
    setView(ViewMode.FREE_LAB);
    // 清除音频初始化状态，下次登录时重新显示欢迎页
    sessionStorage.removeItem(AUDIO_INIT_KEY);
    setIsAudioInitialized(false);
    // 重置导航历史
    setNavigationHistory([ViewMode.FREE_LAB]);
  };

  return (
    <div 
      className={`h-screen w-full flex flex-col overflow-hidden transition-colors duration-700 ${theme === 'dark' ? 'bg-[#000b1a] text-slate-100' : 'bg-[#f8fafc] text-slate-900'} select-none`} 
      onClick={!isAudioInitialized ? initAudio : undefined}
    >
      {!isAuthenticated ? (
        <AuthPage theme={theme} />
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
          
          {/* 后退按钮提示 */}
          {showBackButtonHint && (
            <div className={`fixed top-4 left-1/2 transform -translate-x-1/2 z-[150] px-6 py-3 rounded-2xl border backdrop-blur-xl transition-all duration-300 ${theme === 'dark' ? 'bg-slate-800/90 border-slate-600 text-white' : 'bg-white/90 border-slate-200 text-slate-800'}`}>
              <div className="flex items-center gap-2 text-sm font-medium">
                <span>🏠</span>
                <span>{backButtonMessage}</span>
              </div>
            </div>
          )}

          {/* 开发模式：显示导航历史（可选） */}
          {process.env.NODE_ENV === 'development' && (
            <div className={`fixed bottom-4 right-4 z-[140] px-3 py-2 rounded-lg text-xs font-mono opacity-50 hover:opacity-100 transition-opacity ${theme === 'dark' ? 'bg-slate-800 text-slate-300' : 'bg-white text-slate-600'}`}>
              <div>当前: {view}</div>
              <div>历史: [{navigationHistory.join(' → ')}]</div>
            </div>
          )}
          
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
        </>
      )}
    </div>
  );
};

export default App;
