'use client';

import { useState, useEffect, useRef } from 'react';
import { Volume2, Square, Loader2 } from 'lucide-react';
import type { VocabWord } from './VocabGame';
import { VocabImage } from './VocabImage';
import { useTTSPlaybackClient } from '@/lib/pronunciation/hooks/useTTSPlaybackClient';
import { useLearningLanguage } from '@/lib/contexts/LearningLanguageContext';
import { useTranslation } from '@/lib/i18n/I18nProvider';
import { translateText, isTranslationAvailable, SupportedLanguage } from '@/lib/translation';
import type { Locale } from '@/lib/pronunciation/types';

function learningLangToLocale(lang: string): Locale {
  if (lang === 'fr') return 'fr-FR';
  if (lang === 'es') return 'es-ES';
  if (lang === 'pt') return 'pt-BR';
  if (lang === 'de') return 'de-DE';
  return 'en-US';
}

interface Props {
  word: VocabWord;
  onNext: () => void;
  isLast: boolean;
}

/*
! VocabFlashcard displays vocabulary with translations in the user's i18n language.
? When "Show translation" is clicked, it translates the example to the i18n language (interface language).
*/
export function VocabFlashcard({ word, onNext, isLast }: Props) {
  const { language: i18nLanguage } = useTranslation();
  // TTS uses learningLanguage (content language being studied)
  const { learningLanguage } = useLearningLanguage();
  const [revealed, setRevealed] = useState(false);
  const [exampleIndex, setExampleIndex] = useState(0);
  const [translation, setTranslation] = useState<string>('');
  const [translating, setTranslating] = useState(false);
  const tts = useTTSPlaybackClient({ locale: learningLangToLocale(learningLanguage) });

  const wordText = word.article ? `${word.article} ${word.word}` : word.word;

  const pendingSpeakRef = useRef<string | null>(null);

  // When card changes: reset state and schedule speech
  useEffect(() => {
    setRevealed(false);
    setExampleIndex(0);
    setTranslation('');
    tts.stop();
    pendingSpeakRef.current = wordText;

    if (tts.isSupported && tts.voices.length > 0) {
      tts.speak(wordText);
      pendingSpeakRef.current = null;
    }
  }, [word.word]); // eslint-disable-line react-hooks/exhaustive-deps

  // When voices become available, consume pending speech
  useEffect(() => {
    if (pendingSpeakRef.current && tts.voices.length > 0) {
      tts.speak(pendingSpeakRef.current);
      pendingSpeakRef.current = null;
    }
  }, [tts.voices.length]); // eslint-disable-line react-hooks/exhaustive-deps

  // Fetch translation when revealed or example changes
  useEffect(() => {
    if (!revealed) {
      setTranslation('');
      return;
    }

    const example = examples[exampleIndex];
    if (!example) return;

    // For vocabulary, the example.en is in the learning language (fr, de, es, en)
    // The stored example.pt is NOT in Portuguese for non-English content - it's in English!
    // So we must ALWAYS use dynamic translation when i18nLanguage is pt/es/fr
    // Only use stored translation when learningLanguage and i18nLanguage match (both en)
    const sourceText = example.en;
    if (!sourceText) {
      setTranslation('');
      return;
    }

    // Use stored translation ONLY when source is English and i18n is Portuguese
    // For all other cases, use dynamic translation to get the correct target language
    if (i18nLanguage === 'pt' && learningLanguage === 'en') {
      // English vocabulary with Portuguese interface - use stored translation
      setTranslation(example.pt);
      return;
    }

    // For all other combinations (fr/pt, de/pt, es/pt, etc.), use dynamic translation
    if (!isTranslationAvailable(i18nLanguage)) {
      setTranslation(sourceText); // Fallback to source text
      return;
    }

    setTranslating(true);
    // Translate from learningLanguage (French, German, etc.) to i18nLanguage (Portuguese, etc.)
    translateText(sourceText, i18nLanguage as SupportedLanguage, learningLanguage)
      .then((result) => {
        setTranslation(result);
      })
      .catch(() => {
        // Fallback to Portuguese translation on error
        setTranslation(example.pt);
      })
      .finally(() => {
        setTranslating(false);
      });
  }, [revealed, exampleIndex, i18nLanguage]);

  const examples = [
    { en: word.example_1, pt: word.example_1_translation },
    { en: word.example_2, pt: word.example_2_translation },
    { en: word.example_3, pt: word.example_3_translation },
  ].filter((e) => e.en);

  const handleNext = () => {
    tts.stop();
    onNext();
  };

  const cefrColors: Record<string, string> = {
    A1: 'bg-green-100 text-green-800',
    A2: 'bg-emerald-100 text-emerald-800',
    B1: 'bg-blue-100 text-blue-800',
    B2: 'bg-indigo-100 text-indigo-800',
    C1: 'bg-purple-100 text-purple-800',
    C2: 'bg-red-100 text-red-800',
  };

  return (
    <div className="bg-card border border-border rounded-2xl shadow-md overflow-hidden flex flex-col md:flex-row">
      {/* Image — natural aspect on mobile, stretch to content on desktop */}
      <div className="relative md:w-2/5 md:flex-shrink-0 aspect-[4/3] md:aspect-auto md:self-stretch bg-muted">
        <VocabImage query={word.image_search_query} word={word.word} fill />
      </div>

      <div className="p-6 md:flex-1 md:min-w-0">
        {/* Word header */}
        <div className="flex items-start justify-between gap-4 mb-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-3xl font-bold text-foreground">{wordText}</h2>
              {word.plural_form && (
                <span className="text-sm text-muted-foreground">({word.plural_form})</span>
              )}
              {/* Botão de fala — usa config salva em Settings, sem re-expor sliders */}
              {tts.isSupported && (
                <button
                  onClick={() => (tts.isPlaying ? tts.stop() : tts.speak(wordText))}
                  title={tts.isPlaying ? 'Stop' : 'Hear pronunciation'}
                  className={`p-1.5 rounded-full transition-colors ${
                    tts.isPlaying
                      ? 'bg-primary text-primary-foreground'
                      : 'hover:bg-primary/10 text-muted-foreground hover:text-primary'
                  }`}
                >
                  {tts.isPlaying ? <Square className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                </button>
              )}
            </div>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span className="text-muted-foreground text-sm font-mono">{word.phonetic}</span>
              <span className="text-xs text-muted-foreground italic">{word.part_of_speech}</span>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1.5 shrink-0">
            <span
              className={`text-xs font-bold px-2 py-0.5 rounded-full ${cefrColors[word.cefr_level] || 'bg-gray-100 text-gray-800'}`}
            >
              {word.cefr_level}
            </span>
            <span className="text-xs text-muted-foreground">{word.subcategory}</span>
          </div>
        </div>

        {/* Meaning */}
        <p className="text-foreground mb-4">{word.primary_meaning}</p>

        {/* Examples */}
        {examples.length > 0 && (
          <div className="bg-secondary/50 rounded-xl p-4 mb-4">
            <div className="flex items-start gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-foreground flex-1">
                    {examples[exampleIndex].en}
                  </p>
                  {tts.isSupported && (
                    <button
                      onClick={() => {
                        tts.stop();
                        tts.speak(examples[exampleIndex].en);
                      }}
                      title="Hear this sentence"
                      className="shrink-0 p-1.5 rounded-full hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors"
                    >
                      <Volume2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
                {!revealed ? (
                  <button
                    onClick={() => setRevealed(true)}
                    className="text-xs text-primary hover:underline mt-1"
                  >
                    Show translation
                  </button>
                ) : (
                  <p className="text-xs text-muted-foreground mt-1 italic flex items-center gap-1">
                    {translating ? (
                      <>
                        <Loader2 className="h-3 w-3 animate-spin" />
                        <span>Translating...</span>
                      </>
                    ) : (
                      translation
                    )}
                  </p>
                )}
              </div>
              {examples.length > 1 && (
                <button
                  onClick={() => {
                    setExampleIndex((i) => (i + 1) % examples.length);
                    setRevealed(false);
                    setTranslation('');
                  }}
                  className="shrink-0 text-xs text-muted-foreground hover:text-foreground px-2 py-1 rounded border border-border"
                >
                  Next
                </button>
              )}
            </div>
          </div>
        )}

        {/* Memory hook */}
        {word.memory_hook && (
          <div className="flex gap-2 items-start text-sm text-muted-foreground mb-4">
            <span className="shrink-0">💡</span>
            <span>{word.memory_hook}</span>
          </div>
        )}

        {/* Collocations */}
        {word.common_collocations && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {word.common_collocations.split(',').map((col) => (
              <span
                key={col.trim()}
                className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full"
              >
                {col.trim()}
              </span>
            ))}
          </div>
        )}

        <button
          onClick={handleNext}
          className="w-full bg-primary text-primary-foreground py-3 rounded-xl font-semibold hover:bg-primary/90 transition-colors"
        >
          {isLast ? 'Start Matching Game →' : 'Next Word →'}
        </button>
      </div>
    </div>
  );
}
