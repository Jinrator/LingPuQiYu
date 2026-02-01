
import React from 'react';
import { ViewMode } from '../../types';
import { Map, Palette, Disc } from 'lucide-react';

interface NavigationProps {
  currentView: ViewMode;
  onViewChange: (view: ViewMode) => void;
  theme?: 'light' | 'dark';
}

const Navigation: React.FC<NavigationProps> = ({ currentView, onViewChange, theme = 'dark' }) => {
  const tabs = [
    { id: ViewMode.ADVENTURE, label: '冒险模式', icon: Map },
    { id: ViewMode.FREE_LAB, label: '自由工坊', icon: Palette },
    { id: ViewMode.STAGE, label: '演出舞台', icon: Disc },
  ];

  return (
    <nav className={`flex items-center gap-3 p-2 rounded-3xl border backdrop-blur-xl shadow-sm transition-all duration-500 ${theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-blue-50/50 border-blue-100'}`}>
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = currentView === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onViewChange(tab.id)}
            className={`
              flex items-center gap-3 px-8 py-3 rounded-2xl transition-all duration-500
              ${isActive 
                ? 'bg-blue-600 text-white scale-105' 
                : theme === 'dark' 
                  ? 'text-slate-400 hover:text-white hover:bg-white/5 hover:shadow-sm' 
                  : 'text-slate-500 hover:text-blue-600 hover:bg-white/50 hover:shadow-sm'}
            `}
          >
            <Icon size={22} className={isActive ? 'animate-pulse' : ''} />
            <span className="font-black tracking-tight">{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
};

export default Navigation;
