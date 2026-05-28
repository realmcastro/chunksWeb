---
prioridade: 52
categoria: security
esforco: 4h
risco: baixo
dependencias: [50-rate-limit-persistence]
---

# Brute-force lockout (além de rate limit)

## Contexto

Rate limit atual: 5 login attempts / 60s. Após esgotar, user espera 60s e tenta novamente.

## Problema

- 5/min = 7200/dia por IP — suficiente para senhas comuns ("password123", "qwerty")
- Sem account lockout após N falhas
- Sem alerting de tentativa brute-force suspeita

## Proposta

### Account lockout
- 5 falhas consecutivas em mesmo username:
  - Lock account 15 min
  - Email "Suspicious login attempt" (quando email implementado)
- 10 falhas em 1h: lock 24h, require password reset

### Tracking
```sql
CREATE TABLE login_attempts (
  id INTEGER PRIMARY KEY,
  username TEXT,           -- denormalized para users que não existem
  ip TEXT,
  success BOOLEAN,
  attempted_at INTEGER NOT NULL,
  user_agent TEXT
);
CREATE INDEX idx_login_attempts_user_time ON login_attempts(username, attempted_at);
```

### Lockout state
```sql
ALTER TABLE users ADD COLUMN locked_until INTEGER;
ALTER TABLE users ADD COLUMN failed_login_count INTEGER DEFAULT 0;
```

### Lockout flow
- Login route check `locked_until > now()` → 423 (Locked)
- Reset `failed_login_count = 0` em login successful

### IP-level (complemento)
- Múltiplos usernames tentados de mesmo IP em janela curta → IP block 1h
- Suspeitas em `suspicious_activity_log` table → admin alert

### Captcha escalation
- Falha 3+ em IP: força captcha mais difícil (item 15)

## Arquivos

- `src/lib/auth/lockout.ts`
- `src/app/api/auth/login/route.ts` — check + increment
- Migrations
- `src/app/api/admin/security-events/route.ts` (admin alert)

## Validação

- [ ] 5 falhas: account locked 15min
- [ ] Login durante lock: 423 com retry-after header
- [ ] Successful login reset counter
- [ ] Lock expira automaticamente
- [ ] Audit log preserva attempts (forensics)

## Decisões pendentes

- Notify owner via email on lockout (quando email impl)?
- Lockout per-username ou per-(username+ip)? **per-username** previne lockout via IP spoofing.
- Permitir unlock self-service (via email link) vs wait timeout?
