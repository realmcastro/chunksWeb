---
prioridade: 61
categoria: feature,ux
esforco: 3-4 dias
risco: medio
dependencias: [54-page-shells-templates, 62-stats-event-schema]
---

# Progress dashboard overhaul (rich panel)

## Contexto

`src/app/progress/page.tsx` ~600 linhas client-side: stats (totalChunks, mastered, streak), DailyGoalBar (localStorage), FeynmanAnalytics (quality dist, improving/declining/struggling). Layout vertical longo, sem filtros, sem comparação temporal.

## Problema

- **Sem janela temporal**: tudo all-time, sem "última semana" vs "último mês"
- **Sem comparação**: 23 reviews today — bom ou ruim? Sem context
- **Sem segmentação**: progress por language, category, CEFR nivel separado não-agregado
- **Métricas fracas**: "mastered" binário, sem nuance (struggling, plateau, accelerating)
- **DailyGoal em localStorage**: perde cross-device, sem histórico de targets atingidos
- **Sem leading indicators**: dashboard mostra lagging metrics (mastered count) sem leading (response time trend, lapse rate)

## Proposta

### Hero section
- **Streak fire**: 🔥 N days (with freeze count quando item 60 ship)
- **Today vs goal**: progress ring, comparison %
- **Reviews due**: count + ETA "next session ~12min"
- **Weekly XP**: gamified score (reviews + new + feynman ponderado)

### Time range filter (top right)
- Tabs: Today | Week | Month | Quarter | Year | All time
- All metrics abaixo filtram por window selecionada
- Comparison delta: "+12% vs prev period"

### Sections
1. **Activity heatmap** (item 63) — GitHub-style calendar
2. **Mastery breakdown** — donut chart: New (gray) / Learning (blue) / Review (yellow) / Mature (green) / Lapsed (red)
3. **Category progress bars** — current implementation, refined: bar + delta vs prev period
4. **Forgetting curve** (item 64) — chart of retention by interval bucket
5. **Time investment** (item 65) — minutes/day stacked bar (chunks vs grammar vs vocab vs feynman)
6. **Mastery radar** (item 66) — skill radar (vocab, grammar, listening, speaking, etc.)
7. **Feynman analytics** — improving/declining/struggling chunks (current)
8. **Leaderboard position** (quando item 85 ship) — anonymized rank

### Drill-down
- Click categoria → page detail com chunks da category, progress per-chunk
- Click "Lapsed" segment do donut → list of lapsed chunks com last_review + ease
- Click data no heatmap → list de actividade naquele dia

### Per-language scope
- Multi-language users (item 37): tab/dropdown switch entre languages no dashboard

## Arquivos

- Refactor: `src/app/progress/page.tsx` → server component + child Client components
- `src/components/dashboard/HeroStats.tsx`
- `src/components/dashboard/TimeRangeFilter.tsx`
- `src/components/dashboard/MasteryDonut.tsx`
- `src/components/dashboard/CategoryProgressGrid.tsx`
- `src/app/api/progress/stats/route.ts` — refactor: aceitar `window` param (today/week/month/year)
- `src/lib/db/sqlite.ts` — `getProgressStatsForWindow(userId, window)` agregado eficiente

## Validação

- [ ] Time range switch atualiza todas as métricas
- [ ] Comparison delta calculado corretamente
- [ ] Mobile: layout colapsa em single column
- [ ] Charts acessíveis (data table fallback)
- [ ] Performance: render initial < 500ms (server-rendered initial + client hydration)
- [ ] Loading skeleton match final grid

## Decisões pendentes

- Lib charts: Recharts (popular, ~80kb), Visx (lightweight), nivo (rich), Chart.js, ou DIY SVG?
- Cache stats: pre-aggregate per-day em background table vs query on-demand?
- Persist time range em URL (?range=week) ou localStorage?
- DailyGoal: migrar localStorage → DB (cross-device) ou manter local?
