---
prioridade: 60
categoria: feature
esforco: 1 dia
risco: baixo
status: bloqueado-decisao
---

# Streak UI + freeze mechanic

## Contexto

Streak calculado em `src/lib/db/sqlite.ts` + exibido em `progress/page.tsx` e `DashboardClient.tsx`. Sem TopNav exposure, sem freeze, sem recovery.

## Problema

- Usuário só vê streak ao abrir progress page
- Quebra de streak após 1 dia perdido é punitiva — motivação cai
- Sem "freeze" / "streak saver" mecanismo (Duolingo-style)

## Proposta

1. Componente `StreakBadge` em `src/components/layout/TopNav.tsx`
   - Mostra contagem + flame icon
   - Toast on day-rollover quando atinge milestone (7, 30, 100)
2. Freeze mechanic:
   - User ganha 1 freeze a cada 7 dias completos
   - Freeze auto-aplica em dia perdido (max 2 freeze stack)
   - Schema: `user_streak_state (user_id, current_streak, longest_streak, freezes_available, last_freeze_used_at)`
3. UI: settings page expõe contagem de freezes

## Arquivos

- `src/components/layout/TopNav.tsx`
- `src/components/dashboard/StreakBadge.tsx` (novo)
- `src/app/api/progress/stats/route.ts` (incluir freezes)
- `src/lib/db/sqlite.ts` (query + update)
- Migration: tabela `user_streak_state`

## Validação

- [ ] Streak incrementa em primeira atividade do dia
- [ ] Streak NÃO incrementa em segunda atividade no mesmo dia
- [ ] Freeze auto-aplica quando user pula um dia (até max stack)
- [ ] Reset para 0 quando freeze esgota

## Decisões pendentes

- **Definir regras**: 1 dia missed = perde streak? 2 dias? Use freeze?
- Freeze por tempo (Duolingo) ou por ação (XP)?
- Mostrar streak para users novos (< 3 dias) ou esconder até atingir 3?
