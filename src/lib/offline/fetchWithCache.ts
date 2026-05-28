/*
! fetchWithCache — GET-only network-first wrapper backed by the Dexie list cache.
!
! Strategy:
!   1. Try network. On success cache the parsed JSON and return it.
!   2. On network failure return the most recent cached value if present.
!   3. If no cache exists, rethrow so the caller can render an error state.
*/
'use client';

import { getCachedList, putCachedList } from './db';
import { logger } from '@/lib/logger';

interface FetchWithCacheOptions {
  key: string;
  init?: RequestInit;
}

export async function fetchWithCache<T>(url: string, options: FetchWithCacheOptions): Promise<T> {
  try {
    const response = await fetch(url, options.init);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = (await response.json()) as T;
    void putCachedList(options.key, data);
    return data;
  } catch (networkError) {
    const cached = await getCachedList<T>(options.key);
    if (cached !== null) {
      logger.warn('Serving cached payload (offline)', { url, key: options.key });
      return cached;
    }
    throw networkError;
  }
}
