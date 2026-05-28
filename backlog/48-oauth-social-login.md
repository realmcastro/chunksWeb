---
prioridade: 48
categoria: auth,feature
esforco: 2-3 dias
risco: medio
dependencias: [13-password-reset-flow]
---

# OAuth / social login (Google, GitHub)

## Contexto

Apenas username + password. Sem SSO.

## Problema

- Onboarding friction: senha new + email
- Trust: users prefere "Sign in with Google" para apps casuais
- Migration de senha (esqueceu) inevitável sem alternative

## Proposta

### Providers
- Google (cobre maioria)
- GitHub (dev-adjacent users)
- Apple (mobile PWA install iOS)

### Flow (OAuth 2.0 + PKCE)
- `GET /api/auth/oauth/[provider]/start` — redirect to provider
- `GET /api/auth/oauth/[provider]/callback` — exchange code → user info → upsert user
- Email mismatch: link account ou criar novo?

### Account linking
```sql
CREATE TABLE user_oauth_accounts (
  id INTEGER PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  provider TEXT,
  provider_user_id TEXT,
  access_token_encrypted TEXT,
  refresh_token_encrypted TEXT,
  expires_at INTEGER,
  UNIQUE(provider, provider_user_id)
);
```

### Lib
- DIY (manual flow, hard to get right)
- `next-auth` (mainstream, mas re-arquiteta auth)
- `lucia-auth` (lightweight, mais alinhado com cookie session atual)

### Refresh
- Background job refresh OAuth tokens before expiry
- Fallback: re-prompt OAuth se refresh fails

## Arquivos

- `src/lib/oauth/` (per-provider modules)
- `src/app/api/auth/oauth/[provider]/start/route.ts`
- `src/app/api/auth/oauth/[provider]/callback/route.ts`
- Migration: user_oauth_accounts
- `src/app/login/page.tsx` — add OAuth buttons
- `src/app/settings/security/page.tsx` — connected accounts management
- ENV: GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, etc.

## Validação

- [ ] Sign in with Google: cria user + session
- [ ] Re-sign in: same user (no duplicate)
- [ ] Link multiple providers ao same user (email match)
- [ ] Disconnect provider funciona
- [ ] Token refresh transparent

## Decisões pendentes

- DIY vs lib (next-auth, lucia)? **lucia** parece melhor fit (cookie-session compatible).
- Email mandatory match para linking?
- Disable password login se OAuth linked? Opção user-controlled.
