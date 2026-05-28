# Backlog ChunksWeb

Lista de melhorias identificadas em auditoria (2026-05-27).
Cada item = arquivo próprio. Não implementar sem aprovação.

## Convenção

- `NN-slug.md` — NN = prioridade (10–90, menor = maior prioridade)
- Header: prioridade, categoria, esforço, risco, dependências
- Cada item declara: contexto, problema, proposta, arquivos, validação, decisões pendentes

## Categorias

- `security` — vulnerabilidades, hardening
- `testing` — cobertura, e2e
- `observability` — logs, telemetria, monitoring
- `performance` — render, query, bundle
- `feature` — funcionalidade nova
- `module` — módulo novo (subdir em `src/lib` ou `src/features`)
- `refactor` — débito técnico, dedup
- `a11y` — acessibilidade
- `ux` — experiência

## Status atual (2026-05-27)

| # | Item | Status |
|---|------|--------|
| 10 | Session Zod validation | **em árvore (não commitado)** |
| 11 | Dedup `getUserIdFromCookie` (11 routes) | **em árvore (não commitado)** |
| 20 | API route tests (login, review/submit) | pendente |
| 30 | Sentry integration (ADR-008) | pendente |
| 40 | Suspense streaming study routes | pendente |
| 50 | Rate-limit SQLite persistence | pendente (decisão: single-instance?) |
| 60 | Streak UI + freeze mechanic | pendente |
| 70 | Audio recording module | pendente |
| 75 | Admin/instructor dashboard | bloqueado (decisão de role schema) |
| 80 | AI tutoring chat (Claude API) | pendente |
| 81 | Content generator (batch chunks via Claude API) | pendente |
| 85 | Leaderboard opt-in | pendente |
| 90 | Image optimization (next.config) | pendente |
| 91 | i18n dynamic locale import | pendente |
| 92 | a11y audit + axe-core CI gate | pendente |
| 95 | Memoization profile + targeted memo | pendente |
