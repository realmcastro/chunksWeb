import type { Database } from 'better-sqlite3';

export const name = '0015_search_index';

export function up(db: Database): void {
  /*
  ! Cross-module unified search index using FTS5 trigram tokenizer.
  ! trigram enables partial-word matching ("dist" finds "distributed").
  ! entity_type + entity_id identify the source record in its origin table.
  ! user_id is UNINDEXED — stored but not tokenized (used for filtering).
  */
  db.exec(`
    CREATE VIRTUAL TABLE IF NOT EXISTS search_index USING fts5(
      entity_type UNINDEXED,
      entity_id UNINDEXED,
      user_id UNINDEXED,
      domain_slug UNINDEXED,
      indexed_at UNINDEXED,
      title,
      body,
      tags,
      tokenize='trigram'
    );
  `);

  /*
  ! Backfill: index all existing chunks as initial search content.
  ! Subsequent additions indexed via event bus (study.chunk.created, etc.)
  ! Guard: chunks table may not exist in fresh test DBs (pre-seeded in production DB file).
  */
  const chunksTableExists = !!(
    db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='chunks'").get()
  );
  const indexEmpty = (
    db.prepare('SELECT COUNT(*) AS n FROM search_index').get() as { n: number }
  ).n === 0;

  if (chunksTableExists && indexEmpty) {
    const chunks = db
      .prepare(`
        SELECT c.id, c.chunk_text, c.meaning, c.spacing_tag, sd.slug as domain_slug
        FROM chunks c
        LEFT JOIN study_domains sd ON c.domain_id = sd.id
        WHERE c.deleted_at IS NULL
      `)
      .all() as Array<{
        id: number;
        chunk_text: string;
        meaning: string;
        spacing_tag: string | null;
        domain_slug: string | null;
      }>;

    const now = Math.floor(Date.now() / 1000);
    const insert = db.prepare(`
      INSERT INTO search_index (entity_type, entity_id, user_id, domain_slug, indexed_at, title, body, tags)
      VALUES ('chunk', ?, 0, ?, ?, ?, ?, ?)
    `);

    db.transaction(() => {
      for (const chunk of chunks) {
        insert.run(
          chunk.id,
          chunk.domain_slug ?? 'en-language',
          now,
          chunk.chunk_text,
          chunk.meaning,
          chunk.spacing_tag ?? '',
        );
      }
    })();
  }
}

export function down(db: Database): void {
  db.exec('DROP TABLE IF EXISTS search_index');
}
