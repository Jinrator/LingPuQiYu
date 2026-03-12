import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import dict from './i18n';

export type Language = 'zh-CN' | 'zh-TW' | 'en';
export type FontSize = 'small' | 'default' | 'large';

type StoredFontSize = FontSize | 'medium';

interface SettingsContextValue {
  language: Language;
  fontSize: FontSize;
  setLanguage: (lang: Language) => void;
  setFontSize: (size: FontSize) => void;
  t: (key: string) => string;
}

const STORAGE_KEY = 'shenyin_settings';

const defaults = { language: 'zh-CN' as Language, fontSize: 'default' as FontSize };

function normalizeFontSize(fontSize?: StoredFontSize): FontSize {
  switch (fontSize) {
    case 'small':
      return 'small';
    case 'medium':
      return 'default';
    case 'large':
      return 'large';
    default:
      return defaults.fontSize;
  }
}

function loadSettings() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as { language?: Language; fontSize?: StoredFontSize };
      return {
        language: parsed.language ?? defaults.language,
        fontSize: normalizeFontSize(parsed.fontSize),
      };
    }
  } catch {}
  return defaults;
}

const SettingsContext = createContext<SettingsContextValue | null>(null);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, _setLanguage] = useState<Language>(() => loadSettings().language);
  const [fontSize, _setFontSize] = useState<FontSize>(() => loadSettings().fontSize);

  // persist
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ language, fontSize }));
  }, [language, fontSize]);

  // apply font size to <html>
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('text-size-small', 'text-size-default', 'text-size-large', 'text-size-medium');
    root.classList.add(`text-size-${fontSize}`);
  }, [fontSize]);

  const setLanguage = useCallback((l: Language) => _setLanguage(l), []);
  const setFontSize = useCallback((s: FontSize) => _setFontSize(s), []);

  const t = useCallback((key: string): string => {
    return dict[key]?.[language] ?? key;
  }, [language]);

  return (
    <SettingsContext.Provider value={{ language, fontSize, setLanguage, setFontSize, t }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings must be used within SettingsProvider');
  return ctx;
};
