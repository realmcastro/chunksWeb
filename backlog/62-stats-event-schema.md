---
prioridade: 62
categoria: data,observability
esforco: 2-3 dias
risco: medio
---

# Stats event schema (event sourcing para analytics)

## Contexto

Métricas atuais derivadas de `user_progress`, `study_sessions`, `feynman_explanations` — tabelas state-based. Cálculos como "chunks reviewed esta semana" requerem JOIN + agregação repetida.

## Problema

- Agregações on-demand caras conforme dados crescem
- Sem dimensão temporal fina: study_sessions tem start/end, mas não captura cada review individual com timestamp
- Sem capacity para A/B test analysis (qual variant convertiu mais?)
- Sem retention cohort analysis (users que se registraram em Janeiro vs Fevereiro)
- "Chunks learned per day" não persistido como time-series → recomputar sempre

## Proposta

### Event log table
```sql
CREATE TABLE user_events (
  id INTEGER PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  event_type TEXT NOT NULL,
  event_data TEXT,              -- JSON payload
  language_code TEXT,           -- denormalized for fast filter
  category_id INTEGER,          -- denormalized
  occurred_at INTEGER NOT NULL, -- unix timestamp
  session_id TEXT,              -- correlate events from same session
  created_at INTEGER NOT NULL
);
CREATE INDEX idx_events_user_time ON user_events(user_id, occurred_at DESC);
CREATE INDEX idx_events_type_time ON user_events(event_type, occurred_at DESC);
CREATE INDEX idx_events_user_type ON user_events(user_id, event_type, occurred_at DESC);
```

### Event types
- `chunk_reviewed` — { chunk_id, quality, response_time_ms, was_due, previous_interval, new_interval }
- `chunk_learned` — { chunk_id } (primeira vez user vê)
- `chunk_mastered` — { chunk_id, days_since_learned } (atingiu mature)
- `chunk_lapsed` — { chunk_id, prev_ease, new_ease }
- `session_started` — { mode (learn/review/feynman/vocab/cloze/dictation), planned_count }
- `session_ended` — { duration_ms, completed_count, skipped_count }
- `streak_extended` — { new_streak, longest_streak }
- `streak_broken` — { prev_streak, freezes_used }
- `goal_achieved` — { goal_type (daily/weekly), value }
- `feature_used` — { feature (cloze/dictation/feynman/ai_chat), context }
- `setting_changed` — { setting, old_value, new_value }

### Aggregation tables (materialized views)
```sql
-- Daily roll-up (rebuilt nightly or on-write triggered)
CREATE TABLE user_daily_stats (
  user_id INTEGER,
  date TEXT,              -- YYYY-MM-DD local user tz
  language_code TEXT,
  reviews_count INTEGER DEFAULT 0,
  new_chunks INTEGER DEFAULT 0,
  mastered_count INTEGER DEFAULT 0,
  lapsed_count INTEGER DEFAULT 0,
  time_spent_ms INTEGER DEFAULT 0,
  avg_quality REAL,
  feynman_count INTEGER DEFAULT 0,
  cloze_count INTEGER DEFAULT 0,
  dictation_count INTEGER DEFAULT 0,
  goal_met BOOLEAN DEFAULT FALSE,
  PRIMARY KEY (user_id, date, language_code)
);
```

### Aggregation strategy
- **On-write trigger**: SQLite trigger increments daily row em INSERT user_events. Latência zero, write overhead pequeno.
- **Nightly rebuild**: cron job redo daily_stats para correção (in case events arrived late ou triggers falhou).
- **Retention**: events raw 90 dias, daily_stats 5 anos, monthly_stats forever.

### Logging API
```ts
// src/lib/analytics/events.ts
export function logEvent(userId: number, type: EventType, data?: Record<string, unknown>): void {
  // Async, non-blocking
  queue.push({ userId, type, data, occurredAt: Date.now() });
}
```

Batched insert a cada 5s ou 100 events.

### Privacy/consent
- Logged apenas com consent (item 36)
- Anonymization for future export to analytics platform (drop user_id, replace with hash)

## Arquivos

- Migration: `user_events`, `user_daily_stats`, triggers
- `src/lib/analytics/events.ts` — emit + batch flush
- `src/lib/analytics/aggregator.ts` — daily rollup job
- `src/lib/db/sqlite.ts` — query helpers para agregações comuns
- Wire `logEvent()` em: review/submit, learn/start, session/end, feynman/submit, vocab game submit
- `scripts/rebuild-daily-stats.ts` — nightly cron

## Validação

- [ ] Review submitted → event log + daily_stats incrementa
- [ ] Trigger consistency: rebuild daily_stats from raw events matches incremental version
- [ ] Query "chunks per day last 30d" < 50ms em 100K events
- [ ] Retention cleanup remove raw events > 90d
- [ ] Privacy: events not logged se consent.analytics false

## Decisões pendentes

- Trigger-based incremental vs batch nightly only? **Trigger** mais responsivo, batch backup.
- Event log retention: 90d razoável? Trade-off cost vs depth.
- Timezone handling: `date` em user-local ou UTC? **User-local** para "daily" make sense.
- Migration de dados históricos: backfill events from existing user_progress + study_sessions? Single-shot script.
