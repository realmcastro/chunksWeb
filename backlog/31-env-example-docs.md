---
prioridade: 31
categoria: dx
esforco: 2h
risco: baixo
---

# `.env.example` + env docs

## Contexto

Repo não tem `.env.example` (verificar via `ls -la`). Novo dev cloning não sabe quais env vars são necessárias.

## Problema

- Onboarding fricciona
- Vars sensíveis (futuros: SENTRY_DSN, RESEND_API_KEY, VAPID_*, ADMIN_BOOTSTRAP) não documentadas
- Sem schema validation no boot → app crasha em runtime com erros opacos

## Proposta

### `.env.example`
```env
# Database (default: chunks_v1.db at repo root)
# DATABASE_PATH=./chunks_v1.db

# Sentry (optional)
# SENTRY_DSN=
# SENTRY_AUTH_TOKEN=

# Web Push (when implemented)
# VAPID_PUBLIC_KEY=
# VAPID_PRIVATE_KEY=
# NEXT_PUBLIC_VAPID_PUBLIC_KEY=

# Email (when implemented)
# RESEND_API_KEY=
# EMAIL_FROM=

# Admin bootstrap (when role system added)
# BOOTSTRAP_ADMIN_USERNAME=
```

### Env schema validation
`src/lib/env.ts`:
```ts
import { z } from 'zod';
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']),
  DATABASE_PATH: z.string().default('./chunks_v1.db'),
  SENTRY_DSN: z.string().url().optional(),
  // ...
});
export const env = envSchema.parse(process.env);
```

Import em entry points — falha early se config inválida.

### Docs
- `CLAUDE.md` adicionar seção "Environment variables"
- `README.md` section "Setup"

## Arquivos

- `.env.example` (NEW)
- `src/lib/env.ts` (NEW)
- `CLAUDE.md` — section
- `README.md` — setup steps

## Validação

- [ ] Boot sem `.env`: usa defaults, app sobe
- [ ] Boot com var inválida (URL malformed): erro claro com path do schema
- [ ] `.env.example` está em `.gitignore`? NÃO — deve ser commitado
- [ ] `.env.local` está em `.gitignore`? Sim

## Decisões pendentes

- Validation strict mode (fail closed) ou warn mode (log + use default)?
- Server-only vs client-public separation (`NEXT_PUBLIC_*`)?
