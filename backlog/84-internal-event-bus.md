---
prioridade: 84
categoria: architecture,observability,module
esforco: 2 dias
risco: alto
dependencias: [83-domain-model-pluggable-topics]
---

# Internal event bus — arquitetura orientada a eventos

## Contexto

Meta-épico 09. Tracking, streaks, activity feed e knowledge graph precisam saber o que acontece no sistema. Hoje cada feature chama diretamente outra (acoplamento). Um event bus leve desacopla produtores de consumidores sem message broker externo.

## Problema

Sem eventos internos:
- Streak precisa ser atualizado dentro de `review/submit` (acoplado)
- Activity feed precisa puxar de 5 tabelas diferentes (N+1 ou views gordas)
- Analytics precisa ser chamado explicitamente em cada action handler
- Adicionar novo consumidor (ex: notificação) = modificar handlers existentes

## Proposta

### Event bus em processo (monolito Next.js)

Não é Kafka. É um emitter síncrono/assíncrono leve dentro do processo Node.js do servidor:

```typescript
// src/lib/events/eventBus.ts
type EventMap = {
  'study.session.completed': { userId: number; domainId: number; chunksReviewed: number; durationMs: number };
  'study.chunk.reviewed':    { userId: number; chunkId: number; quality: number; domainId: number };
  'reading.page.changed':    { userId: number; bookId: number; page: number; netActiveMs: number };
  'reading.session.ended':   { userId: number; bookId: number; grossMs: number; netMs: number };
  'journal.entry.saved':     { userId: number; entryDate: string; wordCount: number };
  'journal.goal.completed':  { userId: number; goalId: number; entryDate: string };
  'app.session.ended':       { userId: number; section: string; grossMs: number; netMs: number };
};

// Emitir (no handler da API):
eventBus.emit('study.session.completed', { userId, domainId, ... });

// Consumir (subscriber registrado no boot):
eventBus.on('study.session.completed', async (payload) => {
  await updateStreaks(payload);
  await updateDailyStats(payload);
});
```

### Persistência de eventos

```sql
CREATE TABLE domain_events (
  id INTEGER PRIMARY KEY,
  event_type TEXT NOT NULL,
  user_id INTEGER NOT NULL REFERENCES users(id),
  aggregate_id TEXT,             -- ex: chunkId, bookId, entryDate
  payload TEXT NOT NULL,         -- JSON
  occurred_at INTEGER NOT NULL,
  processed BOOLEAN DEFAULT FALSE
);

CREATE INDEX idx_domain_events_user_type ON domain_events(user_id, event_type, occurred_at);
```

Eventos persistidos = auditoria, replay, activity feed, analytics sem joins complexos.

### Deduplicação

- Idempotency key: `hash(event_type + aggregate_id + user_id + floor(occurred_at / 5000))` — 5s window
- Previne double-count em retry de API

### Background sync (PWA offline)

- Eventos gerados offline → IndexedDB queue local
- Ao reconectar: `POST /api/events/sync` com array de eventos buffered
- Server valida timestamps (rejeita eventos > 24h atrás)

### Subscribers padrão (boot-time registration)

| Evento | Subscriber |
|--------|-----------|
| `study.session.completed` | updateStreaks, updateDailyStats, updateActivityFeed |
| `study.chunk.reviewed` | updateSM2Stats |
| `reading.session.ended` | updateReadingStats, updateActivityFeed |
| `journal.entry.saved` | indexForSearch, updateActivityFeed |
| `journal.goal.completed` | updateGoalStats, updateActivityFeed |

## Arquivos

- `src/lib/events/eventBus.ts` — emitter + subscriber registry
- `src/lib/events/eventTypes.ts` — EventMap tipado
- `src/lib/events/subscribers/` — um arquivo por subscriber
- `src/lib/events/persistEvent.ts` — salva em `domain_events`
- `src/lib/events/deduplicator.ts`
- Migration: `domain_events`
- `src/app/api/events/sync/route.ts` — background sync offline

## Validação

- [ ] `eventBus.emit` no handler de review → subscriber de streak executado
- [ ] Evento persistido em `domain_events` com payload correto
- [ ] Evento duplicado em < 5s: idempotência, segundo ignored
- [ ] Offline queue: 10 eventos offline → sync → todos persistidos sem duplicata
- [ ] Subscriber que lança exceção: não quebra o handler principal (try/catch no bus)

## Decisões pendentes

- Event bus síncrono (bloqueia response) ou assíncrono (fire-and-forget com Promise.allSettled)?
  - **Recomendado: assíncrono para subscribers de analytics, síncrono para streaks** (streak precisa estar correto antes do response)
- Retenção de `domain_events`: manter todos (auditoria) ou purgar > 90 dias?
- Edge Runtime compatibility: event bus deve funcionar sem Node.js EventEmitter? (usar polling em vez de EventEmitter se app mover para edge)
