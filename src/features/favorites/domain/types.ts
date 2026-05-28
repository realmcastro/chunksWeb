/*
! Domain types for the favorites feature.
! Decoupled from the better-sqlite3 row shape so presentation/application code
! does not depend on the DB schema directly.
*/

export interface FavoriteChunkSummary {
  id: number;
  chunkText: string;
  meaning: string;
  categoryId: number;
}

export interface FavoritesPage {
  items: FavoriteChunkSummary[];
  totalCount: number;
}
