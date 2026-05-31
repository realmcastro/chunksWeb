import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getUserIdFromCookie } from '@/lib/auth/session';
import { emit } from '@/lib/events/eventBus';
import '@/lib/events/subscribers';
import type { EventType } from '@/lib/events/eventTypes';

const MAX_OFFLINE_AGE_SECONDS = 24 * 60 * 60; // 24 hours

const OfflineEventSchema = z.object({
  eventType: z.string(),
  payload: z.record(z.string(), z.unknown()),
  occurredAt: z.number().int().positive(),
});

const SyncBodySchema = z.object({
  events: z.array(OfflineEventSchema).max(500),
});

const ALLOWED_OFFLINE_EVENTS: ReadonlySet<string> = new Set([
  'study.chunk.reviewed',
  'study.session.completed',
  'reading.page.changed',
  'reading.session.ended',
  'journal.entry.saved',
  'app.session.ended',
]);

/*
! POST /api/events/sync — replay offline-buffered events from IndexedDB queue.
! Validates: authenticated, events not older than 24h, only whitelisted event types.
! Each event re-enters the bus (deduplication prevents double-count).
*/
export async function POST(request: Request) {
  const userId = await getUserIdFromCookie();
  if (!userId) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const body: unknown = await request.json();
  const parsed = SyncBodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const nowSeconds = Math.floor(Date.now() / 1000);
  const results = { accepted: 0, rejected: 0, reasons: [] as string[] };

  for (const event of parsed.data.events) {
    const ageSeconds = nowSeconds - Math.floor(event.occurredAt / 1000);

    if (ageSeconds > MAX_OFFLINE_AGE_SECONDS) {
      results.rejected++;
      results.reasons.push(`${event.eventType}: too old (${ageSeconds}s)`);
      continue;
    }

    if (!ALLOWED_OFFLINE_EVENTS.has(event.eventType)) {
      results.rejected++;
      results.reasons.push(`${event.eventType}: not allowed offline`);
      continue;
    }

    // Ensure userId in payload matches authenticated user (security: client cannot spoof another user)
    const payload = { ...event.payload, userId };

    emit(event.eventType as EventType, payload as Parameters<typeof emit>[1]);
    results.accepted++;
  }

  return NextResponse.json(results);
}
