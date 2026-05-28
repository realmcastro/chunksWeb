/*
! React hook for pronunciation data retrieval.
! Provides phoneme data with loading and error states.
*/

'use client';

import { useState, useEffect, useCallback } from 'react';
import type { PhonemeData, Locale } from '../types';
import { getPronunciationService } from '../services/PronunciationService';

interface UsePronunciationResult {
  phonemeData: PhonemeData | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

interface UsePronunciationOptions {
  locale?: Locale;
  autoLoad?: boolean;
}

/*
! Hook to retrieve pronunciation data for a text chunk.
! Handles caching and loading states automatically.
*/
export function usePronunciation(
  text: string | null,
  options: UsePronunciationOptions = {},
): UsePronunciationResult {
  const { locale = 'en-US', autoLoad = true } = options;

  const [phonemeData, setPhonemeData] = useState<PhonemeData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPhonemes = useCallback(async () => {
    if (!text) {
      setPhonemeData(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const service = getPronunciationService(locale);
      const data = await service.getPhonemes(text, locale);
      setPhonemeData(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch pronunciation';
      setError(message);
      setPhonemeData(null);
    } finally {
      setIsLoading(false);
    }
  }, [text, locale]);

  useEffect(() => {
    if (autoLoad && text) {
      fetchPhonemes();
    }
  }, [text, locale, autoLoad, fetchPhonemes]);

  return {
    phonemeData,
    isLoading,
    error,
    refetch: fetchPhonemes,
  };
}

/*
! Hook to prefetch pronunciation data for multiple texts
*/
export function usePronunciationPrefetch(texts: string[], locale: Locale = 'en-US') {
  const prefetch = useCallback(async () => {
    const service = getPronunciationService(locale);

    // Prefetch in background without blocking
    Promise.all(texts.map((text) => service.getPhonemes(text, locale))).catch(() => {
      // Silently ignore prefetch errors
    });
  }, [texts, locale]);

  useEffect(() => {
    prefetch();
  }, [prefetch]);

  return { prefetch };
}
