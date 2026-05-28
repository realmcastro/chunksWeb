/*
! Use cases (orchestration) for favorites.
! Pure functions: take authenticated userId + input, return DTOs.
! Authentication is enforced at the route layer — these never check sessions.
*/
import {
  listFavorites,
  isFavoritedBy,
  favorite,
  unfavorite,
  pickRandomFavoriteIds,
} from '../infrastructure/repository';
import type { FavoritesPage } from '../domain/types';

export const MAX_PAGE_SIZE = 100;

export function listFavoritesUseCase(
  userId: number,
  page: number,
  pageSize: number,
  language?: string,
): FavoritesPage {
  const safePage = Math.max(page, 1);
  const safeSize = Math.min(Math.max(pageSize, 1), MAX_PAGE_SIZE);
  const offset = (safePage - 1) * safeSize;
  return listFavorites(userId, safeSize, offset, language);
}

export function checkFavoriteUseCase(userId: number, chunkId: number): boolean {
  return isFavoritedBy(userId, chunkId);
}

export function toggleFavoriteUseCase(
  userId: number,
  chunkId: number,
  desired: boolean,
): { favorite: boolean } {
  if (desired) favorite(userId, chunkId);
  else unfavorite(userId, chunkId);
  return { favorite: desired };
}

export function randomFavoriteIdsUseCase(
  userId: number,
  limit: number,
  language?: string,
): number[] {
  const safeLimit = Math.min(Math.max(limit, 1), 50);
  return pickRandomFavoriteIds(userId, safeLimit, language);
}
