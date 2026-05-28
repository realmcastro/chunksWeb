/*
! Pronunciation Service - orchestrates G2P conversion with caching.
! Main entry point for retrieving phonetic data with SQLite cache support.
*/

import type { PhonemeData, PhonemeSegment, Locale, G2PResult } from '../types';
import * as phoneticCache from '../storage/phoneticCache';
import {
  parseARPABET,
  arpabetToIPA,
  isChallengingPhoneme,
  getPhonemeDifficulty,
} from '../engines/ipa/arpabetToIPAMap';

/*
! In-memory LRU cache for hot phoneme data
! Supplements SQLite cache for low-latency access
*/
class LRUCache {
  private cache: Map<string, PhonemeData> = new Map();
  private maxSize: number;

  constructor(maxSize: number = 100) {
    this.maxSize = maxSize;
  }

  private makeKey(text: string, locale: Locale): string {
    return `${locale}:${text.toLowerCase()}`;
  }

  get(text: string, locale: Locale): PhonemeData | null {
    const key = this.makeKey(text, locale);
    const value = this.cache.get(key);
    if (value) {
      // Move to end (most recently used)
      this.cache.delete(key);
      this.cache.set(key, value);
    }
    return value ?? null;
  }

  set(text: string, locale: Locale, data: PhonemeData): void {
    const key = this.makeKey(text, locale);

    // Evict LRU entries if at capacity
    if (this.cache.size >= this.maxSize && !this.cache.has(key)) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) this.cache.delete(firstKey);
    }

    this.cache.set(key, data);
  }

  clear(): void {
    this.cache.clear();
  }
}

/*
! Phoneme word mapping for text-to-phoneme alignment
*/
interface WordPhonemes {
  word: string;
  startChar: number;
  arpabet: string[];
  ipa: string;
}

/*
! PronunciationService provides phonetic analysis with multi-layer caching
*/
export class PronunciationService {
  private lruCache: LRUCache;
  private locale: Locale;

  constructor(locale: Locale = 'en-US', cacheSize: number = 100) {
    this.locale = locale;
    this.lruCache = new LRUCache(cacheSize);
  }

  /*
  ! Set the current locale
  */
  setLocale(locale: Locale): void {
    this.locale = locale;
  }

  /*
  ! Get phoneme data with caching (LRU + SQLite)
  ! @param text - Text to analyze
  ! @param locale - Language locale
  ! @returns PhonemeData with IPA transcription and segment info
  */
  async getPhonemes(text: string, locale?: Locale): Promise<PhonemeData> {
    const targetLocale = locale || this.locale;
    const normalizedText = text.trim();

    // 1. Check LRU cache first (fastest)
    const lruResult = this.lruCache.get(normalizedText, targetLocale);
    if (lruResult) {
      return { ...lruResult, fromCache: true };
    }

    // 2. Check SQLite cache
    const cachedEntry = phoneticCache.getCachedPhonemes(normalizedText, targetLocale);
    if (cachedEntry) {
      const phonemeData = phoneticCache.parsePhonemeData(cachedEntry.phoneme_data);
      const difficultyMask = phoneticCache.parseDifficultyMask(cachedEntry.difficulty_mask);

      // Restore isChallenging from difficulty mask
      const segments: PhonemeSegment[] = phonemeData.map((seg, idx) => ({
        ...seg,
        isChallenging: difficultyMask[idx] ?? false,
      }));

      const result: PhonemeData = {
        originalText: normalizedText,
        locale: targetLocale,
        ipa: cachedEntry.ipaTranscript,
        arpabet: cachedEntry.arpabetTranscript,
        segments,
        wordCount: normalizedText.split(/\s+/).length,
        syllableCount: this.countSyllables(segments),
        createdAt: cachedEntry.createdAt,
        fromCache: true,
      };

      // Store in LRU for next time
      this.lruCache.set(normalizedText, targetLocale, result);
      return result;
    }

    // 3. Generate new phoneme data
    const generated = await this.generatePhonemes(normalizedText, targetLocale);

    // 4. Cache in SQLite
    const difficultyMask = generated.segments.map((s) => s.isChallenging);
    phoneticCache.cachePhonemes(
      normalizedText,
      targetLocale,
      generated.ipa,
      generated.arpabet,
      generated.segments,
      difficultyMask,
    );

    // 5. Store in LRU
    this.lruCache.set(normalizedText, targetLocale, generated);

    return generated;
  }

  /*
  ! Generate phonemes using G2P engine
  ! This is a simplified implementation - real one would use speech-rule-engine
  */
  private async generatePhonemes(text: string, locale: Locale): Promise<PhonemeData> {
    // Split text into words
    const words = text.split(/\s+/);

    // For now, generate placeholder phonemes
    // Real implementation would call actual G2P engine
    const segments: PhonemeSegment[] = [];
    let arpabetParts: string[] = [];
    let charPos = 0;

    for (const word of words) {
      const wordStart = text.indexOf(word, charPos);
      if (wordStart === -1) continue;

      // Generate phonemes for each character (placeholder)
      // Real implementation would use proper G2P engine
      for (let i = 0; i < word.length; i++) {
        const phoneme = word[i];
        const ipa = this.charToIPA(phoneme);
        const difficulty = getPhonemeDifficulty(ipa);
        const isChallenging = isChallengingPhoneme(ipa);

        segments.push({
          phoneme,
          ipa,
          arpabet: locale.startsWith('en') ? this.ipaToARPABET(ipa) : null,
          startChar: wordStart + i,
          endChar: wordStart + i + 1,
          difficulty,
          isChallenging,
        });

        if (locale.startsWith('en')) {
          arpabetParts.push(this.ipaToARPABET(ipa));
        }
      }

      charPos = wordStart + word.length;
    }

    const arpabetStr = arpabetParts.length > 0 ? arpabetParts.join(' ') : null;
    const ipa = this.generateIPA(segments);

    return {
      originalText: text,
      locale,
      ipa: `/${ipa}/`,
      arpabet: arpabetStr,
      segments,
      wordCount: words.length,
      syllableCount: this.countSyllables(segments),
      createdAt: Math.floor(Date.now() / 1000),
      fromCache: false,
    };
  }

  /*
  ! Simple character-to-IPA mapping (placeholder)
  */
  private charToIPA(char: string): string {
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

  /*
  ! Convert IPA to ARPABET (simplified)
  */
  private ipaToARPABET(ipa: string): string {
    const mapping: Record<string, string> = {
      æ: 'AE',
      ɑ: 'AA',
      ʌ: 'AH',
      ɔ: 'AO',
      ɛ: 'EH',
      ɪ: 'IH',
      i: 'IY',
      ʊ: 'UH',
      u: 'UW',
      ŋ: 'NG',
      θ: 'TH',
      ð: 'DH',
      ʃ: 'SH',
      ʒ: 'ZH',
      tʃ: 'CH',
      dʒ: 'JH',
      ɹ: 'R',
      ɜ: 'ER',
    };
    return mapping[ipa] || ipa.toUpperCase();
  }

  /*
  ! Generate full IPA string from segments
  */
  private generateIPA(segments: PhonemeSegment[]): string {
    return segments.map((s) => s.ipa).join('');
  }

  /*
  ! Count syllables in phoneme data (approximate)
  */
  private countSyllables(segments: PhonemeSegment[]): number {
    // Count vowel-like sounds
    const vowels = ['æ', 'ɑ', 'ʌ', 'ɔ', 'ɛ', 'ɪ', 'i', 'ʊ', 'u', 'ɜ', 'eɪ', 'aɪ', 'oʊ', 'aʊ', 'ɔɪ'];
    return segments.filter((s) => vowels.includes(s.ipa)).length || 1;
  }

  /*
  ! Clear all caches
  */
  clearCache(): void {
    this.lruCache.clear();
  }

  /*
  ! Clear SQLite cache only
  */
  clearPersistentCache(): void {
    phoneticCache.clearAllCache();
  }

  /*
  ! Get cache statistics
  */
  getCacheStats(): { memory: number; sqlite: ReturnType<typeof phoneticCache.getCacheStats> } {
    return {
      memory: this.lruCache['cache'].size,
      sqlite: phoneticCache.getCacheStats(),
    };
  }
}

/*
! Singleton instance
*/
let serviceInstance: PronunciationService | null = null;

export function getPronunciationService(locale?: Locale): PronunciationService {
  if (!serviceInstance) {
    serviceInstance = new PronunciationService(locale ?? 'en-US');
  } else if (locale) {
    serviceInstance.setLocale(locale);
  }
  return serviceInstance;
}

/*
! Quick function to get phonemes
*/
export async function getPhonemes(text: string, locale: Locale): Promise<PhonemeData> {
  const service = getPronunciationService(locale);
  return service.getPhonemes(text, locale);
}
