'use client';

import { useState, useCallback, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { ReviewSession } from '@/components/study/ReviewSession';
import { Button } from '@/components/ui/Button';
import { useLearningLanguage } from '@/lib/contexts/LearningLanguageContext';
import { toast } from '@/lib/hooks/useToast';

/*
! Invariantes, contratos, pré-condições e decisões críticas e riscos.
? Descrição técnica relevante que não seja óbvia pelo nome.

- /study/quick: Client component for quick 5-10 minute review sessions
- Fetches up to 10 chunks via API
- Uses existing ReviewSession component with modified settings
*/
interface QuickChunk {
  id: string;
  chunk: string;
  meaning: string;
  examples: { id: string; sentence: string; translation?: string }[];
  category: { id: string; name: string; level: string };
}

export default function QuickPracticePage() {
  const { learningLanguage } = useLearningLanguage();
  const [chunks, setChunks] = useState<QuickChunk[]>([]);
  const [loading, setLoading] = useState(true);
  const [sessionComplete, setSessionComplete] = useState(false);
  const [reviewedCount, setReviewedCount] = useState(0);

  useEffect(() => {
    fetchQuickChunks();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [learningLanguage]);

  const fetchQuickChunks = async () => {
    try {
      const response = await fetch(`/api/quick/due?limit=10&language=${learningLanguage}`);
      const data = await response.json();
      setChunks(data.chunks || []);
      setSessionComplete(data.chunks?.length === 0);
    } catch (error) {
      console.error('Failed to fetch quick practice chunks:', error);
      toast.error('Failed to load practice chunks', { description: 'Check your connection and try again.' });
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = useCallback(() => {
    setSessionComplete(true);
  }, []);

  const handleSkip = useCallback((chunkId: string) => {
    console.log('Skipped chunk:', chunkId);
  }, []);

  const handleReview = useCallback(async (chunkId: string, quality: number) => {
    try {
      const response = await fetch('/api/review/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chunkId: parseInt(chunkId, 10),
          quality,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit review');
      }

      const result = await response.json();
      setReviewedCount((prev) => prev + 1);
      console.log('Review submitted:', result);
    } catch (error) {
      console.error('Failed to submit review:', error);
      toast.error('Review not saved', { description: 'Could not submit your answer. Try again.' });
      throw error;
    }
  }, []);

  if (loading) {
    return (
      <div className="container py-8 max-w-2xl mx-auto text-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (sessionComplete) {
    return (
      <div className="container py-8 max-w-2xl mx-auto text-center">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight mb-2">Quick Practice Complete!</h1>
          <p className="text-muted-foreground">
            {reviewedCount > 0
              ? `You reviewed ${reviewedCount} chunk${reviewedCount > 1 ? 's' : ''} in this session.`
              : 'No chunks to practice right now.'}
          </p>
        </div>
        <div className="space-y-4">
          <p className="text-muted-foreground">
            {reviewedCount > 0
              ? 'Great job keeping your memory fresh!'
              : 'Check back later when you have chunks due for review.'}
          </p>
          <div className="flex justify-center gap-4">
            <Link href="/study">
              <Button variant="outline">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Study
              </Button>
            </Link>
            <Link href="/progress">
              <Button>View Progress</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8 max-w-3xl mx-auto">
      <div className="mb-8 flex items-center gap-4">
        <Link href="/study">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Quick Practice</h1>
          <p className="text-muted-foreground text-sm">
            {chunks.length} chunks - Keep your memory fresh!
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
