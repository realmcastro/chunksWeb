'use client';

import { useEffect, useState } from 'react';
import { Bell, X } from 'lucide-react';
import { toast } from '@/lib/hooks/useToast';

/*
? Shows a one-time banner prompting the user to enable push notifications.
? Dismissed state persisted in localStorage so it never shows again after dismiss.
? Hidden when: permission already granted/denied, or user previously dismissed.
? iOS Safari < 16.4 doesn't support push in PWA — banner hidden on those browsers.
*/

function isPushSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  );
}

async function subscribeUser(): Promise<void> {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  if (!publicKey) throw new Error('VAPID public key not configured');

  const reg = await navigator.serviceWorker.ready;
  const subscription = await reg.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(publicKey),
  });

  const sub = subscription.toJSON();
  await fetch('/api/user/push-subscription', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      endpoint: sub.endpoint,
      keys: sub.keys,
      settings: { streak_reminders: true, review_reminders: false },
    }),
  });
}

function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  return new Uint8Array(Array.from(rawData).map((c) => c.charCodeAt(0)));
}

const DISMISSED_KEY = 'push-banner-dismissed';

export function PushPermissionBanner() {
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isPushSupported()) return;
    if (Notification.permission !== 'default') return;
    if (localStorage.getItem(DISMISSED_KEY)) return;
    setVisible(true);
  }, []);

  const handleEnable = async () => {
    setLoading(true);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        setVisible(false);
        return;
      }
      await subscribeUser();
      toast.success('Notifications enabled', {
        description: "We'll remind you when your streak is at risk.",
      });
      setVisible(false);
    } catch {
      toast.error('Could not enable notifications');
    } finally {
      setLoading(false);
    }
  };

  const handleDismiss = () => {
    localStorage.setItem(DISMISSED_KEY, '1');
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      role="banner"
      className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-4 py-3 rounded-xl bg-surface border border-border shadow-lg max-w-sm w-[calc(100%-2rem)]"
    >
      <Bell className="h-5 w-5 text-primary shrink-0" />
      <p className="text-sm text-foreground flex-1">
        Enable reminders to protect your streak.
      </p>
      <button
        onClick={handleEnable}
        disabled={loading}
        className="text-sm font-medium text-primary hover:underline disabled:opacity-50 shrink-0"
        aria-label="Enable push notifications"
      >
        {loading ? 'Enabling…' : 'Enable'}
      </button>
      <button
        onClick={handleDismiss}
        className="text-muted-foreground hover:text-foreground shrink-0"
        aria-label="Dismiss notification prompt"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
