'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Heart,
  BookOpen,
  Lightbulb,
  Check,
  Loader2,
  RotateCcw,
  Trash2,
  Flag,
} from 'lucide-react';
import { useTranslation } from '@/lib/i18n/I18nProvider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils/cn';
import { logger } from '@/lib/logger';
import { toast, confirmToast } from '@/lib/hooks/useToast';

interface ChunkData {
  id: number;
  chunk_text: string;
  meaning: string;
  category_id: number;
  primary_function: string | null;
  communicative_purpose: string | null;
  pattern: string | null;
  core_structure: string | null;
  nuance: string | null;
  pragmatic_effect: string | null;
  typical_collocates: string | null;
}

interface Example {
  id: number;
  text_en: string;
  text_target: string | null;
}

interface Variation {
  id: number;
  variant: string;
  note: string | null;
}

interface Category {
  id: number;
  name: string;
  color_hex: string | null;
}

interface ProgressSnapshot {
  repetitions: number;
  easeFactor: number;
  interval: number;
  nextReview: number;
  lastReviewed: number;
}

interface ChunkDetailClientProps {
  chunk: ChunkData;
  examples: Example[];
  variations: Variation[];
  category: Category | null;
  isAuthenticated: boolean;
  initialFavorite: boolean;
  initialInStudy: boolean;
  initialProgress: ProgressSnapshot | null;
}

function formatReviewDate(unixSeconds: number): string {
  if (!unixSeconds) return '—';
  const date = new Date(unixSeconds * 1000);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const reviewDay = new Date(date);
  reviewDay.setHours(0, 0, 0, 0);
  const diffDays = Math.round((reviewDay.getTime() - today.getTime()) / 86_400_000);
  if (diffDays === 0) return 'today';
  if (diffDays === 1) return 'tomorrow';
  if (diffDays === -1) return 'yesterday';
  if (diffDays < 0) return `${Math.abs(diffDays)} days overdue`;
  if (diffDays < 30) return `in ${diffDays} days`;
  return date.toLocaleDateString();
}

export function ChunkDetailClient({
  chunk,
  examples,
  variations,
  category,
  isAuthenticated,
  initialFavorite,
  initialInStudy,
  initialProgress,
}: ChunkDetailClientProps) {
  const { t } = useTranslation();
  const [favorite, setFavorite] = useState(initialFavorite);
  const [inStudy, setInStudy] = useState(initialInStudy);
  const [progress, setProgress] = useState<ProgressSnapshot | null>(initialProgress);
  const [favoritePending, setFavoritePending] = useState(false);
  const [studyPending, setStudyPending] = useState(false);
  const [resetPending, setResetPending] = useState(false);
  const [removePending, setRemovePending] = useState(false);
  const [reportSent, setReportSent] = useState(false);
  const [reportPending, setReportPending] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState('');

  /*
  ! Favorite + addToStudy mutations:
  !  - both require an authenticated session (server route returns 401 otherwise)
  !  - UI is optimistic-ish: pending flag disables the button; success/failure flips state from server response
  */
  const handleToggleFavorite = useCallback(async () => {
    if (!isAuthenticated || favoritePending) return;
    setFavoritePending(true);
    const next = !favorite;
    try {
      const response = await fetch('/api/favorites', {
        method: next ? 'POST' : 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chunkId: chunk.id }),
      });
      if (!response.ok) {
        throw new Error(`favorites request failed: ${response.status}`);
      }
      const data = (await response.json()) as { favorite?: boolean };
      const isFav = data.favorite ?? next;
      setFavorite(isFav);
      toast.success(isFav ? t('chunk.favorited') : t('chunk.favorite'));
    } catch (error) {
      logger.error('toggle favorite failed', { chunkId: chunk.id, error });
      toast.error(t('chunk.actionFailed'));
    } finally {
      setFavoritePending(false);
    }
  }, [chunk.id, favorite, favoritePending, isAuthenticated, t]);

  const handleAddToStudy = useCallback(async () => {
    if (!isAuthenticated || studyPending || inStudy) return;
    setStudyPending(true);
    try {
      const response = await fetch('/api/learn/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chunkIds: [chunk.id] }),
      });
      if (!response.ok) {
        throw new Error(`learn/start failed: ${response.status}`);
      }
      setInStudy(true);
      setProgress({
        repetitions: 0,
        easeFactor: 2.5,
        interval: 0,
        nextReview: Math.floor(Date.now() / 1000),
        lastReviewed: 0,
      });
      toast.success(t('chunk.alreadyInStudy'));
    } catch (error) {
      logger.error('add to study failed', { chunkId: chunk.id, error });
      toast.error(t('chunk.actionFailed'));
    } finally {
      setStudyPending(false);
    }
  }, [chunk.id, inStudy, isAuthenticated, studyPending, t]);

  const handleResetProgress = useCallback(async () => {
    if (!isAuthenticated || resetPending || !inStudy) return;
    const confirmed = await confirmToast('Reset SM-2 progress for this chunk?', {
      description: 'It will go back to repetitions=0 and become due immediately.',
      confirmLabel: 'Reset',
      destructive: true,
    });
    if (!confirmed) return;
    setResetPending(true);
    try {
      const response = await fetch('/api/learn/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chunkId: chunk.id }),
      });
      if (!response.ok) throw new Error(`learn/reset failed: ${response.status}`);
      setProgress({
        repetitions: 0,
        easeFactor: 2.5,
        interval: 0,
        nextReview: Math.floor(Date.now() / 1000),
        lastReviewed: 0,
      });
      toast.success('Progress reset.');
    } catch (error) {
      logger.error('reset progress failed', { chunkId: chunk.id, error });
      toast.error('Failed to reset progress.');
    } finally {
      setResetPending(false);
    }
  }, [chunk.id, inStudy, isAuthenticated, resetPending]);

  const handleRemoveFromStudy = useCallback(async () => {
    if (!isAuthenticated || removePending || !inStudy) return;
    const confirmed = await confirmToast('Remove this chunk from your study queue?', {
      description: 'All SM-2 progress for it will be lost.',
      confirmLabel: 'Remove',
      destructive: true,
    });
    if (!confirmed) return;
    setRemovePending(true);
    try {
      const response = await fetch('/api/learn/remove', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chunkId: chunk.id }),
      });
      if (!response.ok) throw new Error(`learn/remove failed: ${response.status}`);
      setInStudy(false);
      setProgress(null);
      toast.success('Chunk removed from study queue.');
    } catch (error) {
      logger.error('remove from study failed', { chunkId: chunk.id, error });
      toast.error('Failed to remove chunk.');
    } finally {
      setRemovePending(false);
    }
  }, [chunk.id, inStudy, isAuthenticated, removePending]);

  const openReport = useCallback(() => {
    if (!isAuthenticated || reportSent) return;
    setReportReason('');
    setReportOpen(true);
  }, [isAuthenticated, reportSent]);

  const cancelReport = useCallback(() => {
    setReportOpen(false);
    setReportReason('');
  }, []);

  const submitReport = useCallback(async () => {
    if (!isAuthenticated || reportPending || reportSent) return;
    const reason = reportReason.trim();
    if (!reason) {
      toast.warning('Describe the issue first.');
      return;
    }
    setReportPending(true);
    try {
      const response = await fetch('/api/chunks/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chunkId: chunk.id, reason }),
      });
      if (!response.ok) throw new Error(`report failed: ${response.status}`);
      setReportSent(true);
      setReportOpen(false);
      setReportReason('');
      toast.success('Report sent. Thanks for the feedback.');
    } catch (error) {
      logger.error('report chunk failed', { chunkId: chunk.id, error });
      toast.error(t('chunk.actionFailed'));
    } finally {
      setReportPending(false);
    }
  }, [chunk.id, isAuthenticated, reportPending, reportSent, reportReason, t]);

  return (
    <div className="container py-8 max-w-4xl">
      {/* Back Link */}
      <Link
        href="/browse"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        {t('chunk.backToChunks')}
      </Link>

      {/* Main Card */}
      <Card variant="elevated" className="mb-8">
        <CardContent className="p-8">
          <div className="flex items-start justify-between gap-4 mb-6">
            <div className="flex-1">
              <h1 className="text-3xl font-bold mb-2">{chunk.chunk_text}</h1>
              {category && (
                <span
                  className="text-sm px-3 py-1 rounded-full"
                  style={{
                    backgroundColor: category.color_hex || '#607d8b',
                    color: 'white',
                  }}
                >
                  {category.name}
                </span>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={handleToggleFavorite}
                disabled={!isAuthenticated || favoritePending}
                aria-pressed={favorite}
                aria-label={favorite ? t('chunk.removeFromFavorites') : t('chunk.favorite')}
              >
                {favoritePending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Heart
                    className={cn('h-4 w-4', favorite && 'fill-red-500 text-red-500')}
                  />
                )}
              </Button>
            </div>
          </div>

          {/* Meaning */}
          <div className="mb-8">
            <h2 className="text-sm font-medium text-muted-foreground mb-2">{t('chunk.meaning')}</h2>
            <p className="text-lg">{chunk.meaning}</p>
          </div>

          {/* Primary Function */}
          {chunk.primary_function && (
            <div className="mb-8">
              <h2 className="text-sm font-medium text-muted-foreground mb-2">
                {t('chunk.primaryFunction')}
              </h2>
              <p>{chunk.primary_function}</p>
            </div>
          )}

          {/* Communicative Purpose */}
          {chunk.communicative_purpose && (
            <div className="mb-8">
              <h2 className="text-sm font-medium text-muted-foreground mb-2">
                {t('chunk.communicativePurpose')}
              </h2>
              <p>{chunk.communicative_purpose}</p>
            </div>
          )}

          {/* Pattern/Structure */}
          {chunk.pattern && (
            <div className="mb-8">
              <h2 className="text-sm font-medium text-muted-foreground mb-2">
                {t('chunk.pattern')}
              </h2>
              <p className="font-mono text-sm bg-muted/50 px-4 py-2 rounded-lg">{chunk.pattern}</p>
            </div>
          )}

          {/* Core Structure */}
          {chunk.core_structure && (
            <div className="mb-8">
              <h2 className="text-sm font-medium text-muted-foreground mb-2">
                {t('chunk.coreStructure')}
              </h2>
              <p className="font-mono text-sm bg-muted/50 px-4 py-2 rounded-lg">
                {chunk.core_structure}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Examples */}
      {examples.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              {t('chunk.examples')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {examples.map((example) => (
              <div key={example.id} className="p-4 rounded-lg bg-secondary/50">
                <p className="text-lg mb-2">{example.text_en}</p>
                {example.text_target && (
                  <p className="text-sm text-muted-foreground">{example.text_target}</p>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Variations */}
      {variations.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>{t('chunk.variations')}</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {variations.map((variation) => (
                <li
                  key={variation.id}
                  className="flex items-center gap-2 p-2 rounded hover:bg-secondary/50"
                >
                  <span className="font-medium">{variation.variant}</span>
                  {variation.note && (
                    <span className="text-sm text-muted-foreground">- {variation.note}</span>
                  )}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Additional Info */}
      {(chunk.nuance || chunk.pragmatic_effect || chunk.typical_collocates) && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5" />
              {t('chunk.additionalInfo')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {chunk.nuance && (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">
                  {t('chunk.nuance')}
                </h3>
                <p>{chunk.nuance}</p>
              </div>
            )}
            {chunk.pragmatic_effect && (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">
                  {t('chunk.pragmaticEffect')}
                </h3>
                <p>{chunk.pragmatic_effect}</p>
              </div>
            )}
            {chunk.typical_collocates && (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">
                  {t('chunk.typicalCollocates')}
                </h3>
                <p>{chunk.typical_collocates}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* SM-2 Progress Indicator */}
      {inStudy && progress && (
        <Card className="mb-4">
          <CardContent className="p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                  Study progress (SM-2)
                </p>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
                  <span>
                    <strong>Reps:</strong> {progress.repetitions}
                  </span>
                  <span>
                    <strong>Ease:</strong> {progress.easeFactor.toFixed(2)}
                  </span>
                  <span>
                    <strong>Interval:</strong> {progress.interval}d
                  </span>
                  <span>
                    <strong>Next:</strong> {formatReviewDate(progress.nextReview)}
                  </span>
                </div>
              </div>
              <div className="flex flex-1 h-2 rounded-full bg-secondary overflow-hidden max-w-[160px]">
                <div
                  className="h-full bg-primary transition-all"
                  style={{ width: `${Math.min((progress.repetitions / 5) * 100, 100)}%` }}
                  aria-label={`${progress.repetitions} of 5 reps`}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      <div className="space-y-2">
        <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
          <Button
            className="flex-1"
            onClick={handleAddToStudy}
            disabled={!isAuthenticated || studyPending || inStudy}
          >
            {studyPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : inStudy ? (
              <Check className="h-4 w-4 mr-2" />
            ) : (
              <BookOpen className="h-4 w-4 mr-2" />
            )}
            {inStudy ? t('chunk.alreadyInStudy') : t('chunk.addToStudy')}
          </Button>
          <Button
            variant="outline"
            onClick={handleToggleFavorite}
            disabled={!isAuthenticated || favoritePending}
            aria-pressed={favorite}
          >
            {favoritePending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Heart
                className={cn('h-4 w-4 mr-2', favorite && 'fill-red-500 text-red-500')}
              />
            )}
            {favorite ? t('chunk.favorited') : t('chunk.favorite')}
          </Button>
        </div>

        {inStudy && isAuthenticated && (
          <div className="flex flex-wrap gap-2 pt-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleResetProgress}
              disabled={resetPending}
            >
              {resetPending ? (
                <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" />
              ) : (
                <RotateCcw className="h-3.5 w-3.5 mr-2" />
              )}
              Reset progress
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRemoveFromStudy}
              disabled={removePending}
              className="text-destructive hover:text-destructive"
            >
              {removePending ? (
                <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" />
              ) : (
                <Trash2 className="h-3.5 w-3.5 mr-2" />
              )}
              Remove from study
            </Button>
          </div>
        )}

        {isAuthenticated && (
          <div className="pt-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={openReport}
              disabled={reportPending || reportSent || reportOpen}
              className="text-muted-foreground"
            >
              <Flag className="h-3.5 w-3.5 mr-2" />
              {reportSent ? 'Report sent' : 'Report an issue'}
            </Button>
          </div>
        )}

        {reportOpen && (
          <Card className="mt-2 border-border">
            <CardContent className="p-4 space-y-3">
              <label htmlFor="chunk-report-reason" className="text-sm font-medium block">
                What's wrong with this chunk?
              </label>
              <textarea
                id="chunk-report-reason"
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value.slice(0, 500))}
                placeholder="Wrong meaning, typo, misleading example, etc."
                rows={3}
                maxLength={500}
                disabled={reportPending}
                className="w-full px-3 py-2 rounded-md border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-60"
              />
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs text-muted-foreground">
                  {reportReason.length} / 500
                </span>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={cancelReport}
                    disabled={reportPending}
                  >
                    Cancel
                  </Button>
                  <Button size="sm" onClick={submitReport} disabled={reportPending || !reportReason.trim()}>
                    {reportPending ? (
                      <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" />
                    ) : (
                      <Flag className="h-3.5 w-3.5 mr-2" />
                    )}
                    Submit report
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {!isAuthenticated && (
          <p className="text-xs text-muted-foreground text-center sm:text-left">
            {t('chunk.loginRequired')}
          </p>
        )}
      </div>
    </div>
  );
}
