---
prioridade: 64
categoria: feature,algorithm,ux
esforco: 1-2 dias
risco: medio
dependencias: [62-stats-event-schema]
---

# Forgetting curve + retention visualization

## Contexto

SM-2 (e FSRS futuramente) modela retention probabilística. User não vê esse modelo, só intervals. Sem confidence em "este chunk está em risco".

## Problema

- User não entende quando review é crítico vs opcional
- Sem visão de "memory health" do deck
- Sem alert de chunks com retention prevista < 90%

## Proposta

### Per-chunk retention forecast
SM-2 não nativa retention probability. Aproximação:
- `R(t) = exp(-t / S)` onde `S = stability = ease_factor × interval × days_since_review_factor`
- Cada chunk tem timestamp `last_review`, `ease_factor`, `interval_days`
- Compute current retention: `R = exp(-(days_since_last_review / interval) × ln(1/desired_retention))`

Lib `ts-fsrs` fornece função `Card.retrievability()` se FSRS adotado (item 25).

### Aggregate retention curve
- Bucketize chunks por `days_since_last_review`
- Plot: x = days_since_last_review, y = avg quality em next review
- Empirical curve — derivada de eventos reais user_events (item 62)
- Compare: predicted vs actual → calibration

### Memory health dashboard widget
- **At risk** (retention < 80%): count + list
- **Strong** (retention > 95%): count
- **Just learned** (< 1d): count
- Total chunks em memória

### Per-chunk view
- Em chunk detail: small line chart "Retention over time"
- Markers em cada review com quality

## Arquivos

- `src/lib/spaced-repetition/retention.ts` — formulas
- `src/components/dashboard/MemoryHealth.tsx`
- `src/components/dashboard/RetentionCurve.tsx`
- `src/components/chunks/ChunkRetentionChart.tsx`
- `src/app/api/progress/retention/route.ts`

## Validação

- [ ] At-risk count atualiza em real-time conforme reviews progridem
- [ ] Empirical curve compara reasonable com teórica SM-2
- [ ] Performance: agregação para 10K chunks < 500ms
- [ ] Edge case: 0 reviews → curve vazia gracefully
- [ ] Tooltip explica "Retention" em layman terms

## Decisões pendentes

- Target retention setting: 90% (default SM-2) ou customizable per-user?
- Mostrar curve "scary" (declining) ou rotate framing positivo ("87% strong")?
- FSRS retrievability mais accurate — esperar FSRS ship antes deste?
