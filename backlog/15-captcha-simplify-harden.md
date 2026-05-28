---
prioridade: 15
categoria: ux,security
esforco: 4-6h
risco: baixo
status: bloqueado-decisao
---

# Simplificar para 1 captcha + hardenar

## Contexto

`src/app/login/page.tsx` e `src/app/register/page.tsx` apresentam DUAS etapas de captcha em sequência antes do formulário:

```
step: 'math' → 'slider' → 'form'
```

Components:
- `src/components/auth/MathCaptcha.tsx` — soma/sub/× de números 1–20
- `src/components/auth/SliderCaptcha.tsx` — drag-to-end ≥90%

## Problema

### UX
- Duas etapas obrigatórias antes do form = friction excessiva, fricciona usuário real, pouco ROI vs bots.
- Slider falha no keyboard-only (a11y).
- Math: 20×20 = 400 combinações — força trivial offline.

### Security
- Ambos são 100% client-side: bot pula direto para `fetch('/api/auth/login')` sem nunca disparar captcha. **Captcha atual não protege nada server-side.**
- `setStep('form')` é state local React — backend não recebe prova de resolução.
- Rate limiter em `RATE_LIMITS.authLogin` (5/min) é a única defesa real.

## Proposta

### Passo 1: remover um
**Recomendado manter: MathCaptcha** (motivos)
- Acessível (keyboard funciona, autoFocus + form submit)
- Server pode validar (envia problem + answer, backend recomputa)
- Slider não tem semântica server-verifiable sem motion analysis (caro)

Alternativa: manter Slider se UX visual importa mais que a11y.

### Passo 2: hardenar o sobrevivente (Math)

#### A. Mover validação para server (CRÍTICO)
- Backend gera challenge: `GET /api/auth/captcha/challenge` → `{ challengeId, expression: "7 + 3 = ?", expiresAt }`
  - Server armazena `challengeId → answer` em-memória (TTL 2min) ou JWT signed payload
- Client envia answer junto com login: `POST /api/auth/login { username, password, captchaId, captchaAnswer }`
- Server valida antes de tocar DB — falha = 400 sem chamar bcrypt (skip cost amplification)

#### B. Difficulty progressive
- Após N falhas (rate-limit hit), incrementar dificuldade:
  - Nível 1: `a + b` (1–10)
  - Nível 2: `a × b` (1–12)
  - Nível 3: `(a + b) × c` 2-operand
- Estado dificuldade per actor (userId/IP) em rate-limit module ou cache

#### C. Honeypot field
- Adicionar `<input name="email_address" tabIndex={-1} autoComplete="off" style={{display:'none'}} />`
- Bots preenchem (atraídos pelo name); humanos não veem
- Backend rejeita request se honeypot != ''

#### D. Behavioral signal (opcional, baixo custo)
- `submittedTooFast`: client mede `formMountedAt → submittedAt`; envia delta
- Server rejeita < 1500ms (bot velocidade humanamente impossível para form completo)

#### E. Single source of truth
- Extrair `useCaptchaFlow` hook compartilhado entre login.tsx e register.tsx (atualmente DRY violation — mesmo step machine duplicado).

## Arquivos

Mudanças:
- Remover: `src/components/auth/SliderCaptcha.tsx` (ou MathCaptcha se decidir manter Slider)
- `src/components/auth/MathCaptcha.tsx` — refactor: fetch challenge from server, send `{captchaId, answer}` para parent
- `src/app/login/page.tsx` — remover step machine de 3 estágios → 1 stage form com captcha embedded
- `src/app/register/page.tsx` — mesmo
- `src/app/api/auth/captcha/challenge/route.ts` — NEW
- `src/lib/auth/captcha-store.ts` — NEW (in-memory TTL store)
- `src/lib/validation/schemas.ts` — `loginSchema`/`registerSchema` add `captchaId`, `captchaAnswer`, `honeypot` opcional
- `src/app/api/auth/login/route.ts` — validar captcha + honeypot ANTES de getUserByUsername
- `src/app/api/auth/register/route.ts` — mesmo
- Translations: remover `captcha.oneMoreStep`, `captcha.backToMath` em 4 locales

## Validação

- [ ] Login funciona com captcha válido
- [ ] Login falha 400 com captcha errado (sem leak: mesma msg de "Invalid credentials")
- [ ] Login falha 400 com challengeId expirado
- [ ] Login falha 400 com honeypot preenchido
- [ ] Login falha 400 se submit < 1500ms after mount
- [ ] Direct curl no `/api/auth/login` sem captchaId = 400
- [ ] Keyboard-only flow completo (Tab → digitar resposta → Enter)
- [ ] Screen reader anuncia challenge
- [ ] Dificuldade progressiva: 6º request com mesmo IP recebe challenge mais difícil
- [ ] Translations atualizadas em en/pt/es/fr

## Decisões pendentes

- **Qual manter: Math ou Slider?** Recomendação acima = Math.
- **Captcha store**: in-memory Map (single-instance) ou JWT signed (stateless)?
  - JWT: zero state, key rotation possível, payload aumenta
  - In-memory: simples, perde em restart
- **Falha de captcha**: dar erro genérico ("verificação falhou") ou específico ("conta perdeu captcha")?
  - Genérico previne enumeration; específico melhor UX
- Aplicar mesma captcha em `change-password`, `request-reset` quando implementados?
