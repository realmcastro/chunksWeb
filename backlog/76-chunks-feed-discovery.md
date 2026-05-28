---
prioridade: 76
categoria: feature,interactive,ux
esforco: 2-3 dias
risco: medio
---

# Chunks feed (TikTok-style discovery)

## Contexto

Browse atual = list+filter. Não-engaging para discovery serendipitous. Mobile primary audience acostumado a swipe feeds.

## Problema

- Discovery passive: user precisa procurar
- Browse list não impulse "let me learn this"
- Mobile: tap-tap-tap fatigante

## Proposta

### Página `/feed`

Vertical swipe (mobile-first, desktop also):
- Each "card" = 1 chunk full-screen
- Auto-play TTS on enter view
- Quick actions: swipe right ⭐ favorite, swipe left ⏭ next, tap ⬆ "I know this", ⬇ "Don't know"
- Tap card flips → meaning + example + IPA
- Hold = audio repeat

### Recommendation algorithm
Mix:
- 40% spaced repetition due chunks
- 30% novel chunks (user's level, never seen)
- 20% lapsed chunks (re-introduce)
- 10% trending (popular among similar users)

Avoid: chunks user knows mastered (boring); chunks far above level (frustrating).

### Variety injection
- Every 5 cards: variety break — quick game (match meaning, fill blank)
- Every 10 cards: "Story" card — embedded story snippet item 73

### Like-style endpoint engagement
- Hearts (favorite)
- Save to collection (item 38)
- Share (item 69)

### Quick learning loop
- Swipe up + know → quality 4 SM-2 (treat as quick review)
- Swipe up + don't know → enqueue for proper learning
- Mini-cloze on tap (optional layer)

### Background music / vibe
- Optional ambient track (lo-fi study) per scenario
- Toggle in setting

### Endless or scoped
- Default endless feed
- Scope filter: by category, by CEFR, by tag (item 38)

### Performance
- Pre-fetch next 3 cards (audio + image)
- Lazy load distant cards
- Service worker cache items for offline feed

## Arquivos

- `src/app/feed/page.tsx`
- `src/components/feed/ChunkFeedCard.tsx`
- `src/components/feed/SwipeContainer.tsx`
- `src/lib/feed/recommendation.ts`
- `src/lib/hooks/useSwipe.ts`
- `src/app/api/feed/next/route.ts` — paginated stream

## Validação

- [ ] Swipe gestures responsive (no lag)
- [ ] Audio auto-play respects browser policy (user gesture first)
- [ ] Recommendation diverse (verify no repeats within 50 cards)
- [ ] Variety break appears every 5
- [ ] Performance: 60fps swipe animation
- [ ] Battery: TTS doesn't drain (skip auto-play on data-saver mode)
- [ ] Accessibility: alternative non-swipe controls (next button)

## Decisões pendentes

- Endless ou cap (50 cards/session)?
- Auto-play TTS: default ON ou OFF (data/battery concerns)?
- Desktop fallback: same swipe ou switch para arrow keys?
- Recommendation engine: weights configurable user (advanced setting)?
