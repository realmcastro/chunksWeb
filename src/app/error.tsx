'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { logger } from '@/lib/logger';

/*
! Next.js App Router segment-level error boundary.
! Catches errors thrown in nested server components or during data fetching
! for any route under the root layout (when no closer error.tsx exists).
! Must be a Client Component; receives a `reset` callback to retry the segment.
*/

interface RootErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function RootError({ error, reset }: RootErrorProps) {
  useEffect(() => {
    logger.error('App router error boundary triggered', {
      digest: error.digest,
      message: error.message,
    });
  }, [error]);

  return (
    <div role="alert" className="mx-auto max-w-xl py-16 text-center space-y-4">
      <h1 className="text-3xl font-bold">Something went wrong</h1>
      <p className="text-muted-foreground text-sm">
        An unexpected error occurred while rendering this page.
        {error.digest ? ` Reference: ${error.digest}.` : ''}
      </p>
      <div className="flex justify-center gap-2 pt-2">
        <Button onClick={reset}>Try again</Button>
        <Link href="/">
          <Button variant="outline">Home</Button>
        </Link>
      </div>
    </div>
  );
}
