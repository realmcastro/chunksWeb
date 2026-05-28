---
prioridade: 35
categoria: security
esforco: 4-8h
risco: medio
---

# CSRF protection (token-based)

## Contexto

Cookie `sameSite: 'lax'` em `session.ts`. Middleware checa `Sec-Fetch-Site` (frágil — browsers podem mudar, legacy clients não enviam).

## Problema

- Lax permite GET top-level cross-site (vulnerability via redirect)
- Sec-Fetch-Site: bypassed por navegadores antigos / curl / extensions
- Mutating routes (POST /api/auth/login, /api/review/submit, etc.) sem token signed

## Proposta

### Strategy: Double-submit cookie
- On GET /any page: server set `csrf_token` cookie (random 32 bytes, NOT httpOnly — JS reads)
- Client em fetch: lê cookie → envia em header `x-csrf-token`
- Server middleware: compara cookie vs header em todos mutating methods (POST/PUT/PATCH/DELETE)
- Mismatch ou missing → 403

### Alternative: SameSite=strict + Origin check
- Mudar `sameSite: 'strict'` (quebra: deep-link de email cai out)
- Compatibility: aceitar trade-off ou usar dual cookie (strict + lax)

### Implementação minimalista
- `src/middleware.ts`: emit csrf cookie em response GET
- `src/lib/fetch.ts`: client wrapper that auto-injects header
- API route check: helper `verifyCsrf(request)` → 403 se inválido

### Exempções
- `/api/internal/web-vitals` etc. com auth secret separado
- Webhooks externos (Stripe, etc. quando aplicável) — exempt via path allowlist

## Arquivos

- `src/middleware.ts` — emit + verify
- `src/lib/security/csrf.ts` (NEW)
- `src/lib/api/client.ts` (NEW) — fetch wrapper
- Client fetch sites — migrar de `fetch()` puro para `apiFetch()`

## Validação

- [ ] Direct POST sem token: 403
- [ ] POST com token mismatch: 403
- [ ] POST com token correto: success
- [ ] PWA install retains token cookie
- [ ] Cookie regenera a cada session login

## Decisões pendentes

- Double-submit vs synchronizer token pattern?
- TTL do CSRF token (session-long vs rotate per-request)?
- API consumers externos (mobile app futuro)? Token alternativo (JWT bearer) bypass CSRF.
