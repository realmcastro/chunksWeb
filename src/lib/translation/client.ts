/*
! Client-side translation service with localStorage caching.
? Provides translation for vocabulary examples based on user's learning language.
? Cache TTL: 24 hours, Max entries: 500 (LRU eviction).
*/

const CACHE_KEY = 'translations_cache_v2';
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours in ms
const MAX_CACHE_ENTRIES = 500;

interface CacheEntry {
  translation: string;
  timestamp: number;
  targetLang: string;
}

interface TranslationCache {
  [key: string]: CacheEntry;
}

function getCacheKey(text: string, targetLang: string): string {
  // Simple hash for cache key
  const hash = text.toLowerCase().trim().slice(0, 50);
  return `${targetLang}:${hash}`;
}

function isExpired(timestamp: number): boolean {
  return Date.now() - timestamp > CACHE_TTL;
}

function readFromCache(text: string, targetLang: string): string | null {
  if (typeof window === 'undefined') return null;

  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (!cached) return null;

    const cache: TranslationCache = JSON.parse(cached);
    const key = getCacheKey(text, targetLang);
    const entry = cache[key];

    if (!entry) return null;
    if (isExpired(entry.timestamp)) {
      // Clean up expired entry
      delete cache[key];
      localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
      return null;
    }

    return entry.translation;
  } catch {
    return null;
  }
}

function writeToCache(text: string, targetLang: string, translation: string): void {
  if (typeof window === 'undefined') return;

  try {
    const cached = localStorage.getItem(CACHE_KEY);
    const cache: TranslationCache = cached ? JSON.parse(cached) : {};

    // LRU eviction: if over max entries, remove oldest expired or all if none expired
    const keys = Object.keys(cache);
    if (keys.length >= MAX_CACHE_ENTRIES) {
      // Find and remove expired entries
      const expiredKeys = keys.filter((k) => isExpired(cache[k].timestamp));
      if (expiredKeys.length > 0) {
        expiredKeys.slice(0, Math.ceil(MAX_CACHE_ENTRIES / 2)).forEach((k) => delete cache[k]);
      } else {
        // No expired entries, remove random half
        keys.slice(0, Math.ceil(MAX_CACHE_ENTRIES / 2)).forEach((k) => delete cache[k]);
      }
    }

    const key = getCacheKey(text, targetLang);
    cache[key] = {
      translation,
      timestamp: Date.now(),
      targetLang,
    };

    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch {
    // localStorage might be full or unavailable, ignore
  }
}

// In-flight request deduplication
const pendingTranslations: Map<string, Promise<string>> = new Map();

export async function translateText(
  text: string,
  targetLang: string,
  sourceLang: string = 'en',
): Promise<string> {
  if (!text) return '';

  // If source and target are the same, return original
  if (sourceLang === targetLang) {
    return text;
  }

  // Check cache first
  const cached = readFromCache(text, targetLang);
  if (cached) {
    return cached;
  }

  // Deduplicate in-flight requests
  const cacheKey = getCacheKey(text, targetLang);
  const pending = pendingTranslations.get(cacheKey);
  if (pending) {
    return pending;
  }

  // Create translation request
  const translationPromise = (async () => {
    try {
      const response = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, targetLanguage: targetLang, sourceLanguage: sourceLang }),
      });

      if (!response.ok) {
        throw new Error(`Translation API error: ${response.status}`);
      }

      const data = await response.json();
      const translation = data.translation as string;

      // Cache successful translation
      writeToCache(text, targetLang, translation);

      return translation;
    } catch (error) {
      console.error('Translation failed:', error);
      // Return original text on failure
      return text;
    } finally {
      pendingTranslations.delete(cacheKey);
    }
  })();

  pendingTranslations.set(cacheKey, translationPromise);
  return translationPromise;
}

export async function translateBatch(
  texts: string[],
  targetLang: string,
  sourceLang: string = 'en',
): Promise<string[]> {
  if (texts.length === 0) return [];

  // Translate all in parallel
  const results = await Promise.all(
    texts.map((text) => translateText(text, targetLang, sourceLang)),
  );

  return results;
}

export function clearTranslationCache(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(CACHE_KEY);
}
