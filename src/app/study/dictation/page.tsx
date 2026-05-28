'use client';

import { Suspense, useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Headphones, Volume2, Send } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { useLearningLanguage } from '@/lib/contexts/LearningLanguageContext';
import { useTTSPlaybackClient } from '@/lib/pronunciation/hooks/useTTSPlaybackClient';
import { gradeAnswer, similarity, type MatchGrade } from '@/lib/study/fuzzyMatch';
import { logger } from '@/lib/logger';
import type { Locale } from '@/lib/pronunciation/types';

/*
- /study/dictation — TTS-driven dictation.
- 1. Server returns random chunks (reuses /api/chunks/random).
- 2. UI hides the chunk text; user clicks "Play" to hear it spoken via TTS.
- 3. User types what they heard; gradeAnswer() returns correct / close / miss.
- 4. SM-2 quality is derived: correct=5, close=3, miss=1 → POST /api/review/submit
-    when the chunk is already in study queue (otherwise the grade is local-only).
*/

interface DictationChunk {
  id: string;
  chunk: string;
  meaning: string;
  category: { id: string; name: string; level: string };
}

function localeFor(language: string): Locale {
  if (language === 'fr') return 'fr-FR';
  if (language === 'es') return 'es-ES';
  if (language === 'de') return 'de-DE';
  return 'en-US';
}

function gradeToQuality(grade: MatchGrade): number {
  if (grade === 'correct') return 5;
  if (grade === 'close') return 3;
  return 1;
}

function DictationContent() {
  const { learningLanguage } = useLearningLanguage();
  const locale = localeFor(learningLanguage);
  const tts = useTTSPlaybackClient({ locale });

  const [chunks, setChunks] = useState<DictationChunk[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answer, setAnswer] = useState('');
  const [grade, setGrade] = useState<MatchGrade | null>(null);
  const [score, setScore] = useState<number | null>(null);
  const [stats, setStats] = useState({ correct: 0, close: 0, miss: 0 });
  const [done, setDone] = useState(false);

  const current = chunks[currentIndex];

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch(`/api/chunks/random?limit=10&language=${learningLanguage}`)
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        setChunks(data.chunks || []);
      })
      .catch((error) => logger.error('Failed to fetch dictation chunks', { error }))
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [learningLanguage]);

  const playCurrent = useCallback(() => {
    if (!current) return;
    tts.speak(current.chunk);
  }, [current, tts]);

  // Auto-play first chunk once loaded
  useEffect(() => {
    if (!loading && current && grade === null && tts.isSupported) {
      const timer = window.setTimeout(() => {
        tts.speak(current.chunk);
      }, 300);
      return () => window.clearTimeout(timer);
    }
    return undefined;
  }, [current?.id, loading, grade, tts]);

  const handleSubmit = useCallback(async () => {
    if (!current || grade !== null) return;
    const result = gradeAnswer(current.chunk, answer);
    const computed = Math.round(similarity(current.chunk, answer) * 100);
    setGrade(result);
    setScore(computed);
    setStats((s) => ({
      ...s,
      correct: s.correct + (result === 'correct' ? 1 : 0),
      close: s.close + (result === 'close' ? 1 : 0),
      miss: s.miss + (result === 'miss' ? 1 : 0),
    }));

    // Push to SM-2 if chunk is already being studied; ignore 400 (not in queue)
    try {
      await fetch('/api/review/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chunkId: parseInt(current.id, 10),
          quality: gradeToQuality(result),
        }),
      });
    } catch (error) {
      logger.warn('dictation review submit failed (non-fatal)', { error });
    }
  }, [answer, current, grade]);

  const handleNext = useCallback(() => {
    setAnswer('');
    setGrade(null);
    setScore(null);
    if (currentIndex >= chunks.length - 1) {
      setDone(true);
      return;
    }
    setCurrentIndex((i) => i + 1);
  }, [chunks.length, currentIndex]);

  if (loading) return <div className="container py-8 text-center">Loading...</div>;

  if (done || chunks.length === 0) {
    return (
      <div className="container py-8 max-w-xl mx-auto text-center">
        <h1 className="text-2xl font-bold mb-2">Dictation complete</h1>
        <p className="text-muted-foreground mb-1">
          {stats.correct} correct · {stats.close} close · {stats.miss} missed
        </p>
        <div className="mt-6 flex justify-center gap-2">
          <Link href="/study">
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to study
            </Button>
          </Link>
          <Link href="/study/dictation">
            <Button>
              <Headphones className="h-4 w-4 mr-2" />
              Another round
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  if (!current) return null;

  return (
    <div className="container py-6 sm:py-8 max-w-2xl mx-auto px-4">
      <div className="mb-6 flex items-center gap-3">
        <Link href="/study" className="shrink-0">
          <Button variant="ghost" size="icon" aria-label="Back to study">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight flex items-center gap-2">
            <Headphones className="h-5 w-5" />
            Dictation
          </h1>
          <p className="text-muted-foreground text-xs sm:text-sm">
            {currentIndex + 1} of {chunks.length} · listen and type what you hear
          </p>
        </div>
      </div>

      {!tts.isSupported && (
        <Card className="mb-4 border-orange-500/40">
          <CardContent className="p-4 text-sm text-orange-500">
            Text-to-speech is not supported in this browser. Dictation needs the Web Speech
            Synthesis API.
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-6 sm:p-8 space-y-4">
          <div className="flex justify-center">
            <Button onClick={playCurrent} variant="outline" size="lg" disabled={!tts.isSupported}>
              <Volume2 className="h-5 w-5 mr-2" />
              Play again
            </Button>
          </div>

          <label htmlFor="dictation-input" className="text-sm font-medium block">
            Your answer
          </label>
          <textarea
            id="dictation-input"
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey && grade === null) {
                e.preventDefault();
                handleSubmit();
              }
            }}
            placeholder="Type what you heard…"
            rows={2}
            disabled={grade !== null}
            className="w-full px-3 py-2 rounded-md border border-border bg-background text-base focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-60"
          />

          {grade === null ? (
            <Button onClick={handleSubmit} className="w-full" disabled={!answer.trim()}>
              <Send className="h-4 w-4 mr-2" />
              Submit
            </Button>
          ) : (
            <div className="space-y-3">
              <div
                className={
                  grade === 'correct'
                    ? 'p-3 rounded-md bg-green-500/10 text-green-600 dark:text-green-400'
                    : grade === 'close'
                      ? 'p-3 rounded-md bg-yellow-500/10 text-yellow-600 dark:text-yellow-400'
                      : 'p-3 rounded-md bg-red-500/10 text-red-600 dark:text-red-400'
                }
              >
                <p className="font-semibold">
                  {grade === 'correct'
                    ? 'Correct!'
                    : grade === 'close'
                      ? 'Close — small differences'
                      : 'Missed'}{' '}
                  ({score}% match)
                </p>
                <p className="text-sm mt-1">
                  Expected: <span className="font-mono">{current.chunk}</span>
                </p>
                <p className="text-sm">
                  Meaning: <span className="italic">{current.meaning}</span>
                </p>
              </div>
              <Button onClick={handleNext} className="w-full">
                Next
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="mt-4 text-xs text-muted-foreground text-center">
        <kbd className="px-1.5 py-0.5 rounded border border-border text-xs">Enter</kbd> submits
      </div>
    </div>
  );
}

export default function DictationPage() {
  return (
    <Suspense fallback={<div className="container py-8 text-center">Loading...</div>}>
      <DictationContent />
    </Suspense>
  );
}
