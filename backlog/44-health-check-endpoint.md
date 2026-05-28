---
prioridade: 44
categoria: observability
esforco: 1h
risco: baixo
---

# Health check endpoint

## Contexto

Sem `/api/health`. Deployment systems (Docker, k8s, load balancers) precisam liveness/readiness check.

## Problema

- Container restart depende de timeout, não health signal
- Sem proxy/CDN integration para auto-failover
- Sem dashboard "is the app up" externo

## Proposta

### `/api/health`
```ts
export async function GET() {
  const checks = {
    db: false,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: process.env.npm_package_version,
  };

  try {
    db.prepare('SELECT 1').get();
    checks.db = true;
  } catch {}

  const healthy = checks.db;
  return NextResponse.json(checks, { status: healthy ? 200 : 503 });
}
```

### `/api/health/ready`
- Stricter: check critical paths (DB, migrations applied, cache warm)
- Used by k8s readiness probe (don't route traffic until ready)

### `/api/health/live`
- Minimal: just `{status: 'ok'}` — used by liveness probe (restart container if fails)

### Não auth
- Endpoints públicos (sem session check)
- Rate-limited (prevent DoS via repeated calls)

## Arquivos

- `src/app/api/health/route.ts`
- `src/app/api/health/ready/route.ts`
- `src/app/api/health/live/route.ts`

## Validação

- [ ] `curl /api/health` → 200 com checks
- [ ] DB inacessível → 503
- [ ] Endpoint não-autenticado
- [ ] Rate limit: 60/min anônimo

## Decisões pendentes

- Versão de build em response (git SHA)? Set via env at build.
- Includes external deps (Sentry connectivity, etc.) ou só DB?
