import { describe, it, expect, vi, beforeAll, afterAll, beforeEach } from 'vitest';
import { emit, onSync, onAsync, clearAllHandlers } from '../eventBus';
import { db } from '@/lib/db/sqlite';

/*
! domain_events.user_id has FK REFERENCES users(id) and foreign_keys=ON.
! Insert a dedicated test user once; all events reference this userId.
*/
let TEST_USER_ID: number;

beforeAll(() => {
  const r = db
    .prepare('INSERT INTO users (username, password_hash) VALUES (?, ?)')
    .run('eventbus_test_user', 'hash');
  TEST_USER_ID = Number(r.lastInsertRowid);
});

afterAll(() => {
  db.prepare('DELETE FROM domain_events WHERE user_id = ?').run(TEST_USER_ID);
  db.prepare('DELETE FROM users WHERE id = ?').run(TEST_USER_ID);
});

beforeEach(() => {
  clearAllHandlers();
  db.prepare('DELETE FROM domain_events').run();
});

describe('onSync + emit', () => {
  it('calls sync handler before emit returns', () => {
    const calls: number[] = [];
    onSync('study.chunk.reviewed', (p) => calls.push(p.chunkId));

    emit('study.chunk.reviewed', { userId: TEST_USER_ID, chunkId: 99, quality: 4, domainId: 1, durationMs: 100 });

    expect(calls).toEqual([99]);
  });

  it('calls multiple sync handlers in registration order', () => {
    const order: string[] = [];
    onSync('study.chunk.reviewed', () => order.push('first'));
    onSync('study.chunk.reviewed', () => order.push('second'));

    emit('study.chunk.reviewed', { userId: TEST_USER_ID, chunkId: 100, quality: 4, domainId: 1, durationMs: 0 });

    expect(order).toEqual(['first', 'second']);
  });

  it('sync handler error propagates to caller', () => {
    onSync('study.chunk.reviewed', () => { throw new Error('sync boom'); });

    expect(() =>
      emit('study.chunk.reviewed', { userId: TEST_USER_ID, chunkId: 101, quality: 4, domainId: 1, durationMs: 0 }),
    ).toThrow('sync boom');
  });

  it('receives correct payload fields', () => {
    let received: typeof import('../eventTypes').EventMap['study.chunk.reviewed'] | null = null;
    onSync('study.chunk.reviewed', (p) => { received = p; });

    emit('study.chunk.reviewed', { userId: TEST_USER_ID, chunkId: 42, quality: 3, domainId: 2, durationMs: 500 });

    expect(received).toMatchObject({ userId: TEST_USER_ID, chunkId: 42, quality: 3, domainId: 2, durationMs: 500 });
  });
});

describe('onAsync + emit', () => {
  it('async handler runs asynchronously (fire-and-forget — not called before event loop yields)', async () => {
    const calls: number[] = [];
    onAsync('study.chunk.reviewed', async (p) => {
      // Force genuine async: yield to event loop before side-effectful work.
      // Without this await, the body executes synchronously during Promise creation.
      await new Promise((r) => setTimeout(r, 0));
      calls.push(p.chunkId);
    });

    emit('study.chunk.reviewed', { userId: TEST_USER_ID, chunkId: 200, quality: 4, domainId: 1, durationMs: 0 });

    // Not yet called — handler awaits a setTimeout before pushing
    expect(calls).toHaveLength(0);

    await new Promise((r) => setTimeout(r, 20));
    expect(calls).toEqual([200]);
  });

  it('async handler error does not throw from emit', async () => {
    onAsync('study.chunk.reviewed', async () => { throw new Error('async boom'); });

    expect(() =>
      emit('study.chunk.reviewed', { userId: TEST_USER_ID, chunkId: 201, quality: 4, domainId: 1, durationMs: 0 }),
    ).not.toThrow();

    await new Promise((r) => setTimeout(r, 20));
  });

  it('async handler receives correct payload', async () => {
    let received: unknown = null;
    onAsync('study.chunk.reviewed', async (p) => { received = p; });

    emit('study.chunk.reviewed', { userId: TEST_USER_ID, chunkId: 202, quality: 5, domainId: 3, durationMs: 300 });

    await new Promise((r) => setTimeout(r, 20));
    expect(received).toMatchObject({ chunkId: 202, quality: 5 });
  });

  it('both sync and async handlers fire for same event', async () => {
    const syncCalls: number[] = [];
    const asyncCalls: number[] = [];
    onSync('study.chunk.reviewed', (p) => syncCalls.push(p.chunkId));
    onAsync('study.chunk.reviewed', async (p) => { asyncCalls.push(p.chunkId); });

    emit('study.chunk.reviewed', { userId: TEST_USER_ID, chunkId: 203, quality: 4, domainId: 1, durationMs: 0 });

    expect(syncCalls).toEqual([203]);
    await new Promise((r) => setTimeout(r, 20));
    expect(asyncCalls).toEqual([203]);
  });
});

describe('deduplication', () => {
  it('skips second emit with same key within 5s window', () => {
    const calls: number[] = [];
    onSync('study.chunk.reviewed', (p) => calls.push(p.chunkId));

    const payload = { userId: TEST_USER_ID, chunkId: 300, quality: 4, domainId: 1, durationMs: 0 };
    emit('study.chunk.reviewed', payload);
    emit('study.chunk.reviewed', payload); // same key

    expect(calls).toHaveLength(1);
  });

  it('does not deduplicate different chunkIds', () => {
    const calls: number[] = [];
    onSync('study.chunk.reviewed', (p) => calls.push(p.chunkId));

    emit('study.chunk.reviewed', { userId: TEST_USER_ID, chunkId: 301, quality: 4, domainId: 1, durationMs: 0 });
    emit('study.chunk.reviewed', { userId: TEST_USER_ID, chunkId: 302, quality: 4, domainId: 1, durationMs: 0 });

    expect(calls).toHaveLength(2);
    expect(calls).toContain(301);
    expect(calls).toContain(302);
  });

  it('does not deduplicate different event types', () => {
    const chunkCalls: number[] = [];
    const sessionCalls: number[] = [];
    onSync('study.chunk.reviewed', (p) => chunkCalls.push(p.chunkId));
    onSync('study.session.completed', (p) => sessionCalls.push(p.domainId));

    const today = '2026-05-31';
    emit('study.chunk.reviewed', { userId: TEST_USER_ID, chunkId: 303, quality: 4, domainId: 1, durationMs: 0 });
    emit('study.session.completed', { userId: TEST_USER_ID, domainId: 1, chunksReviewed: 1, chunksMastered: 0, durationMs: 0, sessionDate: today });

    expect(chunkCalls).toHaveLength(1);
    expect(sessionCalls).toHaveLength(1);
  });
});

describe('persistence', () => {
  it('persists event payload to domain_events table', () => {
    emit('study.chunk.reviewed', { userId: TEST_USER_ID, chunkId: 400, quality: 5, domainId: 1, durationMs: 200 });

    const row = db
      .prepare("SELECT payload FROM domain_events WHERE event_type = 'study.chunk.reviewed' AND aggregate_id = '400'")
      .get() as { payload: string } | undefined;

    expect(row).toBeDefined();
    const payload = JSON.parse(row!.payload);
    expect(payload.chunkId).toBe(400);
    expect(payload.quality).toBe(5);
  });

  it('duplicate emit does not insert second row', () => {
    const payload = { userId: TEST_USER_ID, chunkId: 401, quality: 4, domainId: 1, durationMs: 0 };
    emit('study.chunk.reviewed', payload);
    emit('study.chunk.reviewed', payload);

    const rows = db
      .prepare("SELECT COUNT(*) as n FROM domain_events WHERE event_type = 'study.chunk.reviewed' AND aggregate_id = '401'")
      .get() as { n: number };

    expect(rows.n).toBe(1);
  });

  it('stores correct event_type and user_id', () => {
    emit('study.session.completed', {
      userId: TEST_USER_ID,
      domainId: 2,
      chunksReviewed: 5,
      chunksMastered: 2,
      durationMs: 0,
      sessionDate: '2026-05-31',
    });

    const row = db
      .prepare("SELECT event_type, user_id FROM domain_events WHERE event_type = 'study.session.completed'")
      .get() as { event_type: string; user_id: number } | undefined;

    expect(row?.event_type).toBe('study.session.completed');
    expect(row?.user_id).toBe(1);
  });
});

describe('clearAllHandlers', () => {
  it('prevents handlers from firing after clear', () => {
    const calls: number[] = [];
    onSync('study.chunk.reviewed', (p) => calls.push(p.chunkId));
    clearAllHandlers();

    emit('study.chunk.reviewed', { userId: TEST_USER_ID, chunkId: 500, quality: 4, domainId: 1, durationMs: 0 });

    expect(calls).toHaveLength(0);
  });

  it('clears both sync and async registries', async () => {
    const syncCalls: number[] = [];
    const asyncCalls: number[] = [];
    onSync('study.chunk.reviewed', (p) => syncCalls.push(p.chunkId));
    onAsync('study.chunk.reviewed', async (p) => { asyncCalls.push(p.chunkId); });
    clearAllHandlers();

    emit('study.chunk.reviewed', { userId: TEST_USER_ID, chunkId: 501, quality: 4, domainId: 1, durationMs: 0 });

    await new Promise((r) => setTimeout(r, 20));
    expect(syncCalls).toHaveLength(0);
    expect(asyncCalls).toHaveLength(0);
  });
});
