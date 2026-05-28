'use client';

/*
! I18nProvider manages the UI language (I18n) for the application.
? Fetches from API on mount for persistence, falls back to localStorage.
? Persists language changes to both localStorage and API.
*/
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import en from './translations/en.json';
import pt from './translations/pt.json';
import es from './translations/es.json';
import fr from './translations/fr.json';

type Language = 'en' | 'pt' | 'es' | 'fr';

type Translations = typeof en;

const translations: Record<Language, Translations> = { en, pt, es, fr };

export type { Language };

interface I18nContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
}

const I18nContext = createContext<I18nContextType | null>(null);

const STORAGE_KEY = 'language';

export function I18nProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>('en');
  const [initialized, setInitialized] = useState(false);

  // On mount: fetch from API (authoritative) or fall back to localStorage
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as Language;
    if (stored && translations[stored]) {
      setLanguage(stored);
    }

    // Try to sync with server-side preference
    fetch('/api/user/i18n-language')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.language && translations[data.language as Language]) {
          setLanguage(data.language as Language);
          localStorage.setItem(STORAGE_KEY, data.language);
        }
      })
      .catch(() => {
        // Silent fail - keep localStorage value
      })
      .finally(() => {
        setInitialized(true);
      });
  }, []);

  const t = (key: string, params?: Record<string, string | number>): string => {
    const keys = key.split('.');
    let value: unknown = translations[language];

    for (const k of keys) {
      if (value !== null && typeof value === 'object' && k in value) {
        value = (value as Record<string, unknown>)[k];
      } else {
        return key;
      }
    }

    if (typeof value !== 'string') {
      return key;
    }

    if (params) {
      return value.replace(/\{(\w+)\}/g, (_, k: string) => String(params[k] ?? `{${k}}`));
    }

    return value;
  };

  const handleSetLanguage = (lang: Language) => {
    setLanguage(lang);
    localStorage.setItem(STORAGE_KEY, lang);

    // Persist to API - fire and forget, localStorage already updated
    fetch('/api/user/i18n-language', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ language: lang }),
    }).catch(() => {
      // Silent fail - localStorage already has the value
    });
  };

  return (
    <I18nContext.Provider value={{ language, setLanguage: handleSetLanguage, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useTranslation() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useTranslation must be used within an I18nProvider');
  }
  return context;
}

export function useLanguage() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useLanguage must be used within an I18nProvider');
  }
  return context.language;
}
