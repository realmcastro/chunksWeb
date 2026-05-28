---
prioridade: 67
categoria: feature,ux
esforco: 2 dias
risco: baixo
dependencias: [62-stats-event-schema]
---

# Personal records + achievements / badges

## Contexto

Sem gamification além de streak. Sem milestones celebrados.

## Problema

- Sem dopamine hits previsíveis → retention impactada
- Conquistas históricas perdidas (user nunca vê "you mastered 100 chunks!")
- Sem narrativa de progresso (user esquece o quanto avançou)

## Proposta

### Personal records
Auto-detect e gravar:
- Longest streak (current vs all-time best)
- Most reviews em 1 dia
- Most chunks mastered em 1 semana
- Fastest session (5 chunks reviewed em < N min)
- Highest avg quality em 1 week
- Most consecutive perfect (5) ratings
- Longest gap without lapse

```sql
CREATE TABLE user_personal_records (
  id INTEGER PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  record_type TEXT NOT NULL,    -- 'longest_streak', 'reviews_in_day', etc.
  value REAL NOT NULL,
  achieved_at INTEGER NOT NULL,
  metadata TEXT,                -- JSON: context (which chunks, session_id)
  UNIQUE(user_id, record_type)  -- only one row per type (current record)
);

CREATE TABLE user_record_history (
  id INTEGER PRIMARY KEY,
  user_id INTEGER,
  record_type TEXT,
  value REAL,
  achieved_at INTEGER,
  superseded_at INTEGER         -- when broken
);
```

### Achievements (badges)
Static catalog em código + dynamic unlock based em events:

```ts
// src/lib/achievements/catalog.ts
export const achievements = [
  { id: 'first_chunk', name: 'First Step', icon: '🌱', condition: (e) => e.chunk_learned >= 1 },
  { id: 'week_streak', name: 'On Fire', icon: '🔥', condition: (e) => e.longest_streak >= 7 },
  { id: 'hundred_mastered', name: 'Centurion', icon: '💯', condition: (e) => e.mastered >= 100 },
  { id: 'polyglot', name: 'Polyglot', icon: '🌍', condition: (e) => e.languages_studied >= 3 },
  { id: 'feynman_explorer', name: 'Teacher', icon: '🎓', condition: (e) => e.feynman_count >= 50 },
  { id: 'night_owl', name: 'Night Owl', icon: '🦉', condition: (e) => e.sessions_after_midnight >= 5 },
  { id: 'early_bird', name: 'Early Bird', icon: '🐦', condition: (e) => e.sessions_before_6am >= 5 },
  // ... ~30+ badges total
] as const;
```

```sql
CREATE TABLE user_achievements (
  user_id INTEGER,
  achievement_id TEXT,
  unlocked_at INTEGER,
  PRIMARY KEY (user_id, achievement_id)
);
```

### Detection
Background check after each session_ended event:
- Run all achievement conditions
- Insert new unlocks
- Trigger notification

### UI
- **Achievements page**: grid of all badges, locked grayed-out + locked criteria visible
- **Toast on unlock**: confetti animation, badge icon, "Achievement unlocked!"
- **Profile section**: top 5 highlighted badges
- **Records page**: list with date achieved + history (broken records → "previous best: X")

### Shareable
- "I just unlocked Centurion 💯 on ChunksWeb" share button (opt-in, copies link/image)
- OG image generator (item 33): badge graphic

## Arquivos

- Migrations (3 tables)
- `src/lib/achievements/catalog.ts`
- `src/lib/achievements/detector.ts`
- `src/lib/achievements/personal-records.ts`
- `src/app/api/achievements/route.ts`
- `src/app/achievements/page.tsx`
- `src/app/records/page.tsx`
- `src/components/dashboard/AchievementToast.tsx`
- `src/components/dashboard/RecordsList.tsx`

## Validação

- [ ] Badge unlocks no momento correto (após session, não delay 24h)
- [ ] Toast aparece 1× per unlock (não duplica em re-render)
- [ ] Personal record breaks: registra superseded_at, mostra "previous best"
- [ ] Mobile: grid responsive, badges visíveis
- [ ] Locked badges hint criterion sem spoiling se for "secret achievement"
- [ ] Performance: 30+ badge checks após session < 100ms

## Decisões pendentes

- Secret badges (criterio escondido até unlock)? Adds discovery joy.
- "Negative" badges (Comeback Kid — voltou após 30d sem study)? Cuidado tom.
- Reset all achievements option (settings)? Risk: rage-quit recovery.
- XP system: achievements grant XP → level up? Defer ou bundle aqui?
