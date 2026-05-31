'use client';

import { useEffect, useState, useCallback } from 'react';
import { Bell, BellOff, Send } from 'lucide-react';
import { toast } from '@/lib/hooks/useToast';

interface NotifSettings {
  review_reminders: boolean;
  streak_reminders: boolean;
  reminder_time: string;
}

interface ApiState {
  subscribed: boolean;
  settings: NotifSettings;
}

function isPushSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  );
}

function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  return new Uint8Array(Array.from(rawData).map((c) => c.charCodeAt(0)));
}

export default function NotificationsSettingsPage() {
  const [supported, setSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [state, setState] = useState<ApiState | null>(null);
  const [saving, setSaving] = useState(false);
  const [testLoading, setTestLoading] = useState(false);

  useEffect(() => {
    setSupported(isPushSupported());
    if ('Notification' in window) setPermission(Notification.permission);
  }, []);

  useEffect(() => {
    if (!supported) return;
    fetch('/api/user/push-subscription')
      .then((r) => r.json())
      .then((data: ApiState) => setState(data))
      .catch(() => {});
  }, [supported]);

  const subscribe = useCallback(async () => {
    const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    if (!publicKey) {
      toast.error('Push not configured');
      return;
    }
    setSaving(true);
    try {
      const perm = await Notification.requestPermission();
      setPermission(perm);
      if (perm !== 'granted') {
        toast.warning('Permission denied — enable in browser settings to receive notifications');
        return;
      }
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });
      const json = sub.toJSON();
      await fetch('/api/user/push-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          endpoint: json.endpoint,
          keys: json.keys,
          settings: state?.settings ?? {},
        }),
      });
      setState((prev) => (prev ? { ...prev, subscribed: true } : null));
      toast.success('Notifications enabled');
    } catch {
      toast.error('Failed to enable notifications');
    } finally {
      setSaving(false);
    }
  }, [state]);

  const unsubscribe = useCallback(async () => {
    setSaving(true);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await fetch('/api/user/push-subscription', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ endpoint: sub.endpoint }),
        });
        await sub.unsubscribe();
      }
      setState((prev) => (prev ? { ...prev, subscribed: false } : null));
      toast.success('Notifications disabled');
    } catch {
      toast.error('Failed to disable notifications');
    } finally {
      setSaving(false);
    }
  }, []);

  const saveSettings = useCallback(
    async (patch: Partial<NotifSettings>) => {
      if (!state) return;
      setSaving(true);
      try {
        const res = await fetch('/api/user/push-subscription', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(patch),
        });
        const data = await res.json();
        setState((prev) => (prev ? { ...prev, settings: data.settings } : null));
      } catch {
        toast.error('Failed to save settings');
      } finally {
        setSaving(false);
      }
    },
    [state],
  );

  const sendTest = useCallback(async () => {
    setTestLoading(true);
    try {
      const reg = await navigator.serviceWorker.ready;
      await reg.showNotification("OLife'S Test", {
        body: 'Notifications are working correctly.',
        icon: '/icons/icon.svg',
      });
    } catch {
      toast.error('Could not send test notification');
    } finally {
      setTestLoading(false);
    }
  }, []);

  if (!supported) {
    return (
      <div className="max-w-lg mx-auto p-6">
        <h1 className="text-xl font-semibold mb-4">Notifications</h1>
        <p className="text-muted-foreground text-sm">
          Push notifications are not supported in this browser. Install the app as a PWA on iOS
          Safari 16.4+ or on a Chromium-based browser to enable them.
        </p>
      </div>
    );
  }

  const settings = state?.settings;

  return (
    <div className="max-w-lg mx-auto p-6 space-y-8">
      <h1 className="text-xl font-semibold">Notifications</h1>

      {/* Subscribe / unsubscribe */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium text-sm">Push notifications</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {permission === 'denied'
                ? 'Blocked in browser — enable in site settings'
                : state?.subscribed
                  ? 'Active on this device'
                  : 'Not active on this device'}
            </p>
          </div>
          {state?.subscribed ? (
            <button
              onClick={unsubscribe}
              disabled={saving}
              className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-md border border-border hover:bg-muted disabled:opacity-50"
              aria-label="Disable push notifications"
            >
              <BellOff className="h-4 w-4" />
              Disable
            </button>
          ) : (
            <button
              onClick={subscribe}
              disabled={saving || permission === 'denied'}
              className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              aria-label="Enable push notifications"
            >
              <Bell className="h-4 w-4" />
              Enable
            </button>
          )}
        </div>

        {state?.subscribed && (
          <button
            onClick={sendTest}
            disabled={testLoading}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground disabled:opacity-50"
            aria-label="Send test notification"
          >
            <Send className="h-3.5 w-3.5" />
            {testLoading ? 'Sending…' : 'Send test notification'}
          </button>
        )}
      </section>

      {/* Settings — only show when subscribed */}
      {state?.subscribed && settings && (
        <section className="space-y-4 border-t border-border pt-6">
          <p className="text-sm font-medium">What to notify</p>

          <label className="flex items-center justify-between cursor-pointer">
            <div>
              <span className="text-sm">Review reminders</span>
              <p className="text-xs text-muted-foreground">When you have chunks due for review</p>
            </div>
            <input
              type="checkbox"
              checked={settings.review_reminders}
              onChange={(e) => saveSettings({ review_reminders: e.target.checked })}
              disabled={saving}
              className="h-4 w-4 accent-primary"
              aria-label="Enable review reminders"
            />
          </label>

          <label className="flex items-center justify-between cursor-pointer">
            <div>
              <span className="text-sm">Streak save</span>
              <p className="text-xs text-muted-foreground">
                When your streak is at risk (no study today)
              </p>
            </div>
            <input
              type="checkbox"
              checked={settings.streak_reminders}
              onChange={(e) => saveSettings({ streak_reminders: e.target.checked })}
              disabled={saving}
              className="h-4 w-4 accent-primary"
              aria-label="Enable streak reminders"
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-sm">Reminder time</span>
            <p className="text-xs text-muted-foreground">Your local time for daily reminders</p>
            <input
              type="time"
              value={settings.reminder_time}
              onChange={(e) => saveSettings({ reminder_time: e.target.value })}
              disabled={saving}
              className="w-32 mt-1 px-2 py-1 text-sm rounded-md border border-border bg-background"
              aria-label="Reminder time"
            />
          </label>
        </section>
      )}
    </div>
  );
}
