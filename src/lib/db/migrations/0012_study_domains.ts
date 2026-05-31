import type { Database } from 'better-sqlite3';

export const name = '0012_study_domains';

export function up(db: Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS study_domains (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      slug TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('language','programming','science','math','custom')),
      content_schema TEXT NOT NULL DEFAULT '{"front":"text","back":"text"}',
      enabled_modes TEXT NOT NULL DEFAULT '["flashcard","quiz"]',
      sm2_enabled INTEGER NOT NULL DEFAULT 1,
      spaced_repetition_algorithm TEXT NOT NULL DEFAULT 'sm2',
      icon TEXT,
      color TEXT,
      created_by INTEGER REFERENCES users(id),
      is_system INTEGER NOT NULL DEFAULT 0,
      created_at INTEGER NOT NULL DEFAULT (strftime('%s','now')),
      deleted_at INTEGER
    );

    CREATE TABLE IF NOT EXISTS user_domains (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id),
      domain_id INTEGER NOT NULL REFERENCES study_domains(id),
      active INTEGER NOT NULL DEFAULT 1,
      sort_order INTEGER NOT NULL DEFAULT 0,
      settings TEXT NOT NULL DEFAULT '{}',
      added_at INTEGER NOT NULL DEFAULT (strftime('%s','now')),
      UNIQUE(user_id, domain_id)
    );

    CREATE INDEX IF NOT EXISTS idx_user_domains_user ON user_domains(user_id, active);
    CREATE INDEX IF NOT EXISTS idx_study_domains_slug ON study_domains(slug) WHERE deleted_at IS NULL;
  `);

  /*
  ! Seed system domains — idempotent (INSERT OR IGNORE).
  ! en-language seeds first so backfill below has a valid domain_id.
  */
  const seedDomains = [
    {
      slug: 'en-language',
      name: 'English',
      type: 'language',
      content_schema: JSON.stringify({ front: 'text', back: 'text', pronunciation: 'ipa', examples: 'array' }),
      enabled_modes: JSON.stringify(['flashcard', 'quiz', 'feynman', 'pronunciation', 'dictation', 'cloze', 'audio']),
      sm2_enabled: 1,
      algorithm: 'sm2',
      icon: '🇬🇧',
      color: '#3b82f6',
    },
    {
      slug: 'python',
      name: 'Python',
      type: 'programming',
      content_schema: JSON.stringify({ front: 'text', back: 'text', code: 'text' }),
      enabled_modes: JSON.stringify(['flashcard', 'quiz', 'feynman', 'cloze']),
      sm2_enabled: 1,
      algorithm: 'sm2',
      icon: '🐍',
      color: '#f59e0b',
    },
    {
      slug: 'javascript',
      name: 'JavaScript',
      type: 'programming',
      content_schema: JSON.stringify({ front: 'text', back: 'text', code: 'text' }),
      enabled_modes: JSON.stringify(['flashcard', 'quiz', 'feynman', 'cloze']),
      sm2_enabled: 1,
      algorithm: 'sm2',
      icon: '⚡',
      color: '#eab308',
    },
    {
      slug: 'sql',
      name: 'SQL',
      type: 'programming',
      content_schema: JSON.stringify({ front: 'text', back: 'text', code: 'text' }),
      enabled_modes: JSON.stringify(['flashcard', 'quiz', 'cloze']),
      sm2_enabled: 1,
      algorithm: 'sm2',
      icon: '🗄️',
      color: '#6366f1',
    },
  ];

  const insertDomain = db.prepare(`
    INSERT OR IGNORE INTO study_domains
      (slug, name, type, content_schema, enabled_modes, sm2_enabled, spaced_repetition_algorithm, icon, color, is_system)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
  `);

  for (const d of seedDomains) {
    insertDomain.run(d.slug, d.name, d.type, d.content_schema, d.enabled_modes, d.sm2_enabled, d.algorithm, d.icon, d.color);
  }

  const enLangId = (
    db.prepare('SELECT id FROM study_domains WHERE slug = ?').get('en-language') as { id: number }
  ).id;

  /*
  ! Add domain_id to chunks — nullable for backward compat, backfill all existing rows.
  ! All current chunks are English-language chunks → map to en-language domain.
  ! Guard: table may not exist in fresh test DBs (chunks are pre-seeded in production DB file).
  */
  const chunkCols = db.pragma('table_info(chunks)') as Array<{ name: string }>;
  if (chunkCols.length > 0 && !chunkCols.some((c) => c.name === 'domain_id')) {
    db.exec(`ALTER TABLE chunks ADD COLUMN domain_id INTEGER REFERENCES study_domains(id)`);
    db.prepare('UPDATE chunks SET domain_id = ? WHERE domain_id IS NULL').run(enLangId);
  }

  /*
  ! Add domain_id to user_progress — same backfill logic.
  ! Guard: table may not exist in fresh test DBs.
  */
  const progressCols = db.pragma('table_info(user_progress)') as Array<{ name: string }>;
  if (progressCols.length > 0 && !progressCols.some((c) => c.name === 'domain_id')) {
    db.exec(`ALTER TABLE user_progress ADD COLUMN domain_id INTEGER REFERENCES study_domains(id)`);
    db.prepare('UPDATE user_progress SET domain_id = ? WHERE domain_id IS NULL').run(enLangId);
  }

  /*
  ! Migrate existing user_settings.learning_language → user_domains rows.
  ! One user_domains row per existing user who has a setting.
  */
  const userSettingsRows = db
    .prepare('SELECT user_id, learning_language FROM user_settings')
    .all() as Array<{ user_id: number; learning_language: string }>;

  const insertUserDomain = db.prepare(`
    INSERT OR IGNORE INTO user_domains (user_id, domain_id, active, sort_order, added_at)
    VALUES (?, ?, 1, 0, strftime('%s','now'))
  `);

  for (const row of userSettingsRows) {
    const domainRow = db
      .prepare("SELECT id FROM study_domains WHERE slug = ? OR slug = 'en-language' LIMIT 1")
      .get(`${row.learning_language}-language`) as { id: number } | undefined;
    const domainId = domainRow?.id ?? enLangId;
    insertUserDomain.run(row.user_id, domainId);
  }
}

export function down(db: Database): void {
  /*
  ! Reverse order: remove added columns before dropping tables.
  ! SQLite does not support DROP COLUMN — we recreate tables.
  ! For safety we only drop the new tables; chunk/progress columns stay
  ! (they are nullable and harmless; a full rollback script should recreate).
  */
  db.exec(`
    DROP INDEX IF EXISTS idx_user_domains_user;
    DROP INDEX IF EXISTS idx_study_domains_slug;
    DROP TABLE IF EXISTS user_domains;
    DROP TABLE IF EXISTS study_domains;
  `);
}
