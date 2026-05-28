/*
! SQLite storage operations for phonetic transcription cache.
! Provides O(1) cache lookups via SHA256 hash index.
*/

import { db } from '@/lib/db/sqlite';
import type { PhoneticCacheEntry, PhonemeSegment, Locale } from '../types';
import { createHash } from 'crypto';

/*
! Generate deterministic hash for cache lookup
! @param text - Text to hash
! @param locale - Locale to hash with
*/
function generateTextHash(text: string, locale: Locale): string {
  return createHash('sha256').update(`${locale}:${text.toLowerCase()}`).digest('hex');
}

/*
! Get cached phoneme data for text + locale combination
! @returns Cache entry or null if not found
*/
export function getCachedPhonemes(text: string, locale: Locale): PhoneticCacheEntry | null {
  const hash = generateTextHash(text, locale);
  const stmt = db.prepare(`
    SELECT * FROM phonetic_cache WHERE text_hash = ?
  `);
  return stmt.get(hash) as PhoneticCacheEntry | null;
}

/*
! Store computed phonemes in cache
! @param text - Original text
! @param locale - Language locale
! @param ipaTranscript - IPA transcription string
! @param arpabetTranscript - ARPABET string (for English)
! @param segments - PhonemeSegment array
! @param difficultyMask - Boolean array indicating challenging phonemes
*/
export function cachePhonemes(
  text: string,
  locale: Locale,
  ipaTranscript: string,
  arpabetTranscript: string | null,
  segments: PhonemeSegment[],
  difficultyMask: boolean[],
): PhoneticCacheEntry {
  const now = Math.floor(Date.now() / 1000);
  const hash = generateTextHash(text, locale);

  const phonemeDataJson = JSON.stringify(segments);
  const difficultyMaskJson = JSON.stringify(difficultyMask);

  const stmt = db.prepare(`
    INSERT OR REPLACE INTO phonetic_cache 
    (text, locale, ipa_transcript, arpabet_transcript, phoneme_data, difficulty_mask, text_hash, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  stmt.run(
    text,
    locale,
    ipaTranscript,
    arpabetTranscript,
    phonemeDataJson,
    difficultyMaskJson,
    hash,
    now,
    now,
  );

  return getCachedPhonemes(text, locale)!;
}

/*
! Parse stored phoneme data JSON back to array
*/
export function parsePhonemeData(json: string): PhonemeSegment[] {
  try {
    return JSON.parse(json);
  } catch {
    return [];
  }
}

/*
! Parse stored difficulty mask JSON back to boolean array
*/
export function parseDifficultyMask(json: string): boolean[] {
  try {
    return JSON.parse(json);
  } catch {
    return [];
  }
}

/*
! Clear all cache entries for a specific locale
*/
export function clearCacheForLocale(locale: Locale): number {
  const stmt = db.prepare('DELETE FROM phonetic_cache WHERE locale = ?');
  const result = stmt.run(locale);
  return result.changes;
}

/*
! Clear entire phonetic cache
*/
export function clearAllCache(): number {
  const stmt = db.prepare('DELETE FROM phonetic_cache');
  const result = stmt.run();
  return result.changes;
}

/*
! Get cache statistics
*/
export function getCacheStats(): { count: number; sizeBytes: number; oldestEntry: number | null } {
  const countStmt = db.prepare('SELECT COUNT(*) as count FROM phonetic_cache');
  const countResult = countStmt.get() as { count: number };

  // Estimate size by summing text lengths
  const sizeStmt = db.prepare(`
    SELECT SUM(LENGTH(text) + LENGTH(ipa_transcript) + LENGTH(phoneme_data)) as size 
    FROM phonetic_cache
  `);
  const sizeResult = sizeStmt.get() as { size: number | null };

  const oldestStmt = db.prepare('SELECT MIN(created_at) as oldest FROM phonetic_cache');
  const oldestResult = oldestStmt.get() as { oldest: number | null };

  return {
    count: countResult.count,
    sizeBytes: sizeResult.size || 0,
    oldestEntry: oldestResult.oldest,
  };
}

/*
! Remove stale entries (older than specified days)
*/
export function removeStaleCacheEntries(daysOld: number): number {
  const cutoff = Math.floor(Date.now() / 1000) - daysOld * 86400;
  const stmt = db.prepare('DELETE FROM phonetic_cache WHERE created_at < ?');
  const result = stmt.run(cutoff);
  return result.changes;
}

/*
! Initialize phonetic_cache table if not exists
*/
export function initPhoneticCacheTable(): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS phonetic_cache (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      text            TEXT NOT NULL,
      locale          TEXT NOT NULL,
      ipa_transcript  TEXT,
      arpabet_transcript TEXT,
      phoneme_data    TEXT,
      difficulty_mask TEXT,
      text_hash       TEXT NOT NULL,
      created_at      INTEGER DEFAULT (strftime('%s', 'now')),
      updated_at      INTEGER DEFAULT (strftime('%s', 'now')),
      UNIQUE(text, locale)
    );

    CREATE INDEX IF NOT EXISTS idx_phonetic_cache_hash ON phonetic_cache(text_hash);
    CREATE INDEX IF NOT EXISTS idx_phonetic_cache_locale ON phonetic_cache(locale);
  `);
}

// Initialize on module load
initPhoneticCacheTable();
