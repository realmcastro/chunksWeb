import { onAsync } from '../eventBus';

/*
? Async subscriber — accumulation point for domain-level analytics.
? The route already calls recordStudySession directly; this subscriber
? is the hook for future consumers: analytics dashboard (#112),
? knowledge graph (#97), activity feed (#96).
? Safe to fail — does not affect SM-2 correctness or session recording.
*/
onAsync('study.session.completed', async (payload) => {
  void payload;
});

onAsync('study.chunk.reviewed', async (payload) => {
  void payload;
});
