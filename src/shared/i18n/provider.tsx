'use client';

import { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';
import th from './translations/th.json';
import en from './translations/en.json';

type Locale = 'th' | 'en';
type TranslationMap = Record<string, string>;

const translations: Record<Locale, TranslationMap> = { th, en };

interface I18nContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string, replacements?: Record<string, any>) => string;
}

const I18nContext = createContext<I18nContextValue>({
  locale: 'th',
  setLocale: () => {},
  t: (key: string, replacements?: Record<string, any>) => key,
});

export function useTranslation() {
  return useContext(I18nContext);
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('th');

  useEffect(() => {
    const saved = localStorage.getItem('kpi-locale') as Locale | null;
    if (saved && (saved === 'th' || saved === 'en')) {
      setLocaleState(saved);
    }
  }, []);

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
    localStorage.setItem('kpi-locale', l);
  }, []);

  const t = useCallback(
    (key: string, replacements?: Record<string, any>): string => {
      let translation = translations[locale]?.[key] ?? translations['th']?.[key] ?? key;
      if (replacements) {
        Object.keys(replacements).forEach((k) => {
          translation = translation.replace(`{${k}}`, String(replacements[k]));
        });
      }
      return translation;
    },
    [locale]
  );

  return (
    <I18nContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </I18nContext.Provider>
  );
}
