import React from 'react';
import { Keyboard } from 'lucide-react';
import { useSettings } from '../../contexts/SettingsContext';

interface KeyboardPlayToggleProps {
  enabled: boolean;
  onChange: (enabled: boolean) => void;
  className?: string;
}

const KeyboardPlayToggle: React.FC<KeyboardPlayToggleProps> = ({ enabled, onChange, className = '' }) => {
  const { t } = useSettings();

  return (
    <button
      type="button"
      aria-pressed={enabled}
      aria-label={t('music.keyboardPlay')}
      onClick={() => onChange(!enabled)}
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
        enabled
          ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
          : 'border-slate-200 bg-white text-slate-500'
      } ${className}`.trim()}
    >
      <span className={`flex h-6 w-6 items-center justify-center rounded-full ${
        enabled ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400'
      }`}>
        <Keyboard size={16} />
      </span>
      <span>{t('music.keyboardPlay')}</span>
      <span className={`rounded-full px-2 py-0.5 text-[11px] ${
        enabled ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
      }`}>
        {enabled ? t('music.keyboardPlayOnShort') : t('music.keyboardPlayOffShort')}
      </span>
    </button>
  );
};

export default KeyboardPlayToggle;
