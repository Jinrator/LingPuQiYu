import React from 'react';
import { ViewMode } from '../../types';
import { Map, Palette, Disc } from 'lucide-react';
import { PALETTE } from '../../constants/palette';

interface NavigationProps {
  currentView: ViewMode;
  onViewChange: (view: ViewMode) => void;
  theme?: 'light' | 'dark';
}

const Navigation: React.FC<NavigationProps> = ({ currentView, onViewChange }) => {
  const tabs = [
    { id: ViewMode.ADVENTURE, label: '冒险模式', icon: Map },
    { id: ViewMode.FREE_LAB,  label: '自由工坊', icon: Palette },
    { id: ViewMode.STAGE,     label: '演出舞台', icon: Disc },
  ];

  return (
    <>
      {tabs.map(({ id, label, icon: Icon }) => {
        const isActive = currentView === id;
        return (
          <button
            key={id}
            onClick={() => onViewChange(id)}
            className="flex flex-col md:flex-row items-center gap-1 md:gap-2 px-3 md:px-4 py-1.5 md:py-2 rounded-xl text-[10px] md:text-xs font-semibold transition-all md:hover:scale-[1.03] active:scale-95"
            style={
              isActive
                ? { background: PALETTE.blue.bg, color: PALETTE.blue.accent }
                : { color: '#94A3B8' }
            }
          >
            <Icon size={18} className="md:hidden" />
            <Icon size={14} className="hidden md:block" />
            {label}
          </button>
        );
      })}
    </>
  );
};

export default Navigation;
