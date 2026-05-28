/*
! Voice preferences storage operations for SQLite.
! Manages per-user, per-locale voice settings.
*/

import { db } from '@/lib/db/sqlite';
import type { VoicePreference, Locale } from '../types';

/*
! Get voice preference for a user and locale
*/
export function getVoicePreferences(userId: number, locale: Locale): VoicePreference | null {
  const stmt = db.prepare(`
    SELECT * FROM voice_preferences WHERE user_id = ? AND locale = ?
  `);
  return stmt.get(userId, locale) as VoicePreference | null;
}

/*
! Get all voice preferences for a user
*/
export function getAllVoicePreferences(userId: number): VoicePreference[] {
  const stmt = db.prepare(`
    SELECT * FROM voice_preferences WHERE user_id = ?
  `);
  return stmt.all(userId) as VoicePreference[];
}

/*
! Save or update voice preference
*/
export function saveVoicePreferences(
  userId: number,
  locale: Locale,
  prefs: Partial<Omit<VoicePreference, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>,
): VoicePreference {
  const now = Math.floor(Date.now() / 1000);

  const stmt = db.prepare(`
    INSERT OR REPLACE INTO voice_preferences 
    (user_id, locale, voice_uri, voice_name, rate, pitch, volume, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  stmt.run(
    userId,
    locale,
    prefs.voiceURI ?? null,
    prefs.voiceName ?? null,
    prefs.rate ?? 1.0,
    prefs.pitch ?? 1.0,
    prefs.volume ?? 1.0,
    now,
    now,
  );

  return getVoicePreferences(userId, locale)!;
}

/*
! Delete voice preference for a locale
*/
export function deleteVoicePreferences(userId: number, locale: Locale): boolean {
  const stmt = db.prepare(`
    DELETE FROM voice_preferences WHERE user_id = ? AND locale = ?
  `);
  const result = stmt.run(userId, locale);
  return result.changes > 0;
}

/*
! Reset voice preferences to defaults for a locale
*/
export function resetVoicePreferences(userId: number, locale: Locale): VoicePreference {
  return saveVoicePreferences(userId, locale, {
    rate: 1.0,
    pitch: 1.0,
    volume: 1.0,
  });
}

/*
! Initialize voice_preferences table if not exists
*/
export function initVoicePreferencesTable(): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS voice_preferences (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id     INTEGER NOT NULL DEFAULT 1,
      locale      TEXT NOT NULL,
      voice_uri   TEXT,
      voice_name  TEXT,
      rate        REAL DEFAULT 1.0,
      pitch       REAL DEFAULT 1.0,
      volume      REAL DEFAULT 1.0,
      created_at  INTEGER DEFAULT (strftime('%s', 'now')),
      updated_at  INTEGER DEFAULT (strftime('%s', 'now')),
      UNIQUE(user_id, locale)
    );

    CREATE INDEX IF NOT EXISTS idx_voice_prefs_user_locale 
    ON voice_preferences(user_id, locale);
  `);
}

// Initialize on module load
initVoicePreferencesTable();
