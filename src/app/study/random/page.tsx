'use client';

import { Suspense, useState, useCallback, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ArrowLeft, Dices, Flame } from 'lucide-react';
import { ReviewSession } from '@/components/study/ReviewSession';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { useTranslation } from '@/lib/i18n/I18nProvider';
import { useLearningLanguage } from '@/lib/contexts/LearningLanguageContext';
import { logger } from '@/lib/logger';

/*
! Invariantes, contratos, pré-condições e decisões críticas e riscos.
? Descrição técnica relevante que não seja óbvia pelo nome.

- /study/random: Random study session with progress tracking
- Accepts categoryId as query param for category-filtered random
- Records session on completion for streak tracking
*/
interface RandomChunk {
  id: string;
  chunk: string;
  meaning: string;
  examples: { id: string; sentence: string; translation?: string }[];
  category: { id: string; name: string; level: string };
}

function RandomStudyContent() {
  const { t } = useTranslation();
  const { learningLanguage } = useLearningLanguage();
  const searchParams = useSearchParams();
  const categoryId = searchParams.get('categoryId');
  const categoryName = searchParams.get('categoryName');
  const source = searchParams.get('source');
  const isFavoritesSource = source === 'favorites';

  const [chunks, setChunks] = useState<RandomChunk[]>([]);
  const [chunkIds, setChunkIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [rolling, setRolling] = useState(true);
  const [sessionComplete, setSessionComplete] = useState(false);
  const [reviewedCount, setReviewedCount] = useState(0);
  const [masteredCount, setMasteredCount] = useState(0);
  const [streak, setStreak] = useState(0);

  useEffect(() => {
    fetchRandomChunks();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [learningLanguage]);

  const fetchRandomChunks = async () => {
    setRolling(true);
    setLoading(true);

    try {
      const params = new URLSearchParams({ limit: '10', language: learningLanguage });
      if (categoryId) params.set('categoryId', categoryId);
      if (isFavoritesSource) params.set('source', 'favorites');
      const url = `/api/chunks/random?${params.toString()}`;

      const response = await fetch(url);
      const data = await response.json();

      await new Promise((resolve) => setTimeout(resolve, 1500));

      if (data.error === 'grammar_category') {
        window.location.href = `/grammar?category=${categoryId}`;
        return;
      }

      if (data.error === 'no_favorites') {
        setChunkIds([]);
        setChunks([]);
        return;
      }

      const ids = (data.chunks || []).map((c: RandomChunk) => parseInt(c.id, 10));
      setChunkIds(ids);
      setChunks(data.chunks || []);
    } catch (error) {
      logger.error('Failed to fetch random chunks', {
        error,
        categoryId,
        learningLanguage,
        source,
      });
    } finally {
      setRolling(false);
      setLoading(false);
    }
  };

  const handleComplete = useCallback(async () => {
    setSessionComplete(true);

    // Record session for streak tracking with chunk IDs for later retrieval
    try {
      await fetch('/api/session/end', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'random',
          chunksReviewed: reviewedCount,
          chunksMastered: masteredCount,
          chunkIds,
        }),
      });
    } catch (error) {
      logger.error('Failed to record session', { error, reviewedCount, masteredCount });
    }
  }, [reviewedCount, masteredCount, chunkIds]);

  const handleSkip = useCallback(() => {
    setStreak(0);
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

      const result = (await response.json()) as { isMastered?: boolean };
      setReviewedCount((prev) => prev + 1);

      if (quality >= 3) {
        setStreak((prev) => prev + 1);
        if (result.isMastered) {
          setMasteredCount((prev) => prev + 1);
        }
      } else {
        setStreak(0);
      }
    } catch (error) {
      logger.error('Failed to submit review', { error });
      throw error;
    }
  }, []);

  if (loading || rolling) {
    return (
      <div className="container py-8 max-w-2xl mx-auto text-center">
        <div className="mb-8 flex items-center gap-4">
          <Link href="/study">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              {categoryName
                ? `${t('learn.randomFrom', { category: categoryName })}`
                : t('study.randomMode')}
            </h1>
          </div>
        </div>

        <Card>
          <CardContent className="p-12">
            <div className="flex flex-col items-center gap-6">
              <div className="relative">
                <Dices className="h-20 w-20 text-primary animate-pulse" />
                <div className="absolute -top-2 -right-2 flex gap-1">
                  <span className="text-xl animate-bounce" style={{ animationDelay: '0ms' }}>
                    🎲
                  </span>
                  <span className="text-xl animate-bounce" style={{ animationDelay: '150ms' }}>
                    🎲
                  </span>
                  <span className="text-xl animate-bounce" style={{ animationDelay: '300ms' }}>
                    🎲
                  </span>
                </div>
              </div>
              <h2 className="text-2xl font-bold">{t('study.rollingTheDice')}</h2>
              <p className="text-muted-foreground">{t('study.selectingRandomChunks')}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (sessionComplete) {
    return (
      <div className="container py-8 max-w-2xl mx-auto text-center">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight mb-2">{t('study.sessionComplete')}</h1>
          <p className="text-muted-foreground">
            {reviewedCount > 0
              ? `${t('study.youReviewed')} ${reviewedCount} ${t('study.chunksWithMaxStreak')} ${streak}!`
              : t('study.noChunksAvailableCategory')}
          </p>
          {masteredCount > 0 && (
            <p className="text-sm text-muted-foreground mt-1">
              {masteredCount} chunk{masteredCount > 1 ? 's' : ''} {t('study.masteredExclamation')}
            </p>
          )}
        </div>
        <div className="space-y-4">
          <div className="flex justify-center gap-4">
            <Link href="/study">
              <Button variant="outline">
                <ArrowLeft className="mr-2 h-4 w-4" />
                {t('buttons.back')}
              </Button>
            </Link>
            <Link href="/study/random">
              <Button>
                <Dices className="mr-2 h-4 w-4" />
                {t('buttons.rollTheDice')}
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-6 sm:py-8 max-w-3xl mx-auto px-4">
      <div className="mb-6 sm:mb-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3 sm:gap-4 min-w-0">
          <Link href="/study" className="shrink-0">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight truncate">
              {isFavoritesSource
                ? 'Study favorites'
                : categoryName
                  ? `${t('learn.randomFrom', { category: categoryName })}`
                  : t('study.randomMode')}
            </h1>
            <p className="text-muted-foreground text-xs sm:text-sm">10 {t('study.randomCards')}</p>
          </div>
        </div>

        {streak > 0 && (
          <div className="flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 bg-orange-500/10 rounded-full self-start sm:self-auto">
            <Flame className="h-4 w-4 sm:h-5 sm:w-5 text-orange-500" />
            <span className="font-bold text-sm sm:text-base text-orange-500">{streak} streak!</span>
          </div>
        )}
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

function RandomStudyLoading() {
  return (
    <div className="container py-8 max-w-2xl mx-auto text-center">
      <div className="mb-8 flex items-center gap-4">
        <Link href="/study">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Loading...</h1>
        </div>
      </div>
      <Card>
        <CardContent className="p-12">
          <div className="flex flex-col items-center gap-6">
            <div className="relative">
              <Dices className="h-20 w-20 text-primary animate-pulse" />
            </div>
            <h2 className="text-2xl font-bold">Loading...</h2>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function RandomStudyPage() {
  return (
    <Suspense fallback={<RandomStudyLoading />}>
      <RandomStudyContent />
    </Suspense>
  );
}
