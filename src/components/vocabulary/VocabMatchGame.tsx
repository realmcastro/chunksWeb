'use client';

import { useState, useEffect, useRef } from 'react';
import { Volume2 } from 'lucide-react';
import type { VocabWord } from './VocabGame';
import { VocabImage } from './VocabImage';
import { useTTSPlaybackClient } from '@/lib/pronunciation/hooks/useTTSPlaybackClient';
import { useLearningLanguage } from '@/lib/contexts/LearningLanguageContext';
import type { Locale } from '@/lib/pronunciation/types';

function learningLangToLocale(lang: string): Locale {
  if (lang === 'fr') return 'fr-FR';
  if (lang === 'es') return 'es-ES';
  if (lang === 'pt') return 'pt-BR';
  if (lang === 'de') return 'de-DE';
  return 'en-US';
}

interface Props {
  words: VocabWord[];
  onComplete: (correct: number, total: number) => void;
}

interface CardState {
  id: number;
  word: VocabWord;
  type: 'image' | 'word';
  matched: boolean;
  selected: boolean;
  wrong: boolean;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function VocabMatchGame({ words, onComplete }: Props) {
  const { learningLanguage } = useLearningLanguage();
  const [imageCards, setImageCards] = useState<CardState[]>([]);
  const [wordCards, setWordCards] = useState<CardState[]>([]);
  const [selectedImage, setSelectedImage] = useState<CardState | null>(null);
  const [selectedWord, setSelectedWord] = useState<CardState | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const lockRef = useRef(false);
  const tts = useTTSPlaybackClient({ locale: learningLangToLocale(learningLanguage) });

  useEffect(() => {
    const imgs: CardState[] = shuffle(words).map((w, i) => ({
      id: w.id,
      word: w,
      type: 'image',
      matched: false,
      selected: false,
      wrong: false,
    }));
    const wds: CardState[] = shuffle(words).map((w, i) => ({
      id: w.id,
      word: w,
      type: 'word',
      matched: false,
      selected: false,
      wrong: false,
    }));
    setImageCards(imgs);
    setWordCards(wds);
  }, [words]);

  const totalPairs = words.length;
  const matchedCount = imageCards.filter((c) => c.matched).length;

  useEffect(() => {
    if (matchedCount > 0 && matchedCount === totalPairs) {
      setTimeout(() => onComplete(correctCount, attempts || 1), 600);
    }
  }, [matchedCount, totalPairs, correctCount, attempts, onComplete]);

  const updateCard = (type: 'image' | 'word', id: number, patch: Partial<CardState>) => {
    const setter = type === 'image' ? setImageCards : setWordCards;
    setter((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c)));
  };

  const handleImageSelect = (card: CardState) => {
    if (lockRef.current || card.matched) return;

    if (selectedImage?.id === card.id) {
      setSelectedImage(null);
      updateCard('image', card.id, { selected: false });
      return;
    }

    // Deselect previous image
    if (selectedImage) {
      updateCard('image', selectedImage.id, { selected: false });
    }

    setSelectedImage(card);
    updateCard('image', card.id, { selected: true });

    if (selectedWord) {
      checkMatch(card, selectedWord);
    }
  };

  const handleWordSelect = (card: CardState) => {
    if (lockRef.current || card.matched) return;

    // Fala a palavra ao selecionar
    if (tts.isSupported) {
      const text = card.word.article ? `${card.word.article} ${card.word.word}` : card.word.word;
      tts.stop();
      tts.speak(text);
    }

    if (selectedWord?.id === card.id) {
      setSelectedWord(null);
      updateCard('word', card.id, { selected: false });
      return;
    }

    // Deselect previous word
    if (selectedWord) {
      updateCard('word', selectedWord.id, { selected: false });
    }

    setSelectedWord(card);
    updateCard('word', card.id, { selected: true });

    if (selectedImage) {
      checkMatch(selectedImage, card);
    }
  };

  const checkMatch = (imgCard: CardState, wdCard: CardState) => {
    lockRef.current = true;
    setAttempts((a) => a + 1);

    if (imgCard.id === wdCard.id) {
      // Correct match
      setCorrectCount((c) => c + 1);
      updateCard('image', imgCard.id, { matched: true, selected: false });
      updateCard('word', wdCard.id, { matched: true, selected: false });
      setSelectedImage(null);
      setSelectedWord(null);
      lockRef.current = false;
    } else {
      // Wrong match — flash red then deselect
      updateCard('image', imgCard.id, { wrong: true, selected: false });
      updateCard('word', wdCard.id, { wrong: true, selected: false });
      setTimeout(() => {
        updateCard('image', imgCard.id, { wrong: false });
        updateCard('word', wdCard.id, { wrong: false });
        setSelectedImage(null);
        setSelectedWord(null);
        lockRef.current = false;
      }, 700);
    }
  };

  const cefrColors: Record<string, string> = {
    A1: 'bg-green-100 text-green-800 border-green-200',
    A2: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    B1: 'bg-blue-100 text-blue-800 border-blue-200',
    B2: 'bg-indigo-100 text-indigo-800 border-indigo-200',
    C1: 'bg-purple-100 text-purple-800 border-purple-200',
    C2: 'bg-red-100 text-red-800 border-red-200',
  };

  return (
    <div>
      {/* Progress bar */}
      <div className="mb-6">
        <div className="flex justify-between text-sm text-muted-foreground mb-1.5">
          <span>
            {matchedCount} / {totalPairs} matched
          </span>
          <span>{attempts} attempts</span>
        </div>
        <div className="h-2 bg-border rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all duration-500"
            style={{ width: `${(matchedCount / totalPairs) * 100}%` }}
          />
        </div>
      </div>

      <p className="text-sm text-center text-muted-foreground mb-5">
        Select an image, then select the matching word (or vice versa)
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Image column */}
        <div>
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
            Images
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {imageCards.map((card) => (
              <button
                key={card.id}
                onClick={() => handleImageSelect(card)}
                disabled={card.matched}
                className={`
                  relative rounded-xl overflow-hidden border-2 transition-all duration-200
                  aspect-[4/3] focus:outline-none focus:ring-2 focus:ring-primary
                  ${card.matched ? 'border-green-400 opacity-60 cursor-default' : 'cursor-pointer hover:scale-[1.02]'}
                  ${card.selected ? 'border-primary ring-2 ring-primary/30 scale-[1.02]' : !card.matched ? 'border-border' : ''}
                  ${card.wrong ? 'border-destructive ring-2 ring-destructive/30' : ''}
                `}
              >
                <VocabImage query={card.word.image_search_query} word={card.word.word} fill />
                {card.matched && (
                  <div className="absolute inset-0 bg-green-500/20 flex items-center justify-center">
                    <span className="text-3xl">✓</span>
                  </div>
                )}
                {card.wrong && (
                  <div className="absolute inset-0 bg-destructive/20 flex items-center justify-center">
                    <span className="text-3xl">✗</span>
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Word column */}
        <div>
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
            Words
          </h3>
          <div className="grid grid-cols-1 gap-2.5">
            {wordCards.map((card) => {
              const wordText = card.word.article
                ? `${card.word.article} ${card.word.word}`
                : card.word.word;
              return (
                <div
                  key={card.id}
                  className={`
                    flex items-center gap-2 rounded-xl border-2 pl-4 pr-2 py-3 transition-all duration-200
                    ${
                      card.matched
                        ? 'border-green-400 bg-green-50 dark:bg-green-950/30 opacity-60'
                        : 'bg-card'
                    }
                    ${card.selected ? 'border-primary bg-primary/5 ring-2 ring-primary/20' : !card.matched ? 'border-border' : ''}
                    ${card.wrong ? 'border-destructive bg-destructive/5' : ''}
                  `}
                >
                  {/* Área clicável para seleção (matching) */}
                  <button
                    onClick={() => handleWordSelect(card)}
                    disabled={card.matched}
                    className="flex-1 text-left focus:outline-none disabled:cursor-default cursor-pointer"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <span className="font-semibold text-foreground">{wordText}</span>
                        <span className="text-xs text-muted-foreground ml-2 font-mono">
                          {card.word.phonetic}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span
                          className={`text-xs font-bold px-1.5 py-0.5 rounded border ${cefrColors[card.word.cefr_level] || 'bg-gray-100 text-gray-700 border-gray-200'}`}
                        >
                          {card.word.cefr_level}
                        </span>
                        {card.matched && <span className="text-green-500">✓</span>}
                        {card.wrong && <span className="text-destructive">✗</span>}
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                      {card.word.primary_meaning}
                    </p>
                  </button>

                  {/* Botão de fala separado — não interfere no matching */}
                  {tts.isSupported && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        tts.stop();
                        tts.speak(wordText);
                      }}
                      title="Hear pronunciation"
                      className="shrink-0 p-1.5 rounded-full hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors"
                    >
                      <Volume2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
