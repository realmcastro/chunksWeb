---
prioridade: 25
categoria: feature,algorithm
esforco: 3-5 dias
risco: alto
status: bloqueado-decisao
---

# FSRS migration (SM-2 → FSRS-4.5)

## Contexto

`src/lib/spaced-repetition/sm2.ts` implementa SuperMemo 2 (1985). FSRS (Free Spaced Repetition Scheduler) é state-of-art moderno usado por Anki, RemNote, Mochi — 20–30% mais eficiente que SM-2 em retention/time.

## Problema

- SM-2 hardcoded: ease factor único, intervalos rígidos 1→6→ease×prev, sem modelagem de difficulty per-card
- Não personaliza por user (alguns aprendem rápido, outros precisam reforço)
- Não aproveita métricas observadas (response time, lapses)

## Proposta

### Avaliação
- Spike: implementar `lib/fsrs/` em paralelo, A/B em users opt-in
- Métricas: retention rate, reviews/day, time-to-mature

### Migration path
- Manter SM-2 default; FSRS opt-in setting
- Per-user model: `user_fsrs_params (user_id, w (17 weights), retention_target)`
- Schema chunks: adicionar `stability`, `difficulty`, `last_review`, `state (new|learning|review|relearning)`

### Implementation
- Lib `open-spaced-repetition` (typescript port oficial)
- Função `nextInterval(card, rating)` retorna `{ nextDueAt, newStability, newDifficulty }`
- Fallback: chunks sem FSRS state usam SM-2

### UI
- Settings: "Algorithm: SM-2 / FSRS (Beta)"
- Tooltip explicando trade-off
- Migration: ao habilitar, FSRS herda due_at do SM-2 mas reseta stability

## Arquivos

- `src/lib/fsrs/` (novo módulo)
- `src/lib/db/sqlite.ts` — add columns + queries
- `src/app/api/review/submit/route.ts` — branch SM-2 vs FSRS
- `src/app/settings/algorithm/page.tsx`
- Migration

## Validação

- [ ] Card novo: estado `new` → primeira review computa stability inicial
- [ ] Quality 3+ promove `learning` → `review`
- [ ] Quality < 3: `lapse` → `relearning`, stability reduz
- [ ] Cohort A/B: FSRS users mostram melhor retention após 30d
- [ ] Default user (sem opt-in) continua SM-2 (zero impacto)

## Decisões pendentes

- **Default novo user: SM-2 ou FSRS?**
- Migration de cards existentes: preserve SM-2 state ou reset?
- Opt-out path: usuário desabilita FSRS → voltar SM-2 sem perder progress?
- Self-optimize weights: ferramenta para usuário rodar (Python lib `fsrs-optimizer`)?
