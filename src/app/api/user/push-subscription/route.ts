import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getUserIdFromCookie } from '@/lib/auth/session';
import {
  upsertPushSubscription,
  deletePushSubscriptionByEndpoint,
  getPushSubscriptionsForUser,
  upsertNotificationSettings,
  getNotificationSettings,
} from '@/lib/db/sqlite';

const subscribeSchema = z.object({
  endpoint: z.string().url(),
  keys: z.object({
    p256dh: z.string().min(1),
    auth: z.string().min(1),
  }),
});

const settingsSchema = z.object({
  review_reminders: z.boolean().optional(),
  streak_reminders: z.boolean().optional(),
  reminder_time: z.string().regex(/^\d{2}:\d{2}$/).optional(),
});

export async function GET(): Promise<NextResponse> {
  const userId = await getUserIdFromCookie();
  if (!userId) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const subscriptions = getPushSubscriptionsForUser(userId);
  const settings = getNotificationSettings(userId);

  return NextResponse.json({
    subscribed: subscriptions.length > 0,
    settings: settings ?? {
      review_reminders: false,
      streak_reminders: true,
      reminder_time: '20:00',
    },
  });
}

export async function POST(request: Request): Promise<NextResponse> {
  const userId = await getUserIdFromCookie();
  if (!userId) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const body = await request.json();
  const parsed = subscribeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid subscription payload' }, { status: 400 });
  }

  const { endpoint, keys } = parsed.data;
  upsertPushSubscription(userId, endpoint, keys.p256dh, keys.auth);

  const settingsParsed = settingsSchema.safeParse(body.settings ?? {});
  if (settingsParsed.success && Object.keys(settingsParsed.data).length > 0) {
    const s = settingsParsed.data;
    upsertNotificationSettings(userId, {
      ...(s.review_reminders !== undefined && { review_reminders: s.review_reminders ? 1 : 0 }),
      ...(s.streak_reminders !== undefined && { streak_reminders: s.streak_reminders ? 1 : 0 }),
      ...(s.reminder_time !== undefined && { reminder_time: s.reminder_time }),
    });
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request): Promise<NextResponse> {
  const userId = await getUserIdFromCookie();
  if (!userId) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const body = await request.json();
  const parsed = z.object({ endpoint: z.string().url() }).safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid endpoint' }, { status: 400 });
  }

  const subs = getPushSubscriptionsForUser(userId);
  const owns = subs.some((s) => s.endpoint === parsed.data.endpoint);
  if (!owns) return NextResponse.json({ error: 'Subscription not found' }, { status: 404 });

  deletePushSubscriptionByEndpoint(parsed.data.endpoint);
  return NextResponse.json({ ok: true });
}

export async function PATCH(request: Request): Promise<NextResponse> {
  const userId = await getUserIdFromCookie();
  if (!userId) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const body = await request.json();
  const parsed = settingsSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid settings' }, { status: 400 });
  }

  const s = parsed.data;
  const updated = upsertNotificationSettings(userId, {
    ...(s.review_reminders !== undefined && { review_reminders: s.review_reminders ? 1 : 0 }),
    ...(s.streak_reminders !== undefined && { streak_reminders: s.streak_reminders ? 1 : 0 }),
    ...(s.reminder_time !== undefined && { reminder_time: s.reminder_time }),
  });

  return NextResponse.json({ settings: updated });
}
