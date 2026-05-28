'use client';

import { useEffect } from 'react';
import { logger } from '@/lib/logger';

/*
! Root-level error boundary that catches errors in the root layout itself.
! Must define its own <html> and <body> because layout.tsx failed to render.
! Pairs with app/error.tsx (which catches errors in nested segments below the
! root layout but cannot recover when the layout itself throws).
*/

interface GlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    logger.error('Global error boundary triggered', {
      digest: error.digest,
      message: error.message,
    });
  }, [error]);

  return (
    <html lang="en">
      <body className="min-h-screen antialiased">
        <div role="alert" className="mx-auto max-w-xl py-16 px-4 text-center space-y-4">
          <h1 className="text-3xl font-bold">Application crashed</h1>
          <p className="text-sm text-muted-foreground">
            A fatal error prevented the app from rendering.
            {error.digest ? ` Reference: ${error.digest}.` : ''}
          </p>
          <button
            onClick={reset}
            className="px-4 py-2 rounded-md bg-primary text-primary-foreground hover:opacity-90"
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
