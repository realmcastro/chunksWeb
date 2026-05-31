/*
! Boot-time subscriber registration.
! Import this file once at server startup to wire all event handlers.
! Each import has side effects (calls onSync/onAsync).
*/

import './studyStats';
import './searchIndexer';
// future: import './activityFeed';
// future: import './readingStats';
// future: import './journalStats';
