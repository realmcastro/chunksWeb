# ADR-008 — Error telemetry strategy

Status: Proposed

## Context

Today `src/lib/logger.ts` writes structured JSON to stdout/stderr. There is no aggregation, alerting, or correlation across server + client. Production incidents require shell access to the host.

## Options

### A. Self-hosted aggregator (Grafana Loki + Promtail)
- Promtail tails the Node process stdout, ships to Loki.
- Pros: zero vendor lock-in, cheap on small scale, integrates with Grafana dashboards we may already need for `web-vitals`.
- Cons: ops burden, no out-of-the-box source maps for client errors.

### B. Sentry (Cloud)
- `@sentry/nextjs` integrates server + client + edge + replays.
- Pros: source maps, breadcrumbs, release tracking, alerting. Free tier covers a small PWA.
- Cons: cost at scale, SaaS dependency, must scrub PII before sending.

### C. Datadog / New Relic
- Out of scope for this app's scale.

## Decision

Proposed: Sentry, **gated behind `SENTRY_DSN` env var**.

When `SENTRY_DSN` is unset, the logger continues to write only to stdout/stderr (current behaviour). When set, the same `logger.error()` call additionally captures the entry in Sentry.

## Integration sketch (NOT yet implemented)

1. `npm install @sentry/nextjs`
2. `npx @sentry/wizard@latest -i nextjs` generates `sentry.{client,server,edge}.config.ts`.
3. `src/lib/logger.ts` checks for the global Sentry instance and forwards `error` level.
4. `ErrorBoundary.componentDidCatch` adds breadcrumb + capture.
5. CI sets `SENTRY_AUTH_TOKEN` for source-map upload during `next build`.

## PII scrubbing rules (mandatory before enabling)

- Never send `email`, `username`, `password*`, `session*` to Sentry.
- Sanitize URLs (drop query strings) before reporting.
- Server logger fields `userId` may be sent as user.id for grouping.

## Followups

- Decide retention (default 90d) vs custom.
- Sourcemap upload requires `NEXT_PUBLIC_VERSION` env (build-time git SHA).
- Add `/api/log` endpoint for client → server bridge if Sentry is rejected.
