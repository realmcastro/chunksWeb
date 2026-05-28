---
prioridade: 17
categoria: performance,feature
esforco: 1 dia
risco: baixo
---

# FTS5 full-text search para chunks

## Contexto

Browse route filtra por category/CEFR/priority. Search por chunk_text/meaning usa `LIKE '%query%'` (full table scan).

## Problema

- LIKE scan: O(n) com tabela inteira; lento em 10K+ chunks
- Sem ranking de relevância (matches em chunk_text > meaning, etc.)
- Sem stemming/tokenization (busca "running" não encontra "run")

## Proposta

### Schema
```sql
CREATE VIRTUAL TABLE chunks_fts USING fts5(
  chunk_text,
  meaning,
  content='chunks',
  content_rowid='id',
  tokenize='porter unicode61'
);

-- Triggers sync
CREATE TRIGGER chunks_ai AFTER INSERT ON chunks BEGIN
  INSERT INTO chunks_fts(rowid, chunk_text, meaning)
  VALUES (new.id, new.chunk_text, new.meaning);
END;
CREATE TRIGGER chunks_ad AFTER DELETE ON chunks BEGIN
  INSERT INTO chunks_fts(chunks_fts, rowid, chunk_text, meaning)
  VALUES('delete', old.id, old.chunk_text, old.meaning);
END;
CREATE TRIGGER chunks_au AFTER UPDATE ON chunks BEGIN
  INSERT INTO chunks_fts(chunks_fts, rowid, chunk_text, meaning)
  VALUES('delete', old.id, old.chunk_text, old.meaning);
  INSERT INTO chunks_fts(rowid, chunk_text, meaning)
  VALUES (new.id, new.chunk_text, new.meaning);
END;
```

### Query
```sql
SELECT c.*, rank FROM chunks c
JOIN chunks_fts ON chunks_fts.rowid = c.id
WHERE chunks_fts MATCH ?
ORDER BY rank LIMIT ? OFFSET ?;
```

Match syntax: `'learn*'` prefix, `'verb NEAR/3 phrasal'` proximity.

### Initial backfill
- Migration: `INSERT INTO chunks_fts(rowid, chunk_text, meaning) SELECT id, chunk_text, meaning FROM chunks;`

## Arquivos

- `src/lib/db/sqlite.ts` — adicionar `searchChunksFTS()`, init triggers
- `src/app/api/chunks/browse/route.ts` — usar FTS quando `search` query param presente
- Migration SQL

## Validação

- [ ] Search "verb" retorna ranked results
- [ ] Prefix search "lear*" funciona
- [ ] Insert/update/delete chunk reflete no FTS
- [ ] Performance < 50ms em 10K chunks (vs LIKE ~ 500ms+)
- [ ] Multilingual: tokenizer `unicode61` lida com PT/ES/FR diacritics

## Decisões pendentes

- Stemming: `porter` (inglês) vs `unicode61` puro? Inglês é primary content → porter. PT/ES via tokenizer custom (não trivial).
- Indexar examples também? Trade-off: tabela maior, melhor recall.
