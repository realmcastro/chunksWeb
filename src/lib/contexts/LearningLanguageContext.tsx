'use client';

import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';

/*
! Source of truth para learningLanguage é o banco (via API).
! localStorage serve apenas como cache síncrono para evitar flash no primeiro render.
? Fluxo: estado inicial = localStorage → API corrige se divergente → mudanças persistidas na API.
? Em caso de 401 (não autenticado) ou falha de rede, opera apenas com localStorage.
*/

type LearningLanguage = 'en' | 'pt' | 'es' | 'fr' | 'de';

const VALID_LANGUAGES: ReadonlySet<string> = new Set(['en', 'pt', 'es', 'fr']);
const STORAGE_KEY = 'olifes_learning_language';

function isValidLanguage(val: string | null): val is LearningLanguage {
  return val !== null && VALID_LANGUAGES.has(val);
}

function readFromLocalStorage(): LearningLanguage {
  if (typeof window === 'undefined') return 'en';
  const stored = localStorage.getItem(STORAGE_KEY);
  return isValidLanguage(stored) ? stored : 'en';
}

interface LearningLanguageContextValue {
  learningLanguage: LearningLanguage;
  setLearningLanguage: (language: LearningLanguage) => void;
}

const LearningLanguageContext = createContext<LearningLanguageContextValue | null>(null);

export function LearningLanguageProvider({ children }: { children: ReactNode }) {
  const [learningLanguage, setLearningLanguageState] =
    useState<LearningLanguage>(readFromLocalStorage);

  /*
  ! useEffect roda apenas no cliente — readFromLocalStorage() é seguro aqui.
  ! A API é autoritativa quando disponível; localStorage é o fallback para sessões não autenticadas ou falhas de rede.
  ? No SSR, useState inicializa com 'en' (sem window). Durante a hidratação o cliente pode ter um valor diferente
  ? no localStorage — por isso lemos localStorage novamente aqui e aplicamos se a API não responder.
  */
  useEffect(() => {
    const localStorageValue = readFromLocalStorage();

    fetch('/api/user/learning-language')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.language && isValidLanguage(data.language)) {
          setLearningLanguageState(data.language);
          localStorage.setItem(STORAGE_KEY, data.language);
        } else {
          setLearningLanguageState(localStorageValue);
        }
      })
      .catch(() => {
        setLearningLanguageState(localStorageValue);
      });
  }, []);

  const setLearningLanguage = useCallback((language: LearningLanguage) => {
    setLearningLanguageState(language);
    localStorage.setItem(STORAGE_KEY, language);

    // Persist to DB asynchronously — fire and forget
    fetch('/api/user/learning-language', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ language }),
    }).catch(() => {
      // Silent fail — in-memory + localStorage state already updated
    });
  }, []);

  return (
    <LearningLanguageContext.Provider value={{ learningLanguage, setLearningLanguage }}>
      {children}
    </LearningLanguageContext.Provider>
  );
}

export function useLearningLanguage(): LearningLanguageContextValue {
  const context = useContext(LearningLanguageContext);
  if (!context) {
    throw new Error('useLearningLanguage must be used within a LearningLanguageProvider');
  }
  return context;
}
