'use client';

import { useCallback } from 'react';
import { queueMutation } from '@/lib/offline/queue';
import type { QueuedMutationRow } from '@/lib/offline/db';

/*
! Wraps mutating fetch calls with offline awareness.
!
! Enqueue-eligible routes: review submit, favorites, feynman submit.
! Never enqueue reads — only routes declared here should use this hook.
!
! When offline: enqueues the mutation in Dexie, returns { queued: true }.
! When online: executes the fetch normally, returns the Response.
!
! Invariants:
!  - body is always JSON-serialized — call sites must pass a JSON-serializable value
!  - 401 during replay will drop the entry (handled in flushQueue)
!  - no dedup: two identical mutations while offline = two replays
*/

type MutationMethod = QueuedMutationRow['method'];

type MutationResult = Response | { queued: true };

export function useApiMutation() {
  const mutate = useCallback(
    async (
      endpoint: string,
      method: MutationMethod,
      body: unknown,
    ): Promise<MutationResult> => {
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        await queueMutation(endpoint, method, body);
        return { queued: true };
      }
      return fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
    },
    [],
  );

  return mutate;
}

export function isQueuedResult(result: MutationResult): result is { queued: true } {
  return 'queued' in result && result.queued === true;
}
