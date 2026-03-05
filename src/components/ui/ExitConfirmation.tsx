import React from 'react';
import { useSettings } from '../../contexts/SettingsContext';

interface ExitConfirmationProps {
  show: boolean;
  theme?: 'light' | 'dark';
  onHide: () => void;
}

const ExitConfirmation: React.FC<ExitConfirmationProps> = ({ show, onHide }) => {
  const { t } = useSettings();
  if (!show) return null;
  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[150] flex items-center gap-3 px-5 py-3.5 rounded-2xl bg-white border border-slate-200 shadow-lg text-sm font-medium text-slate-600">
      <span>{t('exit.confirm')}</span>
      <button onClick={onHide} className="text-slate-300 hover:text-slate-500 transition-colors text-base leading-none">×</button>
    </div>
  );
};

export default ExitConfirmation;
