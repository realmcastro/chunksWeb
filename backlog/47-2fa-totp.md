---
prioridade: 47
categoria: security,auth
esforco: 1-2 dias
risco: medio
dependencias: [13-password-reset-flow]
---

# 2FA (TOTP)

## Contexto

Login: username + password (bcrypt). Sem 2FA opt-in.

## Problema

- Senha vazada (phishing, reuse) = acesso total
- Defense-in-depth fraca para user-data sensível (sessions, vocab privacy)

## Proposta

### TOTP (RFC 6238)
- Lib: `otplib` (mantida, bem testada)
- Setup flow:
  1. `POST /api/auth/2fa/init` — gera secret + QR code (otpauth://)
  2. User escaneia em Authy/Google Authenticator/1Password
  3. `POST /api/auth/2fa/verify` { code } — confirma secret persisted
  4. Save em `users.totp_secret_encrypted` (encryption key from env)

### Login flow
- Username + password OK → check `totp_secret_encrypted IS NOT NULL`
- Se yes: prompt para 6-digit code
- `POST /api/auth/login` aceita opcional `totpCode`
- Valid code → session cookie set

### Recovery codes
- Gerar 10 single-use codes durante setup
- Hash + store em `users.recovery_codes` (JSON array of hashes)
- Used to disable 2FA se device perdido

### Disable
- `POST /api/auth/2fa/disable` — requires current password + totp/recovery

### Storage encryption
- TOTP secret = sensitive, encrypt at rest
- Key from `process.env.TOTP_ENCRYPTION_KEY` (32 bytes base64)
- AES-256-GCM

## Arquivos

- `package.json` — `otplib`, `qrcode`
- `src/lib/auth/totp.ts`
- `src/lib/crypto/aes.ts` (encryption helper)
- `src/app/api/auth/2fa/init/route.ts`
- `src/app/api/auth/2fa/verify/route.ts`
- `src/app/api/auth/2fa/disable/route.ts`
- `src/app/settings/security/page.tsx`
- Migration: users.totp_secret_encrypted, users.recovery_codes

## Validação

- [ ] QR scan setup Authy
- [ ] Code valid: login success
- [ ] Code invalid: 401 (sem revelar se secret exists)
- [ ] Recovery code single-use
- [ ] Disable requer auth + totp
- [ ] Secret encrypted at rest (DB inspect ≠ readable)

## Decisões pendentes

- WebAuthn / passkeys em vez (ou além) de TOTP?
- 2FA mandatory para admins?
- Backup: cloud sync secret seed (e2e encrypted) ou só recovery codes?
