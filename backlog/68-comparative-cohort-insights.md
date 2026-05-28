---
prioridade: 68
categoria: feature,observability,ux
esforco: 2-3 dias
risco: medio
dependencias: [62-stats-event-schema]
---

# Comparative cohort insights ("How you compare")

## Contexto

User vê próprias métricas isoladas. Sem context "isto é bom?". Privacy-first abordagem (sem expor identidade) permite anonymous benchmarks.

## Problema

- User não tem benchmark: "30 reviews/dia é muito ou pouco?"
- Sem motivação saudável "top 20% nesta semana"
- Insights faltam: "users que atingem X chunks usually study Y min/day"

## Proposta

### Anonymous percentile rank
- Per metric, compute distribution across all opted-in users
- Show user position: "Your daily reviews: 30 (top 25%)"
- Update weekly (avoid real-time leak via timing)

### Cohort matching
- Users agrupados por: signup date bucket, level (CEFR), languages studied
- Compare apenas dentro do cohort relevante
- Filtro: "All users" vs "Users like me"

### Aggregated stats table
```sql
CREATE TABLE cohort_aggregates (
  id INTEGER PRIMARY KEY,
  cohort_key TEXT NOT NULL,         -- e.g. 'all', 'level:b1', 'lang:fr'
  metric TEXT NOT NULL,             -- 'daily_reviews', 'streak_length', 'mastered_count'
  window TEXT NOT NULL,             -- 'all_time', 'week', 'month'
  p10 REAL, p25 REAL, p50 REAL, p75 REAL, p90 REAL, p99 REAL,
  sample_size INTEGER,
  computed_at INTEGER NOT NULL,
  UNIQUE(cohort_key, metric, window)
);
```

### Computation
- Nightly batch job: compute percentiles per cohort
- Threshold: min sample size (e.g., 50) para mostrar cohort (proteger small cohort privacy)
- Differential privacy noise: opcional adicionar Laplace noise para anti-fingerprinting

### Insights cards
- "**Top 10%** of users in your cohort have a 21-day streak. Yours: 14 days."
- "**Median user** masters 5 chunks/week. You: 8 ✨"
- "Users who study **3+ days/week** typically reach B2 in 8 months."

### Opt-in
- Setting "Anonymous benchmarks" — default ON com clear disclosure
- Opt-out remove user da agregação (recompute affected cohorts)

### Per-cohort insights
- "Users at your level: spend 18 min/day average"
- "Users learning FR + ES (your combo): 12% finish vs 35% single-language" — motiva commit

## Arquivos

- Migration: `cohort_aggregates`
- `src/lib/insights/cohorts.ts` — assign user to cohort
- `src/lib/insights/aggregator.ts` — nightly batch
- `scripts/compute-cohorts.ts` — cron
- `src/components/dashboard/CohortInsights.tsx`
- `src/app/api/progress/insights/route.ts`

## Validação

- [ ] Percentile computed correctly (test com synthetic data)
- [ ] Min sample size enforced (small cohorts hidden)
- [ ] Opt-out exclui user de aggregations
- [ ] Privacy: impossible to deanonymize user from cohort stats
- [ ] Insights texto i18n traduzível
- [ ] Performance: insights page load < 200ms (pre-computed)

## Decisões pendentes

- Differential privacy noise: vale complexidade?
- Min sample size: 50 conservative, 100 mais seguro?
- Cohort granularity: language × level × signup_month muitos cohorts pequenos. Reduzir.
- Show negative comparisons ("you're in bottom 25%") ou apenas positivas? Recomenda apenas positivas + neutras.
