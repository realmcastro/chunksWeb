/*
! Migration script to add i18n_language column to existing user_settings table.
*/

import { db } from '@/lib/db/sqlite';

export function migrateAddI18nLanguage(): void {
  // Check if i18n_language column already exists
  const tableInfo = db.prepare('PRAGMA table_info(user_settings)').all() as { name: string }[];
  const hasI18nLanguage = tableInfo.some((col) => col.name === 'i18n_language');

  if (!hasI18nLanguage) {
    console.log('[Migration] Adding i18n_language column to user_settings...');
    db.exec(`ALTER TABLE user_settings ADD COLUMN i18n_language TEXT NOT NULL DEFAULT 'en'`);
    console.log('[Migration] i18n_language column added successfully');
  } else {
    console.log('[Migration] i18n_language column already exists, skipping');
  }
}

// Run migration
migrateAddI18nLanguage();
