---
prioridade: 19
categoria: data,dx
esforco: 4-8h
risco: medio
---

# Migration runner (replace ad-hoc init)

## Contexto

Schema migrations atualmente ad-hoc dentro de `initUserProgressTables()` em `src/lib/db/sqlite.ts`. `scripts/migrations/` existe sem runner. Sem tracking de migrations aplicadas.

## Problema

- Idempotência depende de `CREATE TABLE IF NOT EXISTS` — não suporta `ALTER TABLE`, data migrations
- Sem ordem garantida → bugs em ambientes com schema diferente
- Sem rollback
- Múltiplos devs adicionando schema → conflito

## Proposta

### Tabela tracking
```sql
CREATE TABLE schema_migrations (
  id INTEGER PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  applied_at INTEGER NOT NULL
);
```

### Convenção
- `scripts/migrations/NNNN_name.ts` — NNNN ordering
- Cada arquivo exporta:
  ```ts
  export const name = '0001_add_email_to_users';
  export function up(db: Database): void { /* SQL */ }
  export function down(db: Database): void { /* rollback */ } // opcional
  ```

### Runner
`scripts/migrations/runner.ts`:
1. Conectar DB
2. Garantir tabela schema_migrations
3. Listar arquivos `NNNN_*.ts` ordenados
4. Para cada não aplicado: BEGIN; up(); INSERT schema_migrations; COMMIT
5. Erro: ROLLBACK + abort

### Integração
- `package.json` scripts:
  - `db:migrate` — runner up
  - `db:migrate:down` — rollback last
  - `db:migrate:status` — list applied/pending
- Auto-run no `npm run dev` e build pre-step? Optional via env flag.

## Arquivos

- `scripts/migrations/runner.ts` (NEW)
- `scripts/migrations/0001_initial_schema.ts` (extrair de sqlite.ts init)
- `scripts/migrations/0002_user_progress.ts`
- Refatorar `src/lib/db/sqlite.ts` — remover `init*()` functions

## Validação

- [ ] Fresh DB: runner cria schema completo
- [ ] Existing DB: runner detecta tabelas existentes, marca migrations 0001+ como aplicadas
- [ ] Add migration novo: runner aplica apenas o novo
- [ ] Rollback last funciona
- [ ] Concurrent runs (dois processos) → second waits ou aborts (lock via PRAGMA)

## Decisões pendentes

- Pure TS (better-sqlite3 direct) ou Knex/Drizzle? Pure mantém zero-dep.
- Reversible migrations obrigatórias?
- Data migrations (ex: backfill column) — runner suporta nativo?
