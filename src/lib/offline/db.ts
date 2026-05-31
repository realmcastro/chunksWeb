/*
! Dexie-backed read mirror for chunks + categories.
! Source of truth remains server-side SQLite — this DB stores the last response
! payload by key so the UI can render while the network is unavailable.
!
! NOT a write-back cache. Mutations (favorite, review submit, etc) MUST go
! through the API. When offline the queue lives in `mutationQueue` (see queue.ts)
! and replays on reconnect.
*/
'use client';

import Dexie, { type Table } from 'dexie';

export interface CachedChunkRow {
  id: number;
  language: string;
  payload: string;
  cached_at: number;
}

export interface CachedCategoryRow {
  id: number;
  payload: string;
  cached_at: number;
}

export interface CachedListRow {
  key: string;
  payload: string;
  cached_at: number;
}

export interface QueuedMutationRow {
  id?: number;
  endpoint: string;
  method: 'POST' | 'DELETE' | 'PUT' | 'PATCH';
  body: string;
  created_at: number;
  attempts: number;
}

class OLifeSOfflineDB extends Dexie {
  chunks!: Table<CachedChunkRow, number>;
  categories!: Table<CachedCategoryRow, number>;
  lists!: Table<CachedListRow, string>;
  mutationQueue!: Table<QueuedMutationRow, number>;

  constructor() {
    super('olifes-offline');
    this.version(1).stores({
      chunks: 'id, language, cached_at',
      categories: 'id, cached_at',
      lists: 'key, cached_at',
      mutationQueue: '++id, endpoint, created_at',
    });
  }
}

let instance: OLifeSOfflineDB | null = null;

export function getOfflineDB(): OLifeSOfflineDB | null {
  if (typeof window === 'undefined') return null;
  if (!instance) instance = new OLifeSOfflineDB();
  return instance;
}

const TTL_MS = 24 * 60 * 60 * 1000;

export async function putCachedList(key: string, payload: unknown): Promise<void> {
  const db = getOfflineDB();
  if (!db) return;
  await db.lists.put({
    key,
    payload: JSON.stringify(payload),
    cached_at: Date.now(),
  });
}

export async function getCachedList<T>(key: string): Promise<T | null> {
  const db = getOfflineDB();
  if (!db) return null;
  const row = await db.lists.get(key);
  if (!row) return null;
  if (Date.now() - row.cached_at > TTL_MS) return null;
  try {
    return JSON.parse(row.payload) as T;
  } catch {
    return null;
  }
}

export async function clearOfflineCache(): Promise<void> {
  const db = getOfflineDB();
  if (!db) return;
  await Promise.all([db.chunks.clear(), db.categories.clear(), db.lists.clear()]);
}
