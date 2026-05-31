import { onAsync } from '../eventBus';
import { indexChunk, removeFromIndex } from '@/lib/search/indexer';

/*
? Async subscriber — keeps search_index in sync with domain events.
? Runs after response returns (fire-and-forget). Index latency < 1s typical.
*/

onAsync('search.index.requested', async ({ entityType, entityId }) => {
  if (entityType === 'chunk' && typeof entityId === 'number') {
    indexChunk(entityId);
  }
});
