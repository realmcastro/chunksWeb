'use client';

import { useEffect, useState } from 'react';
import { WifiOff } from 'lucide-react';

/*
? Reads navigator.onLine and re-renders on online/offline events.
? Initial value is true to avoid hydration mismatch (server-side has no navigator).
*/
export function OfflineIndicator() {
  const [online, setOnline] = useState(true);

  useEffect(() => {
    setOnline(navigator.onLine);
    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (online) return null;

  return (
    <span
      role="status"
      aria-live="polite"
      className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-orange-500/10 text-orange-500 text-xs font-medium"
      title="You are offline. Changes will sync when you reconnect."
    >
      <WifiOff className="h-3.5 w-3.5" />
      Offline
    </span>
  );
}
