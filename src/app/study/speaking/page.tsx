'use client';

import { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Mic, MicOff, Volume2, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { useLearningLanguage } from '@/lib/contexts/LearningLanguageContext';
import { useTTSPlaybackClient } from '@/lib/pronunciation/hooks/useTTSPlaybackClient';
import { gradeAnswer, similarity, type MatchGrade } from '@/lib/study/fuzzyMatch';
import {
  getSpeechRecognitionCtor,
  isSpeechRecognitionSupported,
  type SpeechRecognitionInstance,
} from '@/lib/study/speechRecognition';
import { logger } from '@/lib/logger';
import { toast } from '@/lib/hooks/useToast';
import type { Locale } from '@/lib/pronunciation/types';

/*
- /study/speaking — pronunciation practice.
- Flow: show chunk text → user taps mic → SpeechRecognition transcribes →
- fuzzy match against expected text. Grade feeds SM-2 (best-effort).
-
- Limitations:
- - Web Speech API quality varies by browser/locale.
- - No phoneme-level diff (would need IPA compare against recognised phonemes,
-   which the engine does not expose). Roadmap item.
*/

interface SpeakingChunk {
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

function recognitionLangFor(language: string): string {
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

function SpeakingContent() {
  const { learningLanguage } = useLearningLanguage();
  const locale = localeFor(learningLanguage);
  const tts = useTTSPlaybackClient({ locale });

  const [chunks, setChunks] = useState<SpeakingChunk[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [recognised, setRecognised] = useState('');
  const [listening, setListening] = useState(false);
  const [grade, setGrade] = useState<MatchGrade | null>(null);
  const [score, setScore] = useState<number | null>(null);
  const [done, setDone] = useState(false);
  const [supported] = useState(() => isSpeechRecognitionSupported());
  const [stats, setStats] = useState({ correct: 0, close: 0, miss: 0 });
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);

  const current = chunks[currentIndex];

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch(`/api/chunks/random?limit=10&language=${learningLanguage}`)
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled) setChunks(data.chunks || []);
      })
      .catch((error) => {
        logger.error('Failed to fetch speaking chunks', { error });
        toast.error('Failed to load speaking chunks', { description: 'Check your connection and try again.' });
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [learningLanguage]);

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
        recognitionRef.current = null;
      }
    };
  }, []);

  const finalise = useCallback(
    async (transcript: string) => {
      if (!current) return;
      const result = gradeAnswer(current.chunk, transcript);
      const computed = Math.round(similarity(current.chunk, transcript) * 100);
      setGrade(result);
      setScore(computed);
      setStats((s) => ({
        ...s,
        correct: s.correct + (result === 'correct' ? 1 : 0),
        close: s.close + (result === 'close' ? 1 : 0),
        miss: s.miss + (result === 'miss' ? 1 : 0),
      }));
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
        logger.warn('speaking review submit failed (non-fatal)', { error });
      }
    },
    [current],
  );

  const startListening = useCallback(() => {
    if (!supported || !current || grade !== null) return;
    const Ctor = getSpeechRecognitionCtor();
    if (!Ctor) return;
    const recognition = new Ctor();
    recognition.lang = recognitionLangFor(learningLanguage);
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    let finalTranscript = '';
    recognition.onresult = (event) => {
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const transcript = result[0]?.transcript ?? '';
        if (result.isFinal) {
          finalTranscript += transcript;
        } else {
          interim += transcript;
        }
      }
      setRecognised(finalTranscript || interim);
    };
    recognition.onerror = (event) => {
      logger.warn('SpeechRecognition error', { error: event.error });
      setListening(false);
    };
    recognition.onend = () => {
      setListening(false);
      recognitionRef.current = null;
      if (finalTranscript.trim()) {
        void finalise(finalTranscript.trim());
      }
    };
    recognitionRef.current = recognition;
    setRecognised('');
    setListening(true);
    try {
      recognition.start();
    } catch (error) {
      logger.warn('SpeechRecognition start failed', { error });
      toast.error('Microphone error', { description: 'Could not start recording. Check microphone permissions.' });
      setListening(false);
    }
  }, [current, finalise, grade, learningLanguage, supported]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) recognitionRef.current.stop();
  }, []);

  const playReference = useCallback(() => {
    if (current && tts.isSupported) tts.speak(current.chunk);
  }, [current, tts]);

  const handleNext = useCallback(() => {
    setRecognised('');
    setGrade(null);
    setScore(null);
    if (currentIndex >= chunks.length - 1) {
      setDone(true);
      return;
    }
    setCurrentIndex((i) => i + 1);
  }, [chunks.length, currentIndex]);

  if (loading) return <div className="container py-8 text-center">Loading...</div>;

  if (!supported) {
    return (
      <div className="container py-8 max-w-xl mx-auto">
        <Card className="border-orange-500/40">
          <CardContent className="p-6 text-sm">
            <p className="font-semibold mb-2 text-orange-500">Speech recognition unavailable</p>
            <p className="text-muted-foreground">
              Your browser does not expose the Web Speech Recognition API. Chrome and Edge
              support it; Firefox and Safari (older) do not.
            </p>
            <Link href="/study" className="inline-block mt-4">
              <Button variant="outline">Back to study</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (done || chunks.length === 0) {
    return (
      <div className="container py-8 max-w-xl mx-auto text-center">
        <h1 className="text-2xl font-bold mb-2">Speaking complete</h1>
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
          <Link href="/study/speaking">
            <Button>
              <Mic className="h-4 w-4 mr-2" />
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
            <Mic className="h-5 w-5" />
            Speaking
          </h1>
          <p className="text-muted-foreground text-xs sm:text-sm">
            {currentIndex + 1} of {chunks.length} · read the chunk aloud
          </p>
        </div>
      </div>

      <Card>
        <CardContent className="p-6 sm:p-8 space-y-5">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Say this</p>
            <p className="text-2xl sm:text-3xl font-serif font-bold break-words">{current.chunk}</p>
            <p className="text-sm text-muted-foreground mt-1">{current.meaning}</p>
          </div>

          <div className="flex justify-center gap-2">
            <Button variant="outline" onClick={playReference} disabled={!tts.isSupported}>
              <Volume2 className="h-4 w-4 mr-2" />
              Hear reference
            </Button>
            {!listening ? (
              <Button onClick={startListening} disabled={grade !== null}>
                <Mic className="h-4 w-4 mr-2" />
                Record
              </Button>
            ) : (
              <Button onClick={stopListening} variant="destructive">
                <MicOff className="h-4 w-4 mr-2" />
                Stop
              </Button>
            )}
          </div>

          {recognised && (
            <div className="p-3 rounded-md bg-muted/50">
              <p className="text-xs text-muted-foreground mb-1">Heard:</p>
              <p className="text-base">{recognised}</p>
            </div>
          )}

          {grade !== null && (
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
                    ? 'Nailed it!'
                    : grade === 'close'
                      ? 'Close — try once more'
                      : 'Off — try again'}{' '}
                  ({score}% match)
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setGrade(null);
                    setScore(null);
                    setRecognised('');
                  }}
                  className="flex-1"
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Retry
                </Button>
                <Button onClick={handleNext} className="flex-1">
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function SpeakingPage() {
  return (
    <Suspense fallback={<div className="container py-8 text-center">Loading...</div>}>
      <SpeakingContent />
    </Suspense>
  );
}
