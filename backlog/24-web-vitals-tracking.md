---
prioridade: 24
categoria: observability,performance
esforco: 4h
risco: baixo
---

# Web Vitals tracking (LCP, INP, CLS)

## Contexto

Sem ingestão de Core Web Vitals do client. Otimizações de performance (Suspense, image opt) sem medição → não sabe se melhorou.

## Problema

- LCP/INP/CLS reais desconhecidos
- Regressões de perf não detectadas
- Sem cohort analysis (mobile vs desktop, slow 3G vs fiber)

## Proposta

### Captura
Next.js já suporta:
```ts
// src/app/layout.tsx ou _app
import { useReportWebVitals } from 'next/web-vitals';

useReportWebVitals((metric) => {
  fetch('/api/internal/web-vitals', {
    method: 'POST',
    body: JSON.stringify(metric),
    keepalive: true,
  });
});
```

### Ingestão
`POST /api/internal/web-vitals`:
- Schema: `{ id, name (LCP|FID|CLS|INP|FCP|TTFB), value, rating (good|needs-improvement|poor), navigationType }`
- Persistir em `web_vitals` table com sample rate (1% default)
- Tags: route, user_agent abbreviated, viewport

### Dashboard
- `/admin/performance` (gate admin) — p75/p90/p99 por route, trend 7d/30d
- Filter por: route, device, connection

### Alternativas
- Sentry Performance (mais robusto, mas pago acima free)
- Vercel Analytics (se hospedado Vercel)
- Self-host atual proposta

## Arquivos

- `src/app/layout.tsx` (ou root client component) — `useReportWebVitals`
- `src/app/api/internal/web-vitals/route.ts`
- `src/lib/db/sqlite.ts` — `web_vitals` table + insert
- `src/app/admin/performance/page.tsx` — admin only
- Migration

## Validação

- [ ] LCP medido na home page < 2.5s p75
- [ ] INP < 200ms p75
- [ ] CLS < 0.1 p75
- [ ] Sampling 1% funciona (controle de volume)
- [ ] Dashboard mostra trend

## Decisões pendentes

- Self-host vs Sentry vs Vercel?
- Sample rate: 1%, 10%, 100%?
- Retention: 30d? Aggregate older?
