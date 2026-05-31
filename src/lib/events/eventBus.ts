import type { EventType, EventPayload } from './eventTypes';
import { buildIdempotencyKey, isDuplicate } from './deduplicator';
import { persistEvent } from './persistEvent';

type SyncHandler<T extends EventType> = (payload: EventPayload<T>) => void;
type AsyncHandler<T extends EventType> = (payload: EventPayload<T>) => Promise<void>;
type Handler<T extends EventType> = SyncHandler<T> | AsyncHandler<T>;

/*
! Process-scoped in-memory event bus. Runs inside the Next.js Node.js server process.
! Subscribers registered at module load time (boot-time registration pattern).
!
! Sync subscribers (streaks, critical updates): called before response returns.
! Async subscribers (analytics, search index, activity feed): fire-and-forget via
!   Promise.allSettled — subscriber errors do not propagate to the caller.
*/

const syncRegistry = new Map<EventType, SyncHandler<EventType>[]>();
const asyncRegistry = new Map<EventType, AsyncHandler<EventType>[]>();

function getOrInit<T>(map: Map<EventType, T[]>, key: EventType): T[] {
  if (!map.has(key)) map.set(key, []);
  return map.get(key)!;
}

export function onSync<T extends EventType>(eventType: T, handler: SyncHandler<T>): void {
  getOrInit(syncRegistry, eventType).push(handler as SyncHandler<EventType>);
}

export function onAsync<T extends EventType>(eventType: T, handler: AsyncHandler<T>): void {
  getOrInit(asyncRegistry, eventType).push(handler as AsyncHandler<EventType>);
}

/*
? Resolves aggregate_id from payload by convention (chunkId, bookId, entryDate, etc.)
*/
function extractAggregateId(payload: Record<string, unknown>): string | null {
  for (const key of ['chunkId', 'bookId', 'goalId', 'entityId', 'entryDate']) {
    if (payload[key] !== undefined) return String(payload[key]);
  }
  return null;
}

/*
! emit() is the main entry point. Call from API route handlers after the core action succeeds.
!
! Flow:
!  1. Build idempotency key — skip if duplicate within 5s window
!  2. Persist event to domain_events (audit log, replay)
!  3. Run sync subscribers — errors propagate (streak must be consistent before response)
!  4. Fire async subscribers — errors are logged but do NOT break the response
*/
export function emit<T extends EventType>(eventType: T, payload: EventPayload<T>): void {
  const now = Date.now();
  const aggregateId = extractAggregateId(payload as Record<string, unknown>);
  const key = buildIdempotencyKey(eventType, payload, aggregateId, now);

  if (isDuplicate(key)) return;

  persistEvent(eventType, payload, aggregateId, key, Math.floor(now / 1000));

  const syncHandlers = syncRegistry.get(eventType) ?? [];
  for (const handler of syncHandlers) {
    handler(payload as EventPayload<EventType>);
  }

  const asyncHandlers = asyncRegistry.get(eventType) ?? [];
  if (asyncHandlers.length > 0) {
    Promise.allSettled(
      asyncHandlers.map((h) => (h as AsyncHandler<EventType>)(payload as EventPayload<EventType>)),
    ).then((results) => {
      for (const result of results) {
        if (result.status === 'rejected') {
          console.error('[eventBus] async subscriber error', { eventType, reason: result.reason });
        }
      }
    });
  }
}

/*
? For testing: remove all registered handlers.
*/
export function clearAllHandlers(): void {
  syncRegistry.clear();
  asyncRegistry.clear();
}
