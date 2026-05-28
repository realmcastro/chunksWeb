---
prioridade: 69
categoria: feature,ux
esforco: 2 dias
risco: medio
dependencias: [67-personal-records-achievements, 63-activity-heatmap]
---

# Public shareable profile (opt-in)

## Contexto

Achievements + heatmap + records existem apenas privado. Sem compartilhamento → no viral / social proof.

## Problema

- Friction onboarding novo user (sem social proof "look at my friend's progress")
- Conquistas isoladas reduzem motivação
- Sem narrativa pública para community / leaderboard

## Proposta

### Profile URL
- `/u/[username]` (ou `/u/[hash]` se username sensitivo)
- Opt-in via setting "Public profile"
- Per-section toggle: stats public / achievements public / heatmap public / records public

### Profile sections
- Header: username (or anonymous handle), languages studying, member since, current streak
- Achievements grid (subset que user permite)
- Activity heatmap (current year)
- Personal records highlights
- "Currently studying" — current language + estimated level
- Total stats: chunks mastered, hours invested, reviews completed

### Privacy controls
- Hide specific items (granular)
- Block specific users (future)
- Robot.txt: `/u/*` indexable opt-in only

### OG image
- Auto-generated banner image with key stats
- Server-rendered via Satori / @vercel/og
- Cache 1h

### Share actions
- Copy link
- Twitter intent
- "Embed badge" — small HTML snippet to embed badge em outro site

### Public discovery (opt-in deeper)
- `/discover` page lista perfis públicos opt-in
- Filter: by language, by level
- Show only highly active (last 7d) to prevent dead profiles dominating

## Arquivos

- Migration: `users.public_profile_enabled`, `users.profile_visibility` JSON (per-section toggles), `users.public_handle`
- `src/app/u/[handle]/page.tsx` — server component
- `src/app/u/[handle]/opengraph-image.tsx`
- `src/app/settings/profile/page.tsx` — visibility controls
- `src/app/discover/page.tsx` (optional)
- `src/lib/profile/visibility.ts` — guard logic

## Validação

- [ ] Profile renders for opt-in user
- [ ] 404 (or 403) for opt-out user
- [ ] Per-section toggle respected
- [ ] OG image renders + caches
- [ ] No PII leak: hash usado se user prefere
- [ ] SEO: indexable opt-in, noindex default

## Decisões pendentes

- Profile handle: same as username (collision risk if username unique) ou separate field?
- Achievement display: chronological vs grouped by rarity?
- Activity heatmap: full year ou last 90 days only (privacy)?
- Stats freshness: real-time ou daily snapshot (caching)?
- Followers/following: defer ou bundle? Recomendação: defer.
