---
prioridade: 85
categoria: feature
esforco: 2 dias
risco: baixo
---

# Leaderboard opt-in (privacy-first)

## Contexto

Sem componente social / competitivo. Streak já calculado mas isolado por user.

## Problema

- Sem motivação social → retention cai
- Comparação anônima pode motivar sem expor dados

## Proposta

`src/features/leaderboard/`:

- Opt-in flag em settings (`users.leaderboard_opt_in BOOLEAN DEFAULT FALSE`)
- Computed view: top N users por XP/streak/reviews na janela (weekly, monthly, all-time)
- Anonimização: display name = `Learner #${hash(userId)}` se user não optou por nome
- Routes: `GET /api/leaderboard?window=weekly`

UI:
- Page `/leaderboard` apenas para opted-in users
- Sidebar widget pequeno mostrando posição relativa

## Arquivos

- `src/features/leaderboard/` (estrutura completa)
- `src/app/leaderboard/page.tsx`
- `src/app/api/leaderboard/route.ts`
- `src/lib/db/sqlite.ts` (queries agregadas + index)
- Migration: column `users.leaderboard_opt_in`

## Validação

- [ ] User não opted-in não aparece e não pode ver leaderboard
- [ ] Query agregada < 100ms com 10K users (índice em `xp`, `streak`)
- [ ] Cache 5min em memória

## Decisões pendentes

- Métrica: XP total, weekly XP, streak, reviews count?
- Friend-only leaderboard separado (requer relação user-user)?
- Reset semanal vs sliding window?
