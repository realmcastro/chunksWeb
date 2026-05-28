---
prioridade: 30
categoria: observability
esforco: 1-2 dias
risco: medio
dependencias: []
---

# Sentry integration (ADR-008 implementação)

## Contexto

ADR-008 propõe Sentry. `src/lib/logger.ts` apenas escreve JSON em stdout/stderr. ErrorBoundary existe mas não envia evento a sink.

## Problema

- Erros em prod requerem shell access para diagnosticar
- Sem stack trace agregado, sem alerting, sem release tracking
- ErrorBoundary swallow para tela amigável mas perde sinal

## Proposta

1. `npm install @sentry/nextjs`
2. `npx @sentry/wizard@latest -i nextjs` (gera config files)
3. Wire em `logger.error()` → `Sentry.captureException` quando `process.env.NODE_ENV === 'production'`
4. Wire em `ErrorBoundary.componentDidCatch` → `Sentry.captureException(error, { extra: errorInfo })`
5. PII scrubbing: configurar `beforeSend` para remover `email`, `username` se sensível, `password`, `passwordHash`
6. Source maps upload no build

## Arquivos

- `package.json` (deps)
- `sentry.client.config.ts` (novo)
- `sentry.server.config.ts` (novo)
- `sentry.edge.config.ts` (novo)
- `next.config.js` (withSentryConfig wrap)
- `src/lib/logger.ts` (capture)
- `src/components/ErrorBoundary.tsx` (capture)
- `.env.example` (SENTRY_DSN, SENTRY_AUTH_TOKEN)

## Validação

- [ ] Erro sintético dispara evento no dashboard Sentry
- [ ] PII não aparece em payload (verificar evento manualmente)
- [ ] Source maps resolvem stack trace em prod
- [ ] Dev mode: não envia eventos (DSN vazio ou flag)

## Decisões pendentes

- **Sentry hosted vs self-host (Glitchtip)?** Hosted free tier 5K events/mês. Self-host: Docker + Postgres.
- Sampling rate em prod? Default 1.0 (caro). Recomendar 0.1–0.3 quando volume crescer.
- Performance monitoring (traces)? Off inicialmente, ativar quando necessário.
