---
prioridade: 16
categoria: security
esforco: 4-8h
risco: alto
status: parcial
---

# Dependency audit + upgrade (Next.js, babel, glob CVEs)

## Contexto

`npm audit` reporta múltiplas CVEs high/critical em deps de produção:
- `next@14.2.0`: DoS, cache poisoning, XSS em CSP nonces, Image Optimizer abuse
- `@babel/plugin-transform-modules-systemjs`: code injection
- `fast-uri`, `glob`: path traversal

Sem `npm audit` rodando em CI.

## Problema

- Vulnerabilidades conhecidas em produção
- Sem alerting automático para novas CVEs
- Bump major Next requer regression testing

## Proposta

### Fase 1: audit
- `npm audit --json > audit-report.json`
- Triagem: critical/high primeiro, ignorar dev-only low

### Fase 2: bump seguro
- `npm audit fix` (non-breaking)
- Para breaking: bump Next 14.2.x → última 14.x patch primeiro
- Considerar 15.x quando ecosystem estável (next-pwa compat?)

### Fase 3: CI gate
- Workflow `.github/workflows/ci.yml` add step:
  ```yaml
  - name: Security audit
    run: npm audit --audit-level=high
  ```
- Falha PR se nova CVE high+ detectada
- Dependabot config para auto-PR em deps

### Fase 4: monitoring
- GitHub security alerts ON
- Renovate bot ou Dependabot weekly schedule

## Arquivos

- `package.json` + `package-lock.json` (versões)
- `.github/workflows/ci.yml`
- `.github/dependabot.yml` (novo)

## Progresso (2026-05-31)

### Feito
- `npm audit fix` aplicado (13 → 10 CVEs)
- `next` bumped `14.2.0` → `14.2.35` (latest 14.x patch)
- `eslint-config-next` bumped → `14.2.35`
- Overrides adicionados: `glob@^10.5.0`, `serialize-javascript@^7.0.5` (13 → 2 CVEs)
- `.github/workflows/ci.yml` — security audit step adicionado (`--audit-level=critical`)
- `.github/dependabot.yml` criado (weekly, Monday, npm)

### CVEs restantes (aceitos como risco documentado)
- `next@14.x` — 14 high CVEs (DoS, cache poisoning, XSS via CSP nonces). Fix requer `next@16.2.6` (major breaking). **Pendente: Next 15/16 migration.**
- `postcss` (inside next) — moderate XSS. Resolvido quando next bumped.

### Pendente
- Migração `next@14` → `next@15` (breaking: async params/cookies, turbopack default) — novo task separado
- Migrar `next-pwa@5.6.0` → `@serwist/next` (mais mantido, Next 15 compat)
- Após migração: upgrade CI gate `--audit-level=critical` → `--audit-level=high`
- GitHub Security Alerts: ativar em Settings > Security > Code security

## Validação

- [x] `npm audit --audit-level=critical` → 0 issues
- [ ] `npm audit --audit-level=high` → 0 issues (bloqueado por next@14.x)
- [x] `npm run lint` passa após bumps
- [ ] `npm run build` passa (não executado — requer env vars)
- [ ] PWA continua funcionando (next-pwa compat com Next bumped)

## Decisões pendentes

- **Bump Next 14 → 15 ou 16?** Next 15 tem breaking (async APIs). Next 16 tem mais mudanças. Recomendar 15 com codemods. Criar backlog separado.
- next-pwa abandonado. Migrar para `@serwist/next` junto com upgrade Next 15.
