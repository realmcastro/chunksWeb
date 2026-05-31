import { db } from '@/lib/db/sqlite';
import type { EventType, EventPayload } from './eventTypes';

export interface PersistedEvent {
  id: number;
  event_type: string;
  user_id: number;
  aggregate_id: string | null;
  payload: string;
  occurred_at: number;
  processed: number;
  idempotency_key: string | null;
}

export function persistEvent<T extends EventType>(
  eventType: T,
  payload: EventPayload<T>,
  aggregateId: string | null,
  idempotencyKey: string | null,
  occurredAt: number,
): void {
  const userId = (payload as { userId?: number }).userId ?? 0;

  db.prepare(`
    INSERT OR IGNORE INTO domain_events
      (event_type, user_id, aggregate_id, payload, occurred_at, idempotency_key)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(
    eventType,
    userId,
    aggregateId,
    JSON.stringify(payload),
    occurredAt,
    idempotencyKey,
  );
}

export function markEventProcessed(eventId: number): void {
  db.prepare('UPDATE domain_events SET processed = 1 WHERE id = ?').run(eventId);
}

export function getUnprocessedEvents(limit = 100): PersistedEvent[] {
  return db
    .prepare(
      'SELECT * FROM domain_events WHERE processed = 0 ORDER BY occurred_at ASC LIMIT ?',
    )
    .all(limit) as PersistedEvent[];
}
