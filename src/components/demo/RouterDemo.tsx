import React from 'react';
import { useAppRouter } from '../../hooks/useAppRouter';
import { ViewMode } from '../../types';

const RouterDemo: React.FC = () => {
  const { currentView, currentPath, navigateToView, goBack, goForward } = useAppRouter();

  const viewNames = {
    [ViewMode.FREE_LAB]: '自由实验室',
    [ViewMode.ADVENTURE]: '冒险模式',
    [ViewMode.STAGE]: '舞台模式',
    [ViewMode.USER_PROFILE]: '我的档案'
  };

  return (
    <div className="fixed bottom-4 left-4 z-[140] p-4 bg-white/90 backdrop-blur-xl rounded-2xl border border-slate-200 text-sm">
      <div className="mb-3">
        <div className="font-bold text-slate-800">路由状态</div>
        <div className="text-slate-600">当前路径: {currentPath}</div>
        <div className="text-slate-600">当前视图: {viewNames[currentView]}</div>
      </div>
      
      <div className="flex gap-2 mb-3">
        <button 
          onClick={goBack}
          className="px-3 py-1 bg-slate-100 hover:bg-slate-200 rounded-lg text-xs font-medium transition-colors"
        >
          ← 后退
        </button>
        <button 
          onClick={goForward}
          className="px-3 py-1 bg-slate-100 hover:bg-slate-200 rounded-lg text-xs font-medium transition-colors"
        >
          前进 →
        </button>
      </div>

      <div className="grid grid-cols-2 gap-1">
        {Object.entries(viewNames).map(([view, name]) => (
          <button
            key={view}
            onClick={() => navigateToView(view as ViewMode)}
            className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
              currentView === view 
                ? 'bg-blue-600 text-white' 
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            {name}
          </button>
        ))}
      </div>
    </div>
  );
};

export default RouterDemo;