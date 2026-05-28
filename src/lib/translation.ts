/*
! Public translation module — re-exports the API-backed client implementation.
? Calls /api/translate (server-side LibreTranslate) instead of bundling a translation
? package into the client. Adds the SupportedLanguage type guard used by callers.
*/

export {
  translateText,
  translateBatch,
  clearTranslationCache,
} from './translation/client';

export type SupportedLanguage = 'pt' | 'es' | 'fr' | 'en';

export function isTranslationAvailable(lang: string): lang is SupportedLanguage {
  return lang === 'pt' || lang === 'es' || lang === 'fr' || lang === 'en';
}
