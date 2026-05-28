---
prioridade: 13
categoria: auth
esforco: 1-2 dias
risco: medio
status: concluido
---

# Password reset flow

## Contexto

`users` table não tem coluna `email`. `change-password` existe (requer senha atual). **Sem recovery se user esquece senha.**

## Problema

- User esquece senha = conta inacessível, sem self-service recovery
- Suporte manual impossível em escala
- Schema atual não suporta email-based reset

## Proposta

### Fase 1: schema
Migration: `ALTER TABLE users ADD COLUMN email TEXT UNIQUE;`
- Opcional (NOT NULL falhará para users existentes)
- Adicionar à RegisterSchema (opt-in initially, mandatory após N tempo)

### Fase 2: tokens
Tabela:
```sql
CREATE TABLE password_reset_tokens (
  id INTEGER PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  expires_at INTEGER NOT NULL,
  used_at INTEGER,
  created_at INTEGER NOT NULL
);
CREATE INDEX idx_prt_user ON password_reset_tokens(user_id);
```

Token: gerado `crypto.randomBytes(32).toString('base64url')`, armazenado HASH (SHA-256), enviado plaintext via email. TTL 30min, single-use.

### Fase 3: routes
- `POST /api/auth/request-reset { email }` — sempre 200 (não revela existência); se email existe, gera token + envia email
- `GET /api/auth/reset-password/[token]` — valida token (não consome), renderiza form
- `POST /api/auth/reset-password { token, newPassword }` — consome token, atualiza password, invalida todas sessions do user

### Fase 4: email
- Stub provider: SendGrid, Resend, ou SMTP
- Template: link `https://app/reset-password/[token]`
- Rate limit: 1 email/hora per email address

### Fase 5: UI
- `/forgot-password` page — input email
- `/reset-password/[token]` page — new password + confirm

## Arquivos

- Migration SQL
- `src/lib/db/sqlite.ts` — add `users.email`, password_reset_tokens table + queries
- `src/lib/auth/reset-tokens.ts` — generate, hash, validate
- `src/lib/email/` — provider abstraction + reset template
- `src/app/api/auth/request-reset/route.ts`
- `src/app/api/auth/reset-password/route.ts`
- `src/app/forgot-password/page.tsx`
- `src/app/reset-password/[token]/page.tsx`
- `src/lib/validation/schemas.ts` — passwordResetRequestSchema, passwordResetConfirmSchema

## Validação

- [ ] Request reset com email inexistente: 200 (não enumera)
- [ ] Token expirado rejeitado
- [ ] Token usado segunda vez rejeitado
- [ ] Reset bem-sucedido invalida sessions existentes
- [ ] Rate limit por email funciona

## Decisões pendentes

- **Email mandatório no register**? Atual schema permite username-only.
- Provider: Resend (boa free tier), SendGrid, AWS SES, SMTP self-host?
- Email verification antes de poder usar conta? Separado de reset.
