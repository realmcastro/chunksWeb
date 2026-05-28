/*
! TTS settings storage operations for SQLite.
! Manages global TTS preferences per user.
*/

import { db } from '@/lib/db/sqlite';
import type { TTSSettings } from '../types';

/*
! Get TTS settings for a user
*/
export function getTTSSettings(userId: number): TTSSettings | null {
  const stmt = db.prepare('SELECT * FROM tts_settings WHERE user_id = ?');
  return stmt.get(userId) as TTSSettings | null;
}

/*
! Save or update TTS settings
*/
export function saveTTSSettings(
  userId: number,
  settings: Partial<Omit<TTSSettings, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>,
): TTSSettings {
  const now = Math.floor(Date.now() / 1000);

  const defaults = getTTSSettings(userId);

  const stmt = db.prepare(`
    INSERT OR REPLACE INTO tts_settings 
    (id, user_id, default_rate, default_pitch, default_volume, auto_play, highlight_phonemes, playback_mode, created_at, updated_at)
    VALUES (
      (SELECT id FROM tts_settings WHERE user_id = ?) 
        OR (SELECT MAX(id) + 1 FROM tts_settings)
        OR 1,
      ?, ?, ?, ?, ?, ?, ?, ?, ?
    )
  `);

  stmt.run(
    userId,
    userId,
    settings.defaultRate ?? defaults?.defaultRate ?? 0.9,
    settings.defaultPitch ?? defaults?.defaultPitch ?? 1.0,
    settings.defaultVolume ?? defaults?.defaultVolume ?? 1.0,
    settings.autoPlay !== undefined
      ? settings.autoPlay
        ? 1
        : 0
      : (defaults?.autoPlay ?? false)
        ? 1
        : 0,
    settings.highlightPhonemes !== undefined
      ? settings.highlightPhonemes
        ? 1
        : 0
      : (defaults?.highlightPhonemes ?? true)
        ? 1
        : 0,
    settings.playbackMode ?? defaults?.playbackMode ?? 'sequential',
    now,
    now,
  );

  return getTTSSettings(userId)!;
}

/*
! Reset TTS settings to defaults
*/
export function resetTTSSettings(userId: number): TTSSettings {
  return saveTTSSettings(userId, {});
}

/*
! Initialize tts_settings table if not exists
*/
export function initTTSSettingsTable(): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS tts_settings (
      id                  INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id             INTEGER NOT NULL DEFAULT 1,
      default_rate        REAL DEFAULT 0.9,
      default_pitch       REAL DEFAULT 1.0,
      default_volume      REAL DEFAULT 1.0,
      auto_play           INTEGER DEFAULT 0,
      highlight_phonemes  INTEGER DEFAULT 1,
      playback_mode       TEXT DEFAULT 'sequential',
      created_at          INTEGER DEFAULT (strftime('%s', 'now')),
      updated_at          INTEGER DEFAULT (strftime('%s', 'now')),
      UNIQUE(user_id)
    );
  `);
}

// Initialize on module load
initTTSSettingsTable();
