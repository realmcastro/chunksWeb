---
prioridade: 65
categoria: feature,ux
esforco: 1 dia
risco: baixo
dependencias: [62-stats-event-schema]
---

# Time investment tracker

## Contexto

`study_sessions` tem start/end timestamps. Sem visualização agregada de "quanto tempo investi" — métrica psicologicamente importante (sunk cost positivo, retrospect satisfação).

## Problema

- User não sabe quantas horas total estudou
- Sem distribuição por activity type (review vs new vs feynman vs game)
- Sem comparação "tempo planejado vs efetivo"
- Daily goal é "chunks count", não tempo — alguns chunks são rápidos, outros lentos

## Proposta

### Tracking
Já temos `study_sessions.started_at`, `ended_at`. Adicionar:
- `study_sessions.activity_type` (learn | review | feynman | vocab | cloze | dictation | grammar)
- Auto-end session quando inativo > 10min (idle detection client-side via visibility API)

### Aggregation
- Daily: `time_spent_ms` per activity_type em `user_daily_stats` (item 62)
- Weekly/monthly: ROLLUP

### Visualizations
1. **Total hours all-time** (hero card)
2. **Stacked bar chart**: minutes/day por activity_type, last 30 days
3. **Pie**: distribution by activity (last 30 days)
4. **Average session length**: "12 min / session avg"
5. **Best time of day**: heatmap hour × weekday (when user most studies)

### Time-based goals
- Adicionar setting "Target minutes per day" (alternative a chunks count)
- Progress bar dual: chunks goal AND time goal

### Estimated time remaining
- Em review queue: "23 due · ~9 min" (based on avg response time)

## Arquivos

- Migration: `study_sessions.activity_type`
- `src/lib/db/sqlite.ts` — aggregations por activity_type
- `src/components/dashboard/TimeInvestmentChart.tsx`
- `src/components/dashboard/TimeOfDayHeatmap.tsx`
- `src/lib/hooks/useIdleDetection.ts` — auto-end session
- `src/app/api/progress/time-stats/route.ts`

## Validação

- [ ] Session auto-end após 10min idle
- [ ] Activity type tracked em cada review/feynman/etc.
- [ ] Stacked chart legível mesmo com 6 activity types
- [ ] Hour heatmap: privacy (não tracking exact hour, apenas hour-of-day)
- [ ] Mobile: charts responsivos

## Decisões pendentes

- Idle threshold: 5min (aggressive) ou 10min (lenient)?
- Activity types granularity: 6 categorias OK ou simplificar?
- Time tracking opt-out setting?
