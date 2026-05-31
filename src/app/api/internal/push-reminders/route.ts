/*
! Internal route — called by an external cron (GitHub Actions, EasyCron, etc.).
! Auth: Bearer token via INTERNAL_API_SECRET env var.
! Never expose INTERNAL_API_SECRET to the client bundle.
!
! Cron setup example (GitHub Actions):
!   - run: curl -X POST https://yourapp.com/api/internal/push-reminders
!            -H "Authorization: Bearer ${{ secrets.INTERNAL_API_SECRET }}"
!
! type param:
!   review  — sends to users with due review chunks + review_reminders=1
!   streak  — sends to users with active streak who haven't studied today + streak_reminders=1
*/

import { NextResponse } from 'next/server';
import { getUsersWithDueReviews, getUsersNeedingStreakSave } from '@/lib/db/sqlite';
import { sendPushToUser } from '@/lib/push';
import { logger } from '@/lib/logger';

function isAuthorized(request: Request): boolean {
  const secret = process.env.INTERNAL_API_SECRET;
  if (!secret) return false;
  const auth = request.headers.get('Authorization');
  return auth === `Bearer ${secret}`;
}

export async function POST(request: Request): Promise<NextResponse> {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type') ?? 'review';

  if (type !== 'review' && type !== 'streak') {
    return NextResponse.json({ error: 'type must be review or streak' }, { status: 400 });
  }

  try {
    if (type === 'review') {
      const targets = getUsersWithDueReviews();
      let sent = 0;
      for (const { user_id } of targets) {
        const count = await sendPushToUser(user_id, {
          title: 'Review time!',
          body: 'You have chunks due for review. Keep your streak going!',
          url: '/study/review',
        });
        sent += count;
      }
      logger.info('push-reminders:review sent', { targets: targets.length, notifications: sent });
      return NextResponse.json({ ok: true, targets: targets.length, notifications: sent });
    }

    const targets = getUsersNeedingStreakSave();
    let sent = 0;
    for (const { user_id } of targets) {
      const count = await sendPushToUser(user_id, {
        title: "Don't lose your streak!",
        body: 'Study at least one chunk today to keep your streak alive.',
        url: '/study',
      });
      sent += count;
    }
    logger.info('push-reminders:streak sent', { targets: targets.length, notifications: sent });
    return NextResponse.json({ ok: true, targets: targets.length, notifications: sent });
  } catch (err) {
    logger.error('push-reminders failed', { type, error: err });
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
