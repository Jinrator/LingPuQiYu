import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Globe, Type, Check } from 'lucide-react';
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
            className="w-9 h-9 rounded-xl flex items-center justify-center bg-white text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-all shadow-[0_1px_4px_rgba(0,0,0,0.02)]"
          >
            <ArrowLeft size={16} />
          </button>
          <h1 className="text-xl font-bold tracking-tight text-slate-800">{t('settings.title')}</h1>
        </div>

        {/* Language */}
        <div className="bg-white rounded-2xl p-5 sm:p-8 shadow-[0_1px_6px_rgba(0,0,0,0.03)] space-y-4 sm:space-y-5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-slate-100">
              <Globe size={16} className="text-slate-500" />
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
                  className="relative flex flex-col items-center gap-2 p-3 sm:p-4 rounded-xl text-center transition-all hover:scale-[1.02] active:scale-95"
                  style={active
                    ? { background: '#F1F5F9', color: '#1E293B' }
                    : { background: '#F8FAFC', color: '#94A3B8' }
                  }
                >
                  <span className="text-xl sm:text-2xl">{lang.flag}</span>
                  <span className="text-xs font-semibold">{t(`settings.lang.${lang.id}`)}</span>
                  {active && (
                    <div
                      className="absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center bg-slate-800"
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
        <div className="bg-white rounded-2xl p-5 sm:p-8 shadow-[0_1px_6px_rgba(0,0,0,0.03)] space-y-4 sm:space-y-5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-slate-100">
              <Type size={16} className="text-slate-500" />
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
                  className="relative flex flex-col items-center gap-2 p-3 sm:p-4 rounded-xl text-center transition-all hover:scale-[1.02] active:scale-95"
                  style={active
                    ? { background: '#F1F5F9', color: '#1E293B' }
                    : { background: '#F8FAFC', color: '#94A3B8' }
                  }
                >
                  <span className={`font-bold ${fontSizePreviewClass[fs.id]}`}>{fs.preview}</span>
                  <span className="text-xs font-semibold">{t(`settings.fontSize.${fs.id}`)}</span>
                  {active && (
                    <div
                      className="absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center bg-slate-800"
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
