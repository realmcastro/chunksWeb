---
prioridade: 23
categoria: observability
esforco: 4h
risco: baixo
---

# Request ID propagation + structured log correlation

## Contexto

`src/lib/logger.ts` emite JSON com level/msg/ctx/ts. Sem request ID — múltiplas chamadas API simultâneas geram logs interleaved sem forma de correlacionar.

## Problema

- Debugging incident: impossível agrupar todos logs de um request
- Sem trace propagation se microservice adicionado futuramente
- Client error report (futuro Sentry) não cruza com server log

## Proposta

### Middleware
`src/middleware.ts`:
```ts
const requestId = request.headers.get('x-request-id') ?? crypto.randomUUID();
const response = NextResponse.next();
response.headers.set('x-request-id', requestId);
// AsyncLocalStorage para route handlers
requestContext.run({ requestId }, () => {/* next */});
```

### AsyncLocalStorage
`src/lib/logger-context.ts`:
```ts
import { AsyncLocalStorage } from 'node:async_hooks';
export const requestContext = new AsyncLocalStorage<{ requestId: string }>();
```

### Logger
`logger.ts` puxa `requestContext.getStore()?.requestId` automaticamente, injeta em todos `emit()`:
```ts
const ctx = { ...inputCtx, requestId: requestContext.getStore()?.requestId };
```

### Client
- Fetch wrapper adiciona `x-request-id` em retry (mesma ID = idempotency hint)
- Sentry breadcrumb consome esse ID

## Arquivos

- `src/middleware.ts`
- `src/lib/logger.ts`
- `src/lib/logger-context.ts` (NEW)

## Validação

- [ ] Log JSON inclui `requestId` consistente em todas linhas de mesmo request
- [ ] curl com header `x-request-id: foo` propaga
- [ ] Sem header: server gera UUID + retorna em response
- [ ] Edge runtime compat (AsyncLocalStorage não disponível em edge — fallback?)

## Decisões pendentes

- Header name: `x-request-id` (de facto) ou W3C `traceparent`?
- Edge middleware: usa request scope alt mechanism (header-only)?
- Sampling: gerar trace span apenas % requests para reduzir volume?
