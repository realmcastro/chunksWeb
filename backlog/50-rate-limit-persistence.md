---
prioridade: 50
categoria: security
esforco: 1 dia
risco: medio
status: bloqueado-decisao
---

# Rate-limit persistência

## Contexto

`src/lib/rate-limit.ts` usa Map in-memory. Autor já documentou: "single-instance only — swap para Redis quando multi-instance".

## Problema

- Container restart zera buckets — atacante pode esperar deploy/crash para retomar brute-force
- Single-instance limita escala horizontal futura
- Sem persistência de evento de abuso → sem audit log

## Proposta

Opção A (incremental, single-instance):
- Persistir buckets em SQLite tabela `rate_limit_buckets (key, tokens, refilled_at)`
- Mesma API `checkRateLimit()` — mudança interna
- Cleanup job: trim entries > windowMs * 5 idade

Opção B (escala futura):
- Upstash Redis (HTTP-based, serverless-friendly)
- `@upstash/ratelimit` lib

## Arquivos

- `src/lib/rate-limit.ts`
- `src/lib/db/sqlite.ts` (queries)
- Migration: nova tabela

## Validação

- [ ] Container restart preserva contagem
- [ ] Performance: < 1ms overhead por request
- [ ] Cleanup não bloqueia request hot path

## Decisões pendentes

- **A ou B?** Atual hoje é single-instance (deploy local). A é suficiente. Reavaliar quando multi-instance.
- Manter Map in-memory como L1 cache + SQLite L2? Aumenta complexidade — provavelmente não vale.
