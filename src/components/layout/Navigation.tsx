import React from 'react';
import { ViewMode } from '../../types';
import { Map, Palette, Disc } from 'lucide-react';
import { PALETTE } from '../../constants/palette';
import { useSettings } from '../../contexts/SettingsContext';

interface NavigationProps {
  currentView: ViewMode;
  onViewChange: (view: ViewMode) => void;
  theme?: 'light' | 'dark';
}

const Navigation: React.FC<NavigationProps> = ({ currentView, onViewChange }) => {
  const { t } = useSettings();
  const tabs = [
    { id: ViewMode.ADVENTURE, label: t('nav.adventure'), icon: Map },
    { id: ViewMode.FREE_LAB,  label: t('nav.lab'),       icon: Palette },
    { id: ViewMode.STAGE,     label: t('nav.stage'),      icon: Disc },
  ];

  return (
    <>
      {tabs.map(({ id, label, icon: Icon }) => {
        const isActive = currentView === id;
        return (
          <button
            key={id}
            onClick={() => onViewChange(id)}
            className="flex flex-col md:flex-row items-center gap-1 md:gap-2 px-3 md:px-5 py-1.5 md:py-2 rounded-xl text-xs md:text-sm font-semibold transition-all md:hover:scale-[1.03] active:scale-95"
            style={
              isActive
                ? { background: PALETTE.blue.bg, color: PALETTE.blue.accent }
                : { color: '#475569' }
            }
          >
            <Icon size={20} className="md:hidden" />
            <Icon size={16} className="hidden md:block" />
            {label}
          </button>
        );
      })}
    </>
  );
};

export default Navigation;
