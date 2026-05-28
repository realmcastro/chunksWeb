---
prioridade: 38
categoria: feature
esforco: 2-3 dias
risco: baixo
---

# Tags + notes + bookmarks (user customization)

## Contexto

Favoritos existe (binary). Sem tags customizáveis, notas pessoais por chunk, ou bookmarks organizados em coleções.

## Problema

- User pode marcar favorito mas não anotar "por que" memorável
- Não pode agrupar chunks por contexto pessoal (work, travel, dating)
- Sem export de coleções customizadas

## Proposta

### Notes
```sql
CREATE TABLE user_chunk_notes (
  id INTEGER PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  chunk_id INTEGER REFERENCES chunks(id),
  note TEXT NOT NULL,
  updated_at INTEGER NOT NULL,
  UNIQUE(user_id, chunk_id)
);
```
- Textarea em chunk detail page
- Markdown support (light, no XSS — sanitize)

### Tags
```sql
CREATE TABLE user_tags (
  id INTEGER PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  name TEXT NOT NULL,
  color TEXT,
  UNIQUE(user_id, name)
);
CREATE TABLE user_chunk_tags (
  user_id INTEGER, chunk_id INTEGER, tag_id INTEGER,
  PRIMARY KEY (user_id, chunk_id, tag_id)
);
```
- Multi-select per chunk
- Filter browse por tag(s)
- Inline create-on-type

### Collections (bookmarks evoluído)
```sql
CREATE TABLE user_collections (id, user_id, name, description, is_public BOOL, created_at);
CREATE TABLE user_collection_chunks (collection_id, chunk_id, added_at);
```
- "Travel phrases", "Job interview", etc.
- Optional public sharing (URL `/c/[hash]`)
- Study session restrito à collection

### UI
- Chunk detail: tags chips, note textarea, "Add to collection" button
- Sidebar: list collections, recent tags
- Browse filter: tag pills, collection dropdown

## Arquivos

- Migrations (3)
- `src/lib/db/sqlite.ts` queries
- `src/app/api/notes/route.ts`
- `src/app/api/tags/route.ts`
- `src/app/api/collections/route.ts`
- `src/components/chunks/ChunkNote.tsx`
- `src/components/chunks/TagPicker.tsx`
- `src/components/collections/CollectionPicker.tsx`
- `src/app/collections/page.tsx`

## Validação

- [ ] Note autosave (debounced)
- [ ] Tag autocomplete
- [ ] Collection share link funciona (read-only)
- [ ] Note markdown sanitizado (no script)
- [ ] Browse filter combina tag + category

## Decisões pendentes

- Note size limit (10KB)?
- Public collections requer moderation?
- Tag color picker ou hash-derived?
- Migrate favorites → "Starred" auto-collection?
