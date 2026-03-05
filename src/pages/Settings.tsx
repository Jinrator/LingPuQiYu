import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Globe, Type, Check } from 'lucide-react';
import { PALETTE } from '../constants/palette';
import { useSettings, Language, FontSize } from '../contexts/SettingsContext';

const LANGUAGES: { id: Language; flag: string }[] = [
  { id: 'zh-CN', flag: '🇨🇳' },
  { id: 'zh-TW', flag: '🇲🇴/🇭🇰' },
  { id: 'en',    flag: '🇺🇸/🇬🇧' },
];

const FONT_SIZES: { id: FontSize; preview: string }[] = [
  { id: 'small',  preview: 'Aa' },
  { id: 'medium', preview: 'Aa' },
  { id: 'large',  preview: 'Aa' },
];

const fontSizePreviewClass: Record<FontSize, string> = {
  small: 'text-sm',
  medium: 'text-base',
  large: 'text-lg',
};

const Settings: React.FC = () => {
  const navigate = useNavigate();
  const { language, fontSize, setLanguage, setFontSize, t } = useSettings();

  return (
    <div className="h-full overflow-y-auto bg-[#F5F7FA] scrollbar-hide">
      <div className="max-w-2xl mx-auto px-4 sm:px-8 py-6 sm:py-12 space-y-5 sm:space-y-8 pb-20 md:pb-12">

        {/* Header */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="w-9 h-9 rounded-xl flex items-center justify-center bg-white border border-slate-200 text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-all"
          >
            <ArrowLeft size={16} />
          </button>
          <h1 className="text-xl font-bold tracking-tight text-slate-800">{t('settings.title')}</h1>
        </div>

        {/* Language */}
        <div className="bg-white rounded-2xl p-5 sm:p-8 shadow-[0_2px_12px_rgba(0,0,0,0.04)] space-y-4 sm:space-y-5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: PALETTE.blue.bg }}>
              <Globe size={16} style={{ color: PALETTE.blue.accent }} />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-800">{t('settings.language')}</p>
              <p className="text-xs font-medium text-slate-400">{t('settings.language.desc')}</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2.5 sm:gap-3">
            {LANGUAGES.map(lang => {
              const active = language === lang.id;
              return (
                <button
                  key={lang.id}
                  onClick={() => setLanguage(lang.id)}
                  className="relative flex flex-col items-center gap-2 p-3 sm:p-4 rounded-xl border text-center transition-all hover:scale-[1.02] active:scale-95"
                  style={active
                    ? { background: PALETTE.blue.bg, borderColor: PALETTE.blue.accent, color: PALETTE.blue.accent }
                    : { background: '#F8FAFC', borderColor: '#E2E8F0', color: '#94A3B8' }
                  }
                >
                  <span className="text-xl sm:text-2xl">{lang.flag}</span>
                  <span className="text-xs font-semibold">{t(`settings.lang.${lang.id}`)}</span>
                  {active && (
                    <div
                      className="absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center"
                      style={{ background: PALETTE.blue.accent }}
                    >
                      <Check size={12} className="text-white" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Font Size */}
        <div className="bg-white rounded-2xl p-5 sm:p-8 shadow-[0_2px_12px_rgba(0,0,0,0.04)] space-y-4 sm:space-y-5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: PALETTE.orange.bg }}>
              <Type size={16} style={{ color: PALETTE.orange.accent }} />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-800">{t('settings.fontSize')}</p>
              <p className="text-xs font-medium text-slate-400">{t('settings.fontSize.desc')}</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2.5 sm:gap-3">
            {FONT_SIZES.map(fs => {
              const active = fontSize === fs.id;
              return (
                <button
                  key={fs.id}
                  onClick={() => setFontSize(fs.id)}
                  className="relative flex flex-col items-center gap-2 p-3 sm:p-4 rounded-xl border text-center transition-all hover:scale-[1.02] active:scale-95"
                  style={active
                    ? { background: PALETTE.orange.bg, borderColor: PALETTE.orange.accent, color: PALETTE.orange.accent }
                    : { background: '#F8FAFC', borderColor: '#E2E8F0', color: '#94A3B8' }
                  }
                >
                  <span className={`font-bold ${fontSizePreviewClass[fs.id]}`}>{fs.preview}</span>
                  <span className="text-xs font-semibold">{t(`settings.fontSize.${fs.id}`)}</span>
                  {active && (
                    <div
                      className="absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center"
                      style={{ background: PALETTE.orange.accent }}
                    >
                      <Check size={12} className="text-white" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Auto-save hint */}
        <p className="text-center text-xs font-semibold text-slate-300">{t('settings.saved')}</p>
      </div>
    </div>
  );
};

export default Settings;
