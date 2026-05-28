---
prioridade: 88
categoria: feature,reactive,ux
esforco: 2-3 dias
risco: medio
dependencias: [62-stats-event-schema]
---

# Reactive presence (live social signals, anonymous)

## Contexto

App é solo-experience. User estuda isolado, sem awareness de comunidade ativa. Outros apps (Wikipedia recent edits ticker, GitHub live presence indicators, Strava giving-of-kudos) usam "live presence" para criar sensação de coletivo sem chat/friend overhead.

## Problema

- Estudo solitário, sem motivação social passiva
- Sem prova de "this app is alive" (perception risk app é dead)
- User não sabe se chunk que está estudando é popular ou obscuro
- Sem reciprocidade não-invasiva (não-amizades, não-DMs, ainda assim social)

## Proposta

### 1. Live concurrent counter
- Pequeno indicador rodapé/sidebar: "🟢 23 learners studying now"
- WebSocket OR SSE OR poll a cada 30s
- Anonymous heartbeat: each open tab POSTs `/api/presence/ping` a cada 30s
- Server expira presence > 60s idle
- Display rounded ("dezenas", "centenas") para small audiences ("a few learners")

### 2. Chunk popularity reactive badges
- ChunkCard: small badge "🔥 247 studying this week"
- Counter atualiza realtime conforme user reviews
- Threshold: skip badge se < 5 (avoid stigma de chunks obscuros)
- Tooltip: "Popular this week (anonymous count)"

### 3. Live activity ticker
- `/community` page (opt-in) ou sidebar widget
- Stream anonymized events:
  - "Someone in Brazil just unlocked Centurion 💯"
  - "47 learners completed a session in the last hour"
  - "5 learners just mastered 'make up your mind'"
- Frequency: 1 event / 5-10s (não overwhelm)
- Filter privacy: hash user → "Learner #abc"

### 4. Reactive presence in shared resources
- Viewing collection (item 38) public: "3 others viewing"
- Reading story (item 73) public: "12 reading along"
- Helps surface popular content

### 5. Heatmap influence
- User dashboard heatmap (item 63) sutilmente shows global density?
- "Tuesdays are busy globally" ambient awareness
- Compare your activity to global trend

### 6. Cheer / kudos non-invasive
- See "🎉 someone just hit 30-day streak" → tap "Cheer" button → adds +1 to their counter
- Recipient sees aggregate ("+12 cheers from learners around the world")
- No DM, no follow, no friend mechanics — purely fire-and-forget

### Privacy / Anti-abuse
- Zero PII in presence (apenas userId hash, anonymized region/country opt-in)
- Opt-out total disponível (settings)
- Rate-limit heartbeats + cheers para prevent ddos / spam
- Aggregation only — never individual identification
- Region: country-level max (não cidade)

### Tech approach
- **Heartbeat**: HTTP poll a cada 30s (simpler than WebSocket initially)
- **Live counter**: in-memory Map em server, rebuild from heartbeats
- **Event stream**: SSE para activity ticker (efficient many-to-many)
- **Aggregate badges**: pre-computed nightly + invalidate on review submit (event-driven)

### Settings panel
`/settings/presence`:
- Toggle: anonymous presence sharing (default ON)
- Toggle: show others' presence (default ON)
- Toggle: receive cheers
- Region sharing: off / country-level

## Arquivos

- `src/app/api/presence/ping/route.ts`
- `src/app/api/presence/count/route.ts`
- `src/app/api/presence/stream/route.ts` (SSE)
- `src/app/api/cheers/send/route.ts`
- `src/components/presence/LiveLearnersCounter.tsx`
- `src/components/presence/ActivityTicker.tsx`
- `src/components/presence/ChunkPopularityBadge.tsx`
- `src/components/presence/CheerButton.tsx`
- `src/lib/presence/store.ts` (in-memory presence map)
- Migration: `chunk_popularity_weekly` (chunk_id, week_start, study_count), `user_cheers_received` (user_id, count, last_received_at)

## Validação

- [ ] Counter atualiza < 1min after new user joins
- [ ] Activity ticker scrolls smooth
- [ ] Chunk badge accurate (cross-check com DB)
- [ ] Opt-out: zero heartbeats sent
- [ ] Anonymous: impossível identify user from feed
- [ ] Rate limit: spam prevented
- [ ] Mobile: counter doesn't drain battery (poll throttle when backgrounded)

## Decisões pendentes

- WebSocket vs SSE vs polling? **SSE** boa option (one-way, simpler than WS).
- Round numbers display ("~25") vs exact ("23")?
- Cheers: limit per recipient per day (anti-spam)?
- Country flag visibility: privacy concern para small countries?
- Activity ticker durante study mode (focus, item 55) hide?
- Cheers persistem ou só ephemeral feel-good?
