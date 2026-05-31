/*
! Typed event map for the internal event bus.
! All events must be registered here before use.
! aggregate_id semantics per event type noted in comments.
*/

export interface EventMap {
  'study.session.completed': {
    userId: number;
    domainId: number;
    chunksReviewed: number;
    chunksMastered: number;
    durationMs: number;
    sessionDate: string; // ISO date YYYY-MM-DD
  };
  'study.chunk.reviewed': {
    userId: number;
    chunkId: number;
    quality: number; // 0-5 SM-2 quality
    domainId: number;
    durationMs: number;
  };
  'reading.page.changed': {
    userId: number;
    bookId: number;
    page: number;
    netActiveMs: number;
  };
  'reading.session.ended': {
    userId: number;
    bookId: number;
    grossMs: number;
    netMs: number;
    pagesRead: number;
  };
  'journal.entry.saved': {
    userId: number;
    entryDate: string;
    wordCount: number;
  };
  'journal.goal.completed': {
    userId: number;
    goalId: number;
    entryDate: string;
  };
  'app.session.ended': {
    userId: number;
    section: string;
    grossMs: number;
    netMs: number;
  };
  'search.index.requested': {
    entityType: 'chunk' | 'book' | 'journal_entry' | 'book_highlight';
    entityId: number | string;
    userId: number;
  };
}

export type EventType = keyof EventMap;
export type EventPayload<T extends EventType> = EventMap[T];
