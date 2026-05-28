---
prioridade: 16
categoria: security
esforco: 4-8h
risco: alto
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

## Validação

- [ ] `npm audit --audit-level=high` → 0 issues
- [ ] `npm run build` passa após bumps
- [ ] `npm test` passa
- [ ] PWA continua funcionando (next-pwa compat com Next bumped)
- [ ] Manual smoke: login, study, review, browse

## Decisões pendentes

- **Bump Next major (15.x)**? Quebra: app router APIs, server components rules.
- next-pwa abandonado? Considerar `@serwist/next` (mantido).
- Dependabot vs Renovate? Dependabot built-in GitHub free.
