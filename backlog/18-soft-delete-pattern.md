---
prioridade: 18
categoria: refactor,data
esforco: 1-2 dias
risco: medio
---

# Soft-delete pattern + content versioning

## Contexto

Deletes são hard (DELETE FROM ...). Edits em chunk_text/meaning sobrescrevem histórico.

## Problema

- Sem audit trail: impossível saber quando/quem editou chunk
- Sem rollback após edit indevido
- Reports referenciam chunks que podem ter sido editados → contexto perdido
- User deletion cascade hard-deleta sessions úteis para analytics agregadas

## Proposta

### Soft-delete
- Adicionar `deleted_at INTEGER NULL` em: `chunks`, `user_progress`, `study_sessions`, `chunk_reports`, `users`, `feynman_explanations`
- Default queries: `WHERE deleted_at IS NULL`
- Helper: `softDelete(table, id)` → UPDATE deleted_at = unixepoch()
- Restore: `UPDATE ... SET deleted_at = NULL WHERE id = ?`

### Content versioning (chunks only)
- Tabela `chunk_versions (id, chunk_id, chunk_text, meaning, edited_by, edited_at)`
- Trigger: `AFTER UPDATE OF chunk_text, meaning ON chunks` → INSERT row em chunk_versions com OLD values
- View histórico: `GET /api/chunks/[id]/history` (admin only)
- Rollback: `POST /api/admin/chunks/[id]/restore-version { version_id }`

### Background cleanup
- Job: hard-delete `deleted_at < now - retention` (retention configurable, default 90d)
- Audit log antes de hard-delete

## Arquivos

- Migration SQL (adicionar coluna em N tabelas)
- `src/lib/db/sqlite.ts` — todos SELECTs adicionam filter; novo `softDelete()`, `restore()`
- `src/lib/db/versions.ts` — query histórico chunks
- `src/app/api/admin/chunks/[id]/history/route.ts`
- `scripts/cleanup-soft-deleted.ts`

## Validação

- [ ] Soft-deleted chunk não aparece em browse
- [ ] Restore funciona
- [ ] Edit chunk cria row em chunk_versions
- [ ] History list ordenado desc
- [ ] Hard-delete após retention funciona
- [ ] Queries existentes não regressionam (mais filter, mais work — checar EXPLAIN)

## Decisões pendentes

- Retention: 30d / 90d / 1y?
- User deletion (item 14) usa este pattern — coordenar
- Versioning para outros models (examples, categories)? Provavelmente não vale.
- Index parcial: `CREATE INDEX ... WHERE deleted_at IS NULL` para skip soft-deleted em hot queries.
