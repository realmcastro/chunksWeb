---
prioridade: 43
categoria: performance,dx
esforco: 4h
risco: baixo
---

# DB query profiler + EXPLAIN dev tool

## Contexto

`src/lib/db/sqlite.ts` tem 2200+ linhas de queries. Sem timing instrumentation. Multiple JOINs sem EXPLAIN audit.

## Problema

- Slow query unknown → diagnostic apenas em incident
- Missing indexes não detectados até prod
- Otimizações ad-hoc sem baseline

## Proposta

### Dev profiler
Wrapper em `db.prepare()`:
```ts
function profilingPrepare(sql: string) {
  const stmt = db.prepare(sql);
  if (process.env.NODE_ENV !== 'production') {
    return new Proxy(stmt, {
      get(target, prop) {
        if (prop === 'all' || prop === 'get' || prop === 'run') {
          return (...args) => {
            const t0 = performance.now();
            const result = target[prop](...args);
            const elapsed = performance.now() - t0;
            if (elapsed > 50) logger.warn('slow_query', { sql, elapsed_ms: elapsed });
            return result;
          };
        }
        return target[prop];
      },
    });
  }
  return stmt;
}
```

### EXPLAIN analyzer
Script `scripts/db-analyze.ts`:
- Iterate all `db.prepare()` calls em sqlite.ts (regex extract)
- Run EXPLAIN QUERY PLAN
- Flag: full-table-scan, missing-index hints

Run: `npm run db:analyze`

### Index suggestions
- Output: "Query X uses SCAN TABLE user_progress — consider INDEX on (user_id, due_at)"
- Manual review + apply

## Arquivos

- `src/lib/db/sqlite.ts` — wrap prepare em dev
- `scripts/db-analyze.ts` (NEW)
- `package.json` — script

## Validação

- [ ] Dev mode: query > 50ms logada
- [ ] `npm run db:analyze` lista todas queries + plan
- [ ] Identifica 3+ missing index candidates
- [ ] After adding indexes: re-run shows improvement

## Decisões pendentes

- Threshold slow query: 50ms? 100ms?
- Prod profiling sample (1%) ou off? Sentry Performance cobre futuramente.
