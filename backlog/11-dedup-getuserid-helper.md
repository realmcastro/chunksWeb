---
prioridade: 11
categoria: refactor
esforco: 1h
risco: baixo
status: concluido
dependencias: [10-session-zod-validation]
---

# Dedup `getUserIdFromCookie` nos routes

## Contexto

13 API routes definem cópia local de `async function getUserIdFromCookie(): Promise<number | null>` — JSON.parse + return `session.userId || null`. Bypassam helper canônico em `src/lib/auth/session.ts` e ignoram nova Zod validation.

## Problema

- DRY violation (13 cópias da mesma função)
- Cada cópia bypassa schema validation → tampered cookie pode passar
- 2 variantes (compacta e verbosa) — drift inevitável

## Proposta

1. Exportar `getUserIdFromCookie` de `session.ts` como alias de `getUserId`
2. Em cada route:
   - Adicionar `import { getUserIdFromCookie } from '@/lib/auth/session';`
   - Remover função local
   - Remover `import { cookies } from 'next/headers';` se não usado em outro lugar

## Arquivos (11 confirmados, prompt original dizia 13)

- src/app/api/user/i18n-language/route.ts
- src/app/api/user/learning-language/route.ts
- src/app/api/quick/due/route.ts
- src/app/api/review/due/route.ts
- src/app/api/feynman/history/route.ts
- src/app/api/voice-settings/route.ts
- src/app/api/session/activities/route.ts
- src/app/api/session/end/route.ts
- src/app/api/learn/start/route.ts
- src/app/api/feynman/submit/route.ts
- src/app/api/progress/stats/route.ts

## Validação

- [ ] `grep -r "async function getUserIdFromCookie" src/` → zero hits
- [ ] `npx tsc --noEmit` passa
- [ ] `npm run build` passa
- [ ] Manual: login + cada route retorna 401 sem cookie, 200 com cookie
