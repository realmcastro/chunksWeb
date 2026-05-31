import type { Database } from 'better-sqlite3';

export const name = '0011_fts5';

export function up(db: Database): void {
  // FTS5 requires the chunks table to exist as a content source
  const chunksExists = db
    .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='chunks'")
    .get();
  if (!chunksExists) return;

  db.exec(`
    CREATE VIRTUAL TABLE IF NOT EXISTS chunks_fts USING fts5(
      chunk_text,
      meaning,
      content='chunks',
      content_rowid='id',
      tokenize='porter unicode61'
    );
  `);

  const triggerNames = ['chunks_fts_ai', 'chunks_fts_ad', 'chunks_fts_au'];
  const existing = new Set(
    (
      db
        .prepare(
          `SELECT name FROM sqlite_master WHERE type='trigger' AND name IN (${triggerNames.map(() => '?').join(',')})`,
        )
        .all(...triggerNames) as Array<{ name: string }>
    ).map((r) => r.name),
  );

  if (!existing.has('chunks_fts_ai')) {
    db.exec(`
      CREATE TRIGGER chunks_fts_ai AFTER INSERT ON chunks BEGIN
        INSERT INTO chunks_fts(rowid, chunk_text, meaning)
        VALUES (new.id, new.chunk_text, new.meaning);
      END;
    `);
  }

  if (!existing.has('chunks_fts_ad')) {
    db.exec(`
      CREATE TRIGGER chunks_fts_ad AFTER DELETE ON chunks BEGIN
        INSERT INTO chunks_fts(chunks_fts, rowid, chunk_text, meaning)
        VALUES('delete', old.id, old.chunk_text, old.meaning);
      END;
    `);
  }

  if (!existing.has('chunks_fts_au')) {
    db.exec(`
      CREATE TRIGGER chunks_fts_au AFTER UPDATE ON chunks BEGIN
        INSERT INTO chunks_fts(chunks_fts, rowid, chunk_text, meaning)
        VALUES('delete', old.id, old.chunk_text, old.meaning);
        INSERT INTO chunks_fts(rowid, chunk_text, meaning)
        VALUES (new.id, new.chunk_text, new.meaning);
      END;
    `);
  }

  // Backfill on first deploy if FTS is empty but chunks exist
  const ftsCount = (db.prepare('SELECT COUNT(*) as n FROM chunks_fts').get() as { n: number }).n;
  if (ftsCount === 0) {
    const chunkCount = (db.prepare('SELECT COUNT(*) as n FROM chunks').get() as { n: number }).n;
    if (chunkCount > 0) {
      db.exec(
        `INSERT INTO chunks_fts(rowid, chunk_text, meaning) SELECT id, chunk_text, meaning FROM chunks`,
      );
    }
  }
}

export function down(db: Database): void {
  db.exec(`
    DROP TRIGGER IF EXISTS chunks_fts_au;
    DROP TRIGGER IF EXISTS chunks_fts_ad;
    DROP TRIGGER IF EXISTS chunks_fts_ai;
    DROP TABLE IF EXISTS chunks_fts;
  `);
}
