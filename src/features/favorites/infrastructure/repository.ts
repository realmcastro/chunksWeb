/*
! Repository: thin adapter over src/lib/db/sqlite to keep the feature
! independent of the underlying DB driver. Swap implementations here when
! migrating to a different storage (e.g. Turso, see ADR-007 stub).
*/
import {
  getFavoritesForUser,
  getFavoritesCount,
  addFavorite,
  removeFavorite,
  isFavorite,
  getRandomFavoriteIds,
} from '@/lib/db/sqlite';
import type { FavoriteChunkSummary, FavoritesPage } from '../domain/types';

export function listFavorites(
  userId: number,
  limit: number,
  offset: number,
  language?: string,
): FavoritesPage {
  const chunks = getFavoritesForUser(userId, limit, offset, language);
  const totalCount = getFavoritesCount(userId, language);
  return {
    items: chunks.map(
      (c): FavoriteChunkSummary => ({
        id: c.id,
        chunkText: c.chunk_text,
        meaning: c.meaning,
        categoryId: c.category_id,
      }),
    ),
    totalCount,
  };
}

export function isFavoritedBy(userId: number, chunkId: number): boolean {
  return isFavorite(userId, chunkId);
}

export function favorite(userId: number, chunkId: number): void {
  addFavorite(userId, chunkId);
}

export function unfavorite(userId: number, chunkId: number): void {
  removeFavorite(userId, chunkId);
}

export function pickRandomFavoriteIds(
  userId: number,
  limit: number,
  language?: string,
): number[] {
  return getRandomFavoriteIds(userId, limit, language);
}
