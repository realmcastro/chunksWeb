---
prioridade: 74
categoria: feature,interactive,ux
esforco: 2-3 dias
risco: medio
dependencias: [62-stats-event-schema, 80-ai-tutoring-chat]
---

# AI coach — interactive daily plan recommender

## Contexto

User chega no dashboard sem direção: "what should I do today?" Atual: open study, ad-hoc decide. Sem personalização baseada em weak spots + available time.

## Problema

- Cognitive load: user decide cada vez o que estudar
- Sem otimização: user pode estar reviewing fácil chunks e ignorando difficult
- Sem accountability conversacional

## Proposta

### Página `/coach`

#### Interactive conversation (limited turns)
Coach (AI persona) pergunta:
1. "How much time do you have today?" (chips: 5min / 15min / 30min / 60min)
2. "Energy level?" (😩 → 🚀)
3. "Anything specific you want to work on?" (chips: vocab / grammar / listening / speaking / writing / surprise me)
4. Optional: "Goal this week?" (link a achievements item 67)

#### Coach generates plan
Baseado em:
- User's weak skills (mastery radar item 66)
- Lapsed chunks (forgetting curve item 64)
- Time budget vs avg item duration
- Energy: high → challenging activities (feynman, speak); low → flashcard review

Plan output: ordered list, total estimated time
```
For your 15min today:
  1. ▶ Review 12 due chunks (~6 min)
  2. ▶ Practice 3 lapsed chunks in cloze mode (~4 min)
  3. ▶ Listen + dictation: 5 examples (~5 min)
Coach note: Your listening accuracy improved 12% last week — keep it up!
```

#### Execute or remix
- Tap each item to start
- "Skip" → adjust subsequent estimate
- "Remix plan" → regenerate
- Plan persists per day, complete % shown

#### Mid-session check-in
- After each plan item: "How was that?" (😩/🙂/🚀)
- Adjust next item based on feedback (too easy → harder next; tired → lighter)

#### End-of-day summary
- "You completed 3/4 today. Tomorrow's preview:"
- Coach evolves message based on patterns ("You usually do strong sessions on Mondays")

### Coach personality
- Warm, encouraging, not pushy
- Acknowledges struggle (low mood)
- Celebrates wins (PR records)
- Voice consistency: tone setting "Drill sergeant / Friend / Professor / Concise"

### Storage
```sql
CREATE TABLE daily_plans (
  id INTEGER PRIMARY KEY,
  user_id INTEGER,
  date TEXT,
  time_budget_min INTEGER,
  energy INTEGER,
  focus_preference TEXT,
  plan_json TEXT,             -- ordered items + estimated durations
  items_completed INTEGER,
  total_items INTEGER,
  coach_notes TEXT,
  UNIQUE(user_id, date)
);
```

### LLM caching
- Coach system prompt (large) cached via prompt caching
- User context (last week stats summary) cached as session
- Per-turn message small, fast response

## Arquivos

- `src/app/coach/page.tsx`
- `src/components/coach/CoachConversation.tsx`
- `src/components/coach/PlanList.tsx`
- `src/components/coach/CheckIn.tsx`
- `src/lib/coach/plan-generator.ts` — local algorithm + LLM-enhanced narrative
- `src/lib/coach/persona.ts` — tone settings
- `src/app/api/coach/start/route.ts`
- `src/app/api/coach/respond/route.ts`
- `src/app/api/coach/complete/route.ts`
- Migration: `daily_plans`

## Validação

- [ ] Plan accurate time estimate (within 20%)
- [ ] Skip item recompute remaining time
- [ ] Mid-session adjustment apparent (next item harder/lighter)
- [ ] Coach notes contextual (refs last week, week, personal records)
- [ ] Tone setting muda persona consistently
- [ ] Mobile: chips taps comfortable
- [ ] Performance: plan generation < 2s

## Decisões pendentes

- Plan generation: pure algorithm (no LLM) vs LLM-augmented narrative?
  - Pure: free, fast, deterministic. Narrative dull.
  - LLM: nice voice, cost $.
  - Hybrid: algorithm picks items, LLM crafts intro/outro.
- "Coach" persona name: generic vs branded?
- Mandatory coach intro for new user? Defer (item 51 onboarding).
