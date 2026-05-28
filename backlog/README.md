# Backlog ChunksWeb

Lista de melhorias identificadas em auditorias (2026-05-27).
Cada item = arquivo próprio. Não implementar sem aprovação.

## Convenção

- `NN-slug.md` — NN = prioridade (10–95, menor = maior prioridade)
- Header: prioridade, categoria, esforço, risco, dependências
- Cada item declara: contexto, problema, proposta, arquivos, validação, decisões pendentes

## Categorias

- `security` — vulnerabilidades, hardening
- `compliance` — GDPR/LGPD/CCPA
- `auth` — autenticação, sessão
- `testing` — cobertura, e2e
- `observability` — logs, telemetria, monitoring
- `performance` — render, query, bundle
- `feature` — funcionalidade nova
- `module` — módulo novo (subdir em `src/lib` ou `src/features`)
- `refactor` — débito técnico, dedup
- `a11y` — acessibilidade
- `ux` — experiência
- `dx` — developer experience
- `data` — schema, migration, backup
- `pwa` — service worker, offline
- `algorithm` — SM-2 / FSRS
- `seo` — metadata, sitemap
- `operations` — backup, deploy

## Índice

| # | Item | Categoria | Status |
|---|------|-----------|--------|
| 10 | Session Zod validation | security | **feito (commit `15be64e`)** |
| 11 | Dedup `getUserIdFromCookie` (11 routes) | refactor | **feito (commit `15be64e`)** |
| 12 | HTTP security headers (CSP/HSTS) | security | pendente |
| 13 | Password reset flow | auth | pendente (decisão email) |
| 14 | Account deletion + GDPR export | compliance | pendente |
| 15 | Simplify captcha (remove 1, harden 1) | ux,security | pendente (decisão qual) |
| 16 | Deps audit + upgrade (Next CVEs) | security | pendente |
| 17 | FTS5 full-text search | performance | pendente |
| 18 | Soft-delete + content versioning | refactor | pendente |
| 19 | Migration runner | dx,data | pendente |
| 20 | API route tests | testing | pendente |
| 21 | Offline sync queue completion | pwa | pendente |
| 22 | Web Push notifications | pwa,feature | pendente |
| 23 | Request ID correlation | observability | pendente |
| 24 | Web Vitals tracking | observability | pendente |
| 25 | FSRS migration | algorithm | pendente (decisão default) |
| 26 | Keyboard shortcuts study | ux,a11y | pendente |
| 27 | Empty states + onboarding hints | ux | pendente |
| 28 | Cloze deletion mode | feature | pendente |
| 29 | Dictation mode | feature | pendente |
| 30 | Sentry integration | observability | pendente |
| 31 | `.env.example` + env schema | dx | pendente |
| 32 | Pre-commit strengthen | dx | pendente |
| 33 | SEO metadata + sitemap + OG | seo | pendente |
| 34 | Bundle analyzer | performance,dx | pendente |
| 35 | CSRF token protection | security | pendente |
| 36 | Cookie consent + legal pages | compliance | pendente |
| 37 | Multi-target language | feature | pendente |
| 38 | Tags + notes + collections | feature | pendente |
| 39 | Anki .apkg import/export | feature | pendente |
| 40 | Suspense streaming study routes | performance | pendente |
| 41 | Markdown em chunks | feature,ux | pendente |
| 42 | Accent/voice selection | feature | pendente |
| 43 | DB query profiler + EXPLAIN | performance,dx | pendente |
| 44 | Health check endpoint | observability | pendente |
| 45 | DB backup strategy | data,operations | pendente |
| 46 | Feature flags system | dx | pendente |
| 47 | 2FA (TOTP) | security,auth | pendente |
| 48 | OAuth (Google, GitHub) | auth | pendente |
| 49 | Storybook + visual regression | dx,testing | pendente |
| 50 | Rate-limit SQLite persistence | security | pendente (decisão A/B) |
| 51 | Onboarding flow | ux,feature | pendente |
| 52 | Brute-force lockout | security | pendente |
| 53 | Layout system unification (TopNav/Sidebar + route groups) | refactor,ux,a11y | pendente (decisão shell) |
| 54 | Page shell templates + Section primitives | refactor,ux | pendente |
| 60 | Streak UI + freeze | feature | pendente (decisão regras) |
| 61 | Progress dashboard overhaul (rich panel) | feature,ux | pendente |
| 62 | Stats event schema (event sourcing) | data,observability | pendente |
| 63 | Activity heatmap (GitHub-style) | feature,ux | pendente |
| 64 | Forgetting curve + retention viz | feature,algorithm | pendente |
| 65 | Time investment tracker | feature,ux | pendente |
| 66 | Mastery radar (skill breakdown) | feature,ux | pendente |
| 67 | Personal records + achievements | feature,ux | pendente |
| 68 | Comparative cohort insights | feature,observability | pendente |
| 69 | Public shareable profile (opt-in) | feature,ux | pendente |
| 70 | Audio recording module | module | pendente |
| 75 | Admin/instructor dashboard | feature | bloqueado (decisão role) |
| 80 | AI tutoring chat (Claude) | feature | pendente |
| 81 | Content generator (batch) | feature | pendente |
| 85 | Leaderboard opt-in | feature | pendente |
| 90 | Image optimization (next.config) | performance | pendente |
| 91 | i18n dynamic locale import | performance | pendente |
| 92 | a11y audit + axe CI | a11y | pendente |
| 95 | Memoization profile | performance | pendente |
