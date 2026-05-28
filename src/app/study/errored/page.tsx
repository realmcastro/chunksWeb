'use client';

import { Suspense, useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, AlertTriangle } from 'lucide-react';
import { ReviewSession } from '@/components/study/ReviewSession';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { useLearningLanguage } from '@/lib/contexts/LearningLanguageContext';
import { logger } from '@/lib/logger';

/*
- /study/errored: review the chunks the user got wrong on their last attempt.
- Source data: /api/review/errored (server-filtered by user_progress.repetitions=0
- AND last_reviewed>0). When empty, shows an explainer card.
*/

interface ErroredChunk {
  id: string;
  chunk: string;
  meaning: string;
  examples: { id: string; sentence: string; translation?: string }[];
  category: { id: string; name: string; level: string };
}

function ErroredContent() {
  const { learningLanguage } = useLearningLanguage();
  const [chunks, setChunks] = useState<ErroredChunk[]>([]);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(false);
  const [sessionComplete, setSessionComplete] = useState(false);
  const [reviewedCount, setReviewedCount] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setAuthError(false);
    fetch(`/api/review/errored?limit=10&language=${learningLanguage}`)
      .then(async (r) => {
        if (r.status === 401) {
          setAuthError(true);
          return null;
        }
        return r.ok ? r.json() : null;
      })
      .then((data) => {
        if (cancelled || !data) return;
        setChunks(data.chunks || []);
      })
      .catch((error) => logger.error('Failed to fetch errored chunks', { error }))
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [learningLanguage]);

  const handleReview = useCallback(async (chunkId: string, quality: number) => {
    const response = await fetch('/api/review/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chunkId: parseInt(chunkId, 10), quality }),
    });
    if (!response.ok) throw new Error('Failed to submit review');
    setReviewedCount((n) => n + 1);
  }, []);

  const handleSkip = useCallback(() => undefined, []);
  const handleComplete = useCallback(() => setSessionComplete(true), []);

  if (loading) {
    return <div className="container py-8 text-center">Loading...</div>;
  }

  if (authError) {
    return (
      <div className="container py-8 max-w-xl mx-auto text-center">
        <p className="mb-4 text-muted-foreground">Log in to review your mistakes.</p>
        <Link href="/login?redirect=/study/errored">
          <Button>Log in</Button>
        </Link>
      </div>
    );
  }

  if (sessionComplete) {
    return (
      <div className="container py-8 max-w-xl mx-auto text-center">
        <h1 className="text-2xl font-bold mb-2">Session complete</h1>
        <p className="text-muted-foreground mb-6">You reviewed {reviewedCount} chunks.</p>
        <Link href="/study">
          <Button variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to study
          </Button>
        </Link>
      </div>
    );
  }

  if (chunks.length === 0) {
    return (
      <div className="container py-8 max-w-xl mx-auto">
        <EmptyState
          icon={AlertTriangle}
          title="No errored chunks right now"
          description="Get some answers wrong in review and they'll show up here for retry."
          action={
            <Link href="/study">
              <Button variant="outline">Back to study</Button>
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <div className="container py-6 sm:py-8 max-w-3xl mx-auto px-4">
      <div className="mb-6 flex items-center gap-3">
        <Link href="/study" className="shrink-0">
          <Button variant="ghost" size="icon" aria-label="Back to study">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            Review mistakes
          </h1>
          <p className="text-muted-foreground text-xs sm:text-sm">
            {chunks.length} chunks you recently got wrong
          </p>
        </div>
      </div>
      <ReviewSession
        chunks={chunks}
        onComplete={handleComplete}
        onSkip={handleSkip}
        onReview={handleReview}
      />
    </div>
  );
}

export default function ErroredStudyPage() {
  return (
    <Suspense fallback={<div className="container py-8 text-center">Loading...</div>}>
      <ErroredContent />
    </Suspense>
  );
}
