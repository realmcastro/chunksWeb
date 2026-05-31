import { db } from '@/lib/db/sqlite';
import type { EntityType } from './queryParser';

export interface IndexEntry {
  entityType: EntityType;
  entityId: number | string;
  userId: number;
  domainSlug: string;
  title: string;
  body: string;
  tags: string;
}

function upsertIndex(entry: IndexEntry): void {
  const now = Math.floor(Date.now() / 1000);

  // Delete existing entry for this entity before re-inserting (FTS5 content tables require delete + insert for updates)
  db.prepare(`
    DELETE FROM search_index WHERE entity_type = ? AND entity_id = ? AND user_id = ?
  `).run(entry.entityType, String(entry.entityId), entry.userId);

  db.prepare(`
    INSERT INTO search_index (entity_type, entity_id, user_id, domain_slug, indexed_at, title, body, tags)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    entry.entityType,
    String(entry.entityId),
    entry.userId,
    entry.domainSlug,
    now,
    entry.title,
    entry.body,
    entry.tags,
  );
}

export function indexChunk(chunkId: number): void {
  const row = db
    .prepare(`
      SELECT c.id, c.chunk_text, c.meaning, c.spacing_tag, sd.slug AS domain_slug
      FROM chunks c
      LEFT JOIN study_domains sd ON c.domain_id = sd.id
      WHERE c.id = ? AND c.deleted_at IS NULL
    `)
    .get(chunkId) as
    | { id: number; chunk_text: string; meaning: string; spacing_tag: string | null; domain_slug: string | null }
    | undefined;

  if (!row) return;

  upsertIndex({
    entityType: 'chunk',
    entityId: row.id,
    userId: 0, // chunks are system-wide (not per-user)
    domainSlug: row.domain_slug ?? 'en-language',
    title: row.chunk_text,
    body: row.meaning,
    tags: row.spacing_tag ?? '',
  });
}

export function removeFromIndex(entityType: EntityType, entityId: number | string, userId = 0): void {
  db.prepare('DELETE FROM search_index WHERE entity_type = ? AND entity_id = ? AND user_id = ?')
    .run(entityType, String(entityId), userId);
}

/*
! Full reindex of all chunks — idempotent, safe to run anytime.
! Used by the npm run search:reindex script and migration backfill.
*/
export function reindexAllChunks(): void {
  const chunks = db
    .prepare(`
      SELECT c.id, c.chunk_text, c.meaning, c.spacing_tag, sd.slug AS domain_slug
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

  // Clear existing chunk entries
  db.prepare("DELETE FROM search_index WHERE entity_type = 'chunk'").run();

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
