/*
! Public barrel for the favorites feature.
! Other features and pages MUST import from here only, never from
! ./application, ./infrastructure or ./domain directly.
*/
export type { FavoriteChunkSummary, FavoritesPage } from './domain/types';
export {
  listFavoritesUseCase,
  checkFavoriteUseCase,
  toggleFavoriteUseCase,
  randomFavoriteIdsUseCase,
  MAX_PAGE_SIZE,
} from './application/useCases';
