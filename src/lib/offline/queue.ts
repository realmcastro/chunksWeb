/*
! Offline mutation queue.
!
! Use queueMutation() when a write fails due to network failure or when the
! browser reports offline. flushQueue() replays pending entries when online.
!
! Each entry carries the original endpoint + body. Replay is best-effort:
! on 4xx the entry is dropped (client-side error, not transient).
! On 5xx or network error, attempts++ and the entry stays for the next flush.
! After MAX_ATTEMPTS it is dropped to avoid infinite retry loops.
*/
'use client';

import { getOfflineDB, type QueuedMutationRow } from './db';
import { logger } from '@/lib/logger';

const MAX_ATTEMPTS = 5;

export async function queueMutation(
  endpoint: string,
  method: QueuedMutationRow['method'],
  body: unknown,
): Promise<void> {
  const db = getOfflineDB();
  if (!db) return;
  await db.mutationQueue.add({
    endpoint,
    method,
    body: JSON.stringify(body),
    created_at: Date.now(),
    attempts: 0,
  });
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('offline-mutation-queued'));
  }
}

export async function flushQueue(): Promise<{ flushed: number; remaining: number }> {
  const db = getOfflineDB();
  if (!db) return { flushed: 0, remaining: 0 };
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return { flushed: 0, remaining: await db.mutationQueue.count() };
  }

  const rows = await db.mutationQueue.orderBy('created_at').toArray();
  let flushed = 0;

  for (const row of rows) {
    try {
      const response = await fetch(row.endpoint, {
        method: row.method,
        headers: { 'Content-Type': 'application/json' },
        body: row.body,
      });
      if (response.ok) {
        if (row.id !== undefined) await db.mutationQueue.delete(row.id);
        flushed++;
        continue;
      }
      if (response.status >= 400 && response.status < 500) {
        logger.warn('Dropping queued mutation after 4xx', {
          endpoint: row.endpoint,
          status: response.status,
        });
        if (row.id !== undefined) await db.mutationQueue.delete(row.id);
        continue;
      }
      if (row.id !== undefined) {
        await db.mutationQueue.update(row.id, { attempts: row.attempts + 1 });
        if (row.attempts + 1 >= MAX_ATTEMPTS) {
          await db.mutationQueue.delete(row.id);
        }
      }
    } catch (error) {
      logger.warn('Mutation replay failed (network)', { endpoint: row.endpoint, error });
      if (row.id !== undefined) {
        await db.mutationQueue.update(row.id, { attempts: row.attempts + 1 });
        if (row.attempts + 1 >= MAX_ATTEMPTS) {
          await db.mutationQueue.delete(row.id);
        }
      }
    }
  }

  const remaining = await db.mutationQueue.count();

  if (flushed > 0 && typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent<{ flushed: number }>('offline-sync-complete', { detail: { flushed } }),
    );
  }

  return { flushed, remaining };
}

let listenerAttached = false;

/*
? Call once from a top-level client component (e.g. AuthProvider) so the queue
? automatically flushes when connectivity returns.
*/
export function attachOnlineListener(): void {
  if (typeof window === 'undefined' || listenerAttached) return;
  listenerAttached = true;
  window.addEventListener('online', () => {
    void flushQueue();
  });
}
