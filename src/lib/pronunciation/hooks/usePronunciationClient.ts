/*
! React hook for pronunciation data retrieval (client-safe version).
! Provides basic phoneme data without server-side dependencies.
*/

'use client';

import { useState, useEffect, useCallback } from 'react';
import type { PhonemeData, PhonemeSegment, Locale, DifficultyLevel } from '../types';

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

// Simple character-to-IPA mapping (placeholder implementation)
function charToIPA(char: string): string {
  const charLower = char.toLowerCase();
  const mapping: Record<string, string> = {
    a: 'æ',
    b: 'b',
    c: 'k',
    d: 'd',
    e: 'ɛ',
    f: 'f',
    g: 'g',
    h: 'h',
    i: 'ɪ',
    j: 'dʒ',
    k: 'k',
    l: 'l',
    m: 'm',
    n: 'n',
    o: 'ɒ',
    p: 'p',
    q: 'k',
    r: 'ɹ',
    s: 's',
    t: 't',
    u: 'ʊ',
    v: 'v',
    w: 'w',
    x: 'ks',
    y: 'j',
    z: 'z',
  };
  return mapping[charLower] || charLower;
}

// Check if phoneme is challenging
function isChallengingPhoneme(ipa: string): boolean {
  const challenging = [
    'æ',
    'ʌ',
    'ɔ',
    'ɛ',
    'ɪ',
    'i',
    'ʊ',
    'u',
    'θ',
    'ð',
    'ŋ',
    'ʃ',
    'ʒ',
    'tʃ',
    'dʒ',
    'ɹ',
  ];
  return challenging.includes(ipa);
}

// Get difficulty level
function getDifficulty(ipa: string): DifficultyLevel {
  const hard = ['θ', 'ð', 'ŋ', 'ʃ', 'ʒ', 'tʃ', 'dʒ', 'ɹ'];
  const medium = ['æ', 'ʌ', 'ɔ', 'ɛ'];

  if (hard.includes(ipa)) return 'hard';
  if (medium.includes(ipa)) return 'medium';
  return 'easy';
}

// Generate simple phoneme data (placeholder)
function generatePhonemeData(text: string, locale: Locale): PhonemeData {
  const words = text.trim().split(/\s+/);
  const segments: PhonemeSegment[] = [];
  let arpabetParts: string[] = [];
  let charPos = 0;

  for (const word of words) {
    const wordStart = text.indexOf(word, charPos);
    if (wordStart === -1) continue;

    for (let i = 0; i < word.length; i++) {
      const phoneme = word[i];
      const ipa = charToIPA(phoneme);

      segments.push({
        phoneme,
        ipa,
        arpabet: locale.startsWith('en') ? phoneme.toUpperCase() : null,
        startChar: wordStart + i,
        endChar: wordStart + i + 1,
        difficulty: getDifficulty(ipa),
        isChallenging: isChallengingPhoneme(ipa),
      });

      if (locale.startsWith('en')) {
        arpabetParts.push(phoneme.toUpperCase());
      }
    }

    charPos = wordStart + word.length;
  }

  const ipa = segments.map((s) => s.ipa).join('');

  return {
    originalText: text,
    locale,
    ipa: `/${ipa}/`,
    arpabet: arpabetParts.length > 0 ? arpabetParts.join(' ') : null,
    segments,
    wordCount: words.length,
    syllableCount: Math.max(1, Math.ceil(text.length / 3)),
    createdAt: Math.floor(Date.now() / 1000),
    fromCache: false,
  };
}

/*
! Hook to retrieve pronunciation data for a text chunk.
! Handles basic phoneme generation and loading states.
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
      // Generate placeholder phoneme data
      // In future, this could call a proper G2P service or use cached data
      const data = generatePhonemeData(text, locale);
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
    // Prefetch in background without blocking
    texts.forEach((text) => generatePhonemeData(text, locale));
  }, [texts, locale]);

  useEffect(() => {
    prefetch();
  }, [prefetch]);

  return { prefetch };
}
