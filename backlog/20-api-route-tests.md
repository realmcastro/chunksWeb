---
prioridade: 20
categoria: testing
esforco: 2-3 dias
risco: baixo
---

# Cobertura de testes para API routes

## Contexto

Vitest instalado. Apenas 3 testes: `rate-limit`, `sm2`, `schemas`. Zero cobertura para route handlers — lógica auth + SM-2 integration + queries não testada.

## Problema

- Bugs de auth bypass não detectados em CI
- Refactor de SM-2 quebra silenciosamente sem teste integration
- Regressões em paginação, filtros, edge cases

## Proposta

Cobrir routes críticos em ordem:

1. `auth/login` — happy, invalid creds, rate-limit hit, malformed payload
2. `auth/register` — happy, duplicate username, weak password
3. `review/submit` — happy (SM-2 state persiste), unauth, invalid quality
4. `learn/start` — happy, categoria inexistente, unauth
5. `chunks/browse` — paginação, filtros, search injection safe
6. `progress/stats` — happy, sem dados

Setup necessário:
- Fixture DB: in-memory SQLite com schema atual + seed mínimo
- Helper: `mockSessionCookie(userId)` para simular cookie autenticado
- Helper: `callRoute(handler, request)` para invocar handlers de forma direta

## Arquivos

Criar:
- `src/app/api/__tests__/setup.ts` (DB fixture + mocks)
- `src/app/api/auth/login/route.test.ts`
- `src/app/api/auth/register/route.test.ts`
- `src/app/api/review/submit/route.test.ts`
- etc.

## Validação

- [ ] Cobertura >70% nos routes listados
- [ ] CI executa testes em PR
- [ ] Cada route tem happy + unauth + invalid input + edge case

## Decisões pendentes

- Mock DB ou real SQLite in-memory? **Recomendado: real (regra `.claude/rules/testing.md` proíbe mock de DB)**
- Vitest snapshot vs explicit assertion? Explicit.
