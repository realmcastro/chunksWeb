/*
! VAPID keys must be generated once and stored in env vars:
!   npx web-push generate-vapid-keys
!
! Required env vars:
!   NEXT_PUBLIC_VAPID_PUBLIC_KEY  — client-side (subscribing to push)
!   VAPID_PRIVATE_KEY             — server-side only (never expose to client)
!   VAPID_SUBJECT                 — mailto: or https: URL identifying the sender
!
! web-push is a server-only module. Never import this file from 'use client' code.
*/

import webpush from 'web-push';
import {
  getPushSubscriptionsForUser,
  deletePushSubscriptionByEndpoint,
} from '@/lib/db/sqlite';

let initialized = false;

function ensureInitialized(): void {
  if (initialized) return;

  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT ?? 'mailto:admin@olifes.app';

  if (!publicKey || !privateKey) {
    throw new Error(
      'VAPID keys not configured. Run: npx web-push generate-vapid-keys and set NEXT_PUBLIC_VAPID_PUBLIC_KEY + VAPID_PRIVATE_KEY',
    );
  }

  webpush.setVapidDetails(subject, publicKey, privateKey);
  initialized = true;
}

export interface PushPayload {
  title: string;
  body: string;
  url?: string;
  icon?: string;
}

/*
! Sends a push notification to all active subscriptions for a user.
! Stale subscriptions (410 Gone) are removed from the DB automatically.
! Returns the count of successfully delivered notifications.
*/
export async function sendPushToUser(userId: number, payload: PushPayload): Promise<number> {
  ensureInitialized();

  const subscriptions = getPushSubscriptionsForUser(userId);
  if (subscriptions.length === 0) return 0;

  const serialized = JSON.stringify(payload);
  let delivered = 0;

  await Promise.allSettled(
    subscriptions.map(async (sub) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
          },
          serialized,
        );
        delivered++;
      } catch (err) {
        const status = (err as { statusCode?: number }).statusCode;
        if (status === 410 || status === 404) {
          deletePushSubscriptionByEndpoint(sub.endpoint);
        }
      }
    }),
  );

  return delivered;
}
