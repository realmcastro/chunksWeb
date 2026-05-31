import type { EventType, EventPayload } from './eventTypes';
import { db } from '@/lib/db/sqlite';

/*
! Idempotency window: 5 seconds.
! Key: hash(event_type + aggregate_id + user_id + floor(occurred_at / 5000))
! Prevents double-count on API retries within the same 5s bucket.
*/
const WINDOW_MS = 5_000;

export function buildIdempotencyKey<T extends EventType>(
  eventType: T,
  payload: EventPayload<T>,
  aggregateId: string | null,
  occurredAt: number,
): string {
  const userId = (payload as { userId?: number }).userId ?? 0;
  const bucket = Math.floor(occurredAt / WINDOW_MS);
  return `${eventType}:${userId}:${aggregateId ?? ''}:${bucket}`;
}

export function isDuplicate(key: string): boolean {
  const row = db
    .prepare('SELECT 1 FROM domain_events WHERE idempotency_key = ?')
    .get(key);
  return row !== undefined;
}
