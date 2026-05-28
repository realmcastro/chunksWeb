---
prioridade: 63
categoria: feature,ux
esforco: 4-8h
risco: baixo
dependencias: [62-stats-event-schema]
---

# Activity heatmap (GitHub-style calendar)

## Contexto

Sem visualização longitudinal de actividade. User não vê padrão: "estudo mais em segundas" ou "perdi 5 dias seguidos em março".

## Problema

- Streak count mostra apenas length atual, não distribuição
- Sem retrospect: "quanto estudei em janeiro?" requer mental math
- Sem motivação visual (preencher squares = satisfação intrínseca)

## Proposta

### Component
SVG-based heatmap, 7 rows × 52 cols (1 year), 1 square = 1 day.

Color intensity ladder:
- 0 reviews: gray-100 (dark: gray-800)
- 1–10: green-200
- 11–25: green-400
- 26–50: green-600
- 51+: green-700

### Data source
`user_daily_stats` (item 62) — pre-aggregated.

```sql
SELECT date, reviews_count, new_chunks, feynman_count
FROM user_daily_stats
WHERE user_id = ? AND date >= date('now', '-365 days')
ORDER BY date;
```

### Interactions
- Hover tooltip: "23 reviews · 5 new · 2 feynman on 2026-03-15"
- Click date → drill-down modal listing events of that day
- Toggle metric: reviews | minutes | new chunks | combined XP

### Variants
- Year view (default)
- Month view (zoom-in for current month)
- Custom range

### Public profile preview
- Quando leaderboard (item 85) ou public profile ship: heatmap shareable

## Arquivos

- `src/components/dashboard/ActivityHeatmap.tsx`
- `src/app/api/progress/heatmap/route.ts`
- `src/lib/db/sqlite.ts` — `getDailyStatsRange(userId, fromDate, toDate)`

## Validação

- [ ] Renderiza < 50ms (SVG light)
- [ ] Tooltip acessível (aria-label, screen reader announce)
- [ ] Keyboard nav (arrow keys move selection)
- [ ] Mobile: horizontal scroll for full year
- [ ] Dark mode color ladder distinguível
- [ ] Empty state: "Start studying to fill this calendar"

## Decisões pendentes

- Color scheme: green (GitHub clássico) ou theme primary? Primary mais branded.
- Metric default: reviews_count ou XP composto?
- Week start: Sunday vs Monday? User locale.
