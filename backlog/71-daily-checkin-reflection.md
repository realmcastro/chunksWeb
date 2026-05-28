---
prioridade: 71
categoria: feature,ux,interactive
esforco: 2 dias
risco: baixo
dependencias: [62-stats-event-schema]
---

# Daily check-in + reflection journal (interactive page)

## Contexto

User completa session e fecha. Sem ritual de fechamento / consolidação. Pesquisa: reflection improves retention (metacognition effect).

## Problema

- Sem hook diário "what did I learn?"
- Streak quebrado sem awareness do user
- Sem captura de subjective state (motivation, fatigue, confidence)

## Proposta

### Página `/today`
Visita user-driven (ou automatic prompt 1× per day). Multi-step interactive:

#### Step 1: Mood / energy
- "How are you feeling about today's study?" 
- Emojis: 😩 😐 🙂 😄 🚀
- Optional: energy slider 1-10

#### Step 2: Goal commitment
- Pre-fills com daily goal (item 60 streak)
- "Today's target: 30 chunks · 15min"
- Adjust slider real-time
- "Why this?" optional text (e.g. "preparing for trip")

#### Step 3: Quick warm-up (1 chunk)
- Single chunk preview — random due ou difficult
- "Quick recap before diving in"
- 1-tap rate (3 = good, advance)

#### Step 4: Reflection prompt (post-session)
- After session ends, return to `/today` final step
- "What's one chunk you'll remember tomorrow?"
- Textarea curto
- "How confident? 1-5"
- Save as `daily_reflection` event

#### Step 5: Tomorrow preview
- "Tomorrow: 18 chunks due (~8min) at your usual time"
- Optional: schedule notification (item 22)

### Insights derivative
- Mood vs performance correlation: "You score higher when energy >= 7"
- Reflection word-cloud: themes você reflete sobre
- "Confidence trend" chart

### Persistence
```sql
CREATE TABLE daily_checkins (
  id INTEGER PRIMARY KEY,
  user_id INTEGER,
  date TEXT,            -- YYYY-MM-DD user-local
  mood INTEGER,         -- 1-5
  energy INTEGER,       -- 1-10
  goal_chunks INTEGER,
  goal_minutes INTEGER,
  intent TEXT,          -- "why" free text
  reflection TEXT,      -- end-of-day free text
  confidence INTEGER,   -- 1-5
  completed_goal BOOLEAN,
  UNIQUE(user_id, date)
);
```

### UX details
- Skip option em qualquer step (não obrigatório)
- Resume mid-flow (state persiste em URL ou DB)
- Optimistic UI: save em cada step (não wait final)
- Animations: gentle, não interruptive

### Smart prompts
- Se user pulou check-in 3 dias: gentle prompt "How's it going?"
- Se mood baixo 5 dias: "Want to take a break or lower target?"
- Se confidence subindo: "You're crushing it 🎉"

## Arquivos

- Migration: `daily_checkins`
- `src/app/today/page.tsx` — multi-step orchestrator
- `src/components/today/MoodStep.tsx`
- `src/components/today/GoalStep.tsx`
- `src/components/today/WarmupStep.tsx`
- `src/components/today/ReflectionStep.tsx`
- `src/app/api/today/checkin/route.ts`
- `src/app/api/today/reflection/route.ts`
- `src/lib/insights/mood-correlation.ts`

## Validação

- [ ] Multi-step flow navega sem perda de state
- [ ] Skip any step funciona
- [ ] Reflection persiste mesmo se browser fecha mid-write (autosave debounced)
- [ ] Tomorrow preview accurate (due count)
- [ ] Insights mood vs performance renderiza quando >= 14d data
- [ ] Mobile: each step single-screen, comfortable

## Decisões pendentes

- Mandatory ou skippable? **Skippable** (friction).
- Reflection text shareable em public profile (item 69)? **Não** — privado.
- AI-generated reflection prompt variations (Claude API)? Defer.
- Streak depende de check-in OU activity? **Activity** (check-in opcional).
