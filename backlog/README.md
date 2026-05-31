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
- `delight` — easter eggs, mascot, sound, polish
- `interactive` — páginas dialógicas / dirigidas a interação
- `reactive` — UI que reage a sinais e movimentos do usuário (mouse, scroll, idle, fadiga, tempo)
- `library` — sistema de leitura / biblioteca de ebooks
- `journal` — diário, anotações diárias, agenda, metas
- `tracking` — rastreio de uso, sessões bruto/líquido, idle detection
- `learning-engine` — framework de estudo multi-tópico (além de línguas)
- `knowledge` — knowledge graph, activity feed, conexões entre entidades

## Índice

| # | Item | Categoria | Status |
|---|------|-----------|--------|
| **— FUNDAÇÃO PLATAFORMA —** | | | |
| 09 | Core Platform Epic: Personal Knowledge & Study OS | architecture | pendente — LEIA ANTES |
| 83 | Domain model refactor — pluggable study domains | refactor,architecture,data | pendente |
| 84 | Internal event bus — event-driven architecture | architecture,observability | pendente |
| 93 | Module permissions — RBAC leve por módulo | security,auth | pendente |
| 94 | Global search — search-first architecture | feature,architecture | pendente |
| 98 | Text command engine — DSL inline (@, #, [[)  | module,architecture | pendente |
| **— SEGURANÇA / AUTH —** | | | |
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
| 55 | Focus mode layout (distraction-free) | ux,layout | pendente |
| 56 | Split-pane layout (master-detail) | ux,layout | pendente |
| 57 | Command palette (Cmd+K) | ux,layout,feature | pendente |
| 58 | Bottom sheet pattern (mobile) | ux,layout,a11y | pendente |
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
| 71 | Daily check-in + reflection (interactive) | feature,interactive | pendente |
| 72 | Conversational practice page (AI dialogue) | feature,interactive | pendente |
| 73 | Story mode (interactive narrative) | feature,interactive | pendente |
| 74 | AI coach — daily plan recommender | feature,interactive | pendente |
| 76 | Chunks feed (TikTok-style discovery) | feature,interactive | pendente |
| 77 | Pronunciation duel arena | feature,interactive | pendente |
| 78 | Idle screensaver (DVD bounce) | feature,delight | pendente |
| 79 | Mascot/companion pet | feature,delight | pendente (decisão design) |
| 82 | Ambient sensory polish (SFX/haptics/seasonal) | feature,delight,a11y | pendente |
| 86 | Adaptive reactive UI (time/fatigue/battery/return) | feature,reactive,ux | pendente |
| 87 | Reactive micro-feedback (cursor/tilt/scroll/inertia) | feature,reactive,delight | pendente |
| 88 | Reactive presence (live anonymous social signals) | feature,reactive | pendente |
| 89 | Sensor-driven reactive input (gyro/shake/typing/gamepad) | feature,reactive | pendente |
| 70 | Audio recording module | module | pendente |
| 75 | Admin/instructor dashboard | feature | bloqueado (decisão role) |
| 80 | AI tutoring chat (Claude) | feature | pendente |
| 81 | Content generator (batch) | feature | pendente |
| 85 | Leaderboard opt-in | feature | pendente |
| 90 | Image optimization (next.config) | performance | pendente |
| 91 | i18n dynamic locale import | performance | pendente |
| 92 | a11y audit + axe CI | a11y | pendente |
| 95 | Memoization profile | performance | pendente |
| **— ÉPICO: LEITURA —** | | | |
| 100 | Reading module — schema + storage strategy | module,library,data | pendente |
| 101 | Book library UI — catálogo pessoal | feature,library,ux | pendente |
| 102 | In-browser reader (PDF/EPUB/Mobi) | feature,library,ux | pendente |
| 103 | Reading position persistence — cross-device sync | feature,library,pwa | pendente |
| 104 | Reading metrics — tempo, páginas, sessões | feature,library,ux | pendente |
| 99 | Reader: highlights, notas por trecho, busca interna | feature,library,ux | pendente |
| 120 | Reading goals + streaks multi-domínio | feature,library,tracking | pendente |
| **— ÉPICO: DIÁRIO —** | | | |
| 105 | Journal module — schema + CRUD entradas diárias | module,journal,data | pendente |
| 106 | Journal calendar — visão mensal + agenda do dia | feature,journal,ux | pendente |
| 107 | Journal cross-reference syntax (@date, @done, [[wikilinks]]) | feature,journal,ux | pendente |
| 108 | Journal daily goals — intenções + checklist por dia | feature,journal,ux | pendente |
| 109 | Journal avançado — templates, queries, revisão semanal, export | feature,journal,ux | pendente |
| **— ÉPICO: RASTREIO DE USO —** | | | |
| 110 | Activity tracking infrastructure — schema app_sessions | module,tracking,data | pendente |
| 111 | Idle detection + net time calculation — tempo líquido | feature,tracking,ux | pendente |
| 112 | Usage analytics dashboard — horas por seção | feature,tracking,ux | pendente |
| 113 | Tracking avançado — event queue, dedup, funil, session replay | feature,tracking,observability | pendente |
| **— ÉPICO: ATIVIDADE & CONHECIMENTO —** | | | |
| 96 | Activity feed — timeline unificada da vida | feature,ux,tracking | pendente |
| 97 | Knowledge graph pessoal — mapa de conexões | feature,architecture,ux | pendente |
| **— ÉPICO: ESTUDO MULTI-TÓPICO —** | | | |
| 115 | Multi-topic study framework — tópicos dinâmicos | module,learning-engine | pendente |
| 116 | Question/flashcard import — JSON bulk + manual | feature,learning-engine | pendente |
| 117 | Study modes per topic — session adaptada ao tipo | feature,learning-engine | pendente |
| 118 | Programming topics seed — Python/JS/SQL + code highlight | feature,learning-engine | pendente |
| 119 | Programming sandbox — execução WASM + learning roadmap | feature,learning-engine,ux | pendente |
