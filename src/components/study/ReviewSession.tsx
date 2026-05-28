'use client';

import { useState, useCallback, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ChevronLeft, ChevronRight, FlipVertical, Volume2 } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { useTranslation } from '@/lib/i18n/I18nProvider';
import { translateText, isTranslationAvailable, SupportedLanguage } from '@/lib/translation';
import { useTTSPlaybackClient } from '@/lib/pronunciation/hooks/useTTSPlaybackClient';
import { TTSControls } from '@/lib/pronunciation/ui/TTSControls';
import type { Locale } from '@/lib/pronunciation/types';
import { useLearningLanguage } from '@/lib/contexts/LearningLanguageContext';

export interface ReviewChunk {
  id: string;
  chunk: string;
  meaning: string;
  examples: { id: string; sentence: string; translation?: string }[];
  category: { id: string; name: string; level: string };
}

interface ReviewSessionProps {
  chunks: ReviewChunk[];
  onComplete: () => void;
  onSkip: (chunkId: string) => void;
  onReview: (chunkId: string, quality: number) => Promise<void>;
}

export function ReviewSession({ chunks, onComplete, onSkip, onReview }: ReviewSessionProps) {
  const { t, language: i18nLanguage } = useTranslation();
  // Use learningLanguage for TTS locale (content language being studied)
  const { learningLanguage } = useLearningLanguage();
  // Translation target is ALWAYS the i18n language (user's interface language), not learningLanguage
  const [currentIndex, setCurrentIndex] = useState(0);
  const [exampleIndex, setExampleIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showMeaningTranslation, setShowMeaningTranslation] = useState(false);
  const [translatedMeaning, setTranslatedMeaning] = useState<string | null>(null);
  const [isTranslatingMeaning, setIsTranslatingMeaning] = useState(false);
  const [showSentenceTranslation, setShowSentenceTranslation] = useState(false);
  const [translatedSentence, setTranslatedSentence] = useState<string | null>(null);
  const [isTranslatingSentence, setIsTranslatingSentence] = useState(false);

  // TTS locale must reflect the content language being studied, not the UI language
  const locale = (
    learningLanguage === 'fr'
      ? 'fr-FR'
      : learningLanguage === 'es'
        ? 'es-ES'
        : learningLanguage === 'de'
          ? 'de-DE'
          : 'en-US'
  ) as Locale;
  const tts = useTTSPlaybackClient({ locale });

  const currentChunk = chunks[currentIndex];
  const currentExample = currentChunk?.examples[exampleIndex];
  const hasMultipleExamples = (currentChunk?.examples.length ?? 0) > 1;

  // Reset states when chunk changes
  useEffect(() => {
    setTranslatedMeaning(null);
    setShowMeaningTranslation(false);
    setTranslatedSentence(null);
    setShowSentenceTranslation(false);
    setExampleIndex(0);
  }, [currentIndex]);

  // Translate meaning when showMeaningTranslation is toggled
  // Translate TO the learningLanguage (content language), not the UI language
  useEffect(() => {
    if (!showMeaningTranslation || !currentChunk) {
      setTranslatedMeaning(null);
      return;
    }

    const meaning = currentChunk.meaning;
    if (!meaning) {
      setTranslatedMeaning(null);
      return;
    }

    // Only translate if i18n language is a supported target (user's interface language)
    if (!isTranslationAvailable(i18nLanguage)) {
      setTranslatedMeaning(null);
      return;
    }

    setIsTranslatingMeaning(true);
    translateText(meaning, i18nLanguage as SupportedLanguage, learningLanguage)
      .then((translated) => {
        setTranslatedMeaning(translated);
      })
      .catch(() => {
        setTranslatedMeaning(null);
      })
      .finally(() => {
        setIsTranslatingMeaning(false);
      });
  }, [showMeaningTranslation, i18nLanguage, learningLanguage, currentChunk]);

  // Translate sentence when showSentenceTranslation is toggled
  useEffect(() => {
    if (!showSentenceTranslation || !currentExample) {
      setTranslatedSentence(null);
      return;
    }

    // If there's a stored translation, use it
    if (currentExample.translation) {
      setTranslatedSentence(null);
      return;
    }

    // Otherwise, translate dynamically to learningLanguage
    const sentence = currentExample.sentence;
    if (!sentence) {
      setTranslatedSentence(null);
      return;
    }

    if (!isTranslationAvailable(i18nLanguage)) {
      setTranslatedSentence(null);
      return;
    }

    setIsTranslatingSentence(true);
    translateText(sentence, i18nLanguage as SupportedLanguage, learningLanguage)
      .then((translated) => {
        setTranslatedSentence(translated);
      })
      .catch(() => {
        setTranslatedSentence(null);
      })
      .finally(() => {
        setIsTranslatingSentence(false);
      });
  }, [showSentenceTranslation, i18nLanguage, learningLanguage, currentExample]);

  const handleFlip = useCallback(() => {
    setIsFlipped((prev) => !prev);
  }, []);

  const handleQuality = useCallback(
    async (quality: number) => {
      if (!currentChunk || isSubmitting) return;

      setIsSubmitting(true);
      try {
        await onReview(currentChunk.id, quality);
        setIsFlipped(false);
        setShowMeaningTranslation(false);
        setShowSentenceTranslation(false);

        if (currentIndex >= chunks.length - 1) {
          onComplete();
        } else {
          setCurrentIndex((prev) => prev + 1);
        }
      } finally {
        setIsSubmitting(false);
      }
    },
    [currentChunk, currentIndex, chunks.length, isSubmitting, onReview, onComplete],
  );

  const handleSkip = useCallback(() => {
    if (currentChunk) {
      onSkip(currentChunk.id);
      setIsFlipped(false);
      setShowMeaningTranslation(false);
      setShowSentenceTranslation(false);

      if (currentIndex >= chunks.length - 1) {
        onComplete();
      } else {
        setCurrentIndex((prev) => prev + 1);
      }
    }
  }, [currentChunk, currentIndex, chunks.length, onSkip, onComplete]);

  const handlePrevExample = useCallback(() => {
    if (exampleIndex > 0) {
      setExampleIndex((prev) => prev - 1);
      setShowSentenceTranslation(false);
      setTranslatedSentence(null);
    }
  }, [exampleIndex]);

  const handleNextExample = useCallback(() => {
    if (currentChunk && exampleIndex < currentChunk.examples.length - 1) {
      setExampleIndex((prev) => prev + 1);
      setShowSentenceTranslation(false);
      setTranslatedSentence(null);
    }
  }, [exampleIndex, currentChunk]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        if (!isFlipped) {
          handleFlip();
        }
      } else if (isFlipped) {
        if (e.key === '1') handleQuality(1);
        else if (e.key === '2') handleQuality(2);
        else if (e.key === '3') handleQuality(3);
        else if (e.key === '4') handleQuality(4);
        else if (e.key === '5') handleQuality(5);
        else if (e.key === 'ArrowLeft') handlePrevExample();
        else if (e.key === 'ArrowRight') handleNextExample();
      } else if (e.key === 'ArrowRight') {
        handleSkip();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFlipped, handleFlip, handleQuality, handleSkip, handlePrevExample, handleNextExample]);

  if (!currentChunk) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <p className="text-muted-foreground">No chunks to review</p>
        <Button onClick={onComplete} className="mt-4">
          Go to Dashboard
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Progress */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          {currentIndex + 1} of {chunks.length}
        </span>
        <div className="h-1 w-32 rounded-full bg-secondary overflow-hidden">
          <div
            className="h-full bg-primary transition-all"
            style={{
              width: `${((currentIndex + 1) / chunks.length) * 100}%`,
            }}
          />
        </div>
      </div>

      {/* Card */}
      <div className="perspective w-full max-w-2xl mx-auto">
        <div
          className={cn(
            'relative w-full cursor-pointer transition-all duration-500 preserve-3d',
            isFlipped ? 'min-h-[440px] sm:min-h-[480px]' : 'min-h-[260px] sm:min-h-[300px]',
            isFlipped && 'rotate-y-180',
          )}
          onClick={handleFlip}
        >
          {/* Front */}
          <Card className={cn('absolute inset-0 w-full backface-hidden')}>
            <CardContent className="p-4 sm:p-8 flex flex-col items-center justify-center min-h-[260px] sm:min-h-[300px] overflow-y-auto">
              <span
                className="inline-block px-3 py-1 rounded-full text-xs sm:text-sm font-medium mb-3 sm:mb-4 text-center"
                style={{
                  backgroundColor:
                    currentChunk.category.level === 'foundation'
                      ? 'var(--foundation)'
                      : currentChunk.category.level === 'basic'
                        ? 'var(--basic)'
                        : 'var(--advanced)',
                  color: 'white',
                }}
              >
                {currentChunk.category.name}
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold font-serif text-center mb-3 sm:mb-4 break-words">
                {currentChunk.chunk}
              </h2>
              <p className="text-muted-foreground text-center">Click to reveal meaning</p>
              <TTSControls
                text={currentChunk.chunk}
                state={tts.state}
                voices={tts.voices}
                settings={tts.settings}
                onSpeak={tts.speak}
                onStop={tts.stop}
                onRateChange={tts.setRate}
                onPitchChange={tts.setPitch}
                onVolumeChange={tts.setVolume}
                onVoiceChange={tts.selectVoice}
                isSupported={tts.isSupported}
                className="mt-4"
              />
            </CardContent>
          </Card>

          {/* Back */}
          <Card className="absolute inset-0 w-full backface-hidden rotate-y-180">
            <CardContent className="p-4 sm:p-8 flex flex-col items-center justify-start min-h-[260px] sm:min-h-[300px] h-full overflow-y-auto">
              <p className="text-lg sm:text-xl text-center mb-2 break-words">
                {currentChunk.meaning}
              </p>
              {showMeaningTranslation && (isTranslatingMeaning || translatedMeaning) && (
                <p className="text-sm text-muted-foreground text-center mb-2">
                  {isTranslatingMeaning ? '...' : translatedMeaning}
                </p>
              )}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowMeaningTranslation((prev) => !prev);
                }}
                className="text-xs text-primary mb-4 hover:underline"
              >
                {showMeaningTranslation
                  ? t('buttons.hideTranslation')
                  : t('buttons.showTranslation')}
              </button>

              {currentChunk.examples.length > 0 && currentExample && (
                <div className="mt-4 pt-4 border-t border-border w-full">
                  <p className="text-sm text-muted-foreground mb-2">{t('chunk.example')}:</p>

                  {/* Example navigation */}
                  {hasMultipleExamples && (
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePrevExample();
                        }}
                        disabled={exampleIndex === 0}
                        className="p-1 rounded hover:bg-secondary disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </button>
                      <span className="text-xs text-muted-foreground">
                        {exampleIndex + 1} / {currentChunk.examples.length}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleNextExample();
                        }}
                        disabled={exampleIndex >= currentChunk.examples.length - 1}
                        className="p-1 rounded hover:bg-secondary disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </div>
                  )}

                  <p className="text-center">
                    {currentExample.sentence}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        tts.speak(currentExample.sentence);
                      }}
                      className="ml-2 inline-flex items-center justify-center w-6 h-6 rounded-full hover:bg-secondary transition-colors"
                      title="Listen to example"
                    >
                      <Volume2 className="h-4 w-4" />
                    </button>
                  </p>
                  {showSentenceTranslation && (
                    <>
                      {currentExample.translation ? (
                        <p className="text-sm text-muted-foreground text-center mt-2">
                          {currentExample.translation}
                        </p>
                      ) : isTranslatingSentence || translatedSentence ? (
                        <p className="text-sm text-muted-foreground text-center mt-2">
                          {isTranslatingSentence ? '...' : translatedSentence}
                        </p>
                      ) : null}
                    </>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowSentenceTranslation((prev) => !prev);
                    }}
                    className="text-xs text-primary mt-2 hover:underline"
                  >
                    {showSentenceTranslation
                      ? t('buttons.hideTranslation')
                      : t('buttons.showTranslation')}
                  </button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Actions */}
      {!isFlipped ? (
        <div className="flex flex-col sm:flex-row justify-center gap-2 sm:gap-4">
          <Button variant="outline" onClick={handleFlip} className="w-full sm:w-auto">
            <FlipVertical className="mr-2 h-4 w-4" />
            {t('buttons.flipCard')}
          </Button>
          <Button variant="ghost" onClick={handleSkip} className="w-full sm:w-auto">
            {t('buttons.skip')}
            <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      ) : (
        <div className="space-y-3 sm:space-y-4">
          <p className="text-center text-sm text-muted-foreground">{t('review.howWasIt')}</p>
          <div className="grid grid-cols-5 gap-2 max-w-md mx-auto">
            {[1, 2, 3, 4, 5].map((quality) => (
              <Button
                key={quality}
                variant={quality <= 2 ? 'destructive' : quality <= 4 ? 'secondary' : 'default'}
                onClick={() => handleQuality(quality)}
                disabled={isSubmitting}
                className="w-full px-0"
              >
                {quality}
              </Button>
            ))}
          </div>
          <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 text-xs text-muted-foreground px-2 text-center">
            <span>{t('review.needsReview')}</span>
            <span>{t('review.goodRecall')}</span>
            <span>{t('review.perfect')}</span>
          </div>
        </div>
      )}
    </div>
  );
}
