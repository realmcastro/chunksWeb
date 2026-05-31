'use client';

import { useEffect, useState } from 'react';
import { WifiOff, RefreshCw } from 'lucide-react';
import { getOfflineDB } from '@/lib/offline/db';
import { toast } from '@/lib/hooks/useToast';

/*
? Reads navigator.onLine and re-renders on online/offline events.
? Pending count loaded on mount + updated via custom DOM events:
?   offline-mutation-queued  → increment by 1
?   offline-sync-complete    → decrement by flushed count + show toast
? Initial value is true to avoid hydration mismatch.
*/
export function OfflineIndicator() {
  const [online, setOnline] = useState(true);
  const [pending, setPending] = useState(0);

  useEffect(() => {
    setOnline(navigator.onLine);

    getOfflineDB()
      ?.mutationQueue.count()
      .then(setPending)
      .catch(() => {});

    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);
    const handleQueued = () => setPending((n) => n + 1);
    const handleSynced = (e: Event) => {
      const { flushed } = (e as CustomEvent<{ flushed: number }>).detail;
      setPending((n) => Math.max(0, n - flushed));
      toast.success(`${flushed} change${flushed > 1 ? 's' : ''} synced`);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('offline-mutation-queued', handleQueued);
    window.addEventListener('offline-sync-complete', handleSynced);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('offline-mutation-queued', handleQueued);
      window.removeEventListener('offline-sync-complete', handleSynced);
    };
  }, []);

  if (online && !pending) return null;

  if (online && pending) {
    return (
      <span
        role="status"
        aria-live="polite"
        className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-blue-500/10 text-blue-500 text-xs font-medium"
        title={`${pending} change${pending > 1 ? 's' : ''} pending sync`}
      >
        <RefreshCw className="h-3.5 w-3.5 animate-spin" />
        Syncing {pending}
      </span>
    );
  }

  return (
    <span
      role="status"
      aria-live="polite"
      className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-orange-500/10 text-orange-500 text-xs font-medium"
      title={
        pending
          ? `Offline · ${pending} change${pending > 1 ? 's' : ''} pending`
          : 'You are offline. Changes will sync when you reconnect.'
      }
    >
      <WifiOff className="h-3.5 w-3.5" />
      Offline{pending ? ` · ${pending}` : ''}
    </span>
  );
}
