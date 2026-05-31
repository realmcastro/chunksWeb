/*
! Custom service worker code — merged into the Workbox-generated sw.js by next-pwa on build.
! This file handles Web Push events and notification click routing.
!
! next-pwa v5 merges this file (worker/index.ts) automatically during `next build`.
! In development the SW is disabled (see next.config.js), so changes here only
! take effect after a production build.
*/

declare const self: ServiceWorkerGlobalScope;

interface PushPayload {
  title: string;
  body: string;
  url?: string;
  icon?: string;
}

self.addEventListener('push', (event: PushEvent) => {
  if (!event.data) return;

  let payload: PushPayload;
  try {
    payload = event.data.json() as PushPayload;
  } catch {
    payload = { title: "OLife'S", body: event.data.text() };
  }

  event.waitUntil(
    self.registration.showNotification(payload.title, {
      body: payload.body,
      icon: payload.icon ?? '/icons/icon.svg',
      badge: '/icons/icon.svg',
      data: { url: payload.url ?? '/' },
      tag: 'olifes-reminder',
      renotify: true,
    }),
  );
});

self.addEventListener('notificationclick', (event: NotificationEvent) => {
  event.notification.close();

  const url: string = (event.notification.data as { url?: string }).url ?? '/';

  event.waitUntil(
    self.clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((windowClients) => {
        const existing = windowClients.find(
          (client) => client.url === url || client.url.startsWith(self.location.origin),
        );
        if (existing) {
          return existing.focus().then((c) => c.navigate(url));
        }
        return self.clients.openWindow(url);
      }),
  );
});
