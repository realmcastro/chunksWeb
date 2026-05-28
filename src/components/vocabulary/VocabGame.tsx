'use client';

import { useState, useEffect, useCallback } from 'react';
import { VocabFlashcard } from './VocabFlashcard';
import { VocabMatchGame } from './VocabMatchGame';
import { useLearningLanguage } from '@/lib/contexts/LearningLanguageContext';

export interface VocabWord {
  id: number;
  category: string;
  subcategory: string;
  word: string;
  phonetic: string;
  part_of_speech: string;
  cefr_level: string;
  frequency_rank: number;
  article: string;
  plural_form: string;
  primary_meaning: string;
  secondary_meaning: string;
  common_collocations: string;
  image_search_query: string;
  image_context: string;
  example_1: string;
  example_1_translation: string;
  example_2: string;
  example_2_translation: string;
  example_3: string;
  example_3_translation: string;
  pronunciation_tips: string;
  memory_hook: string;
  related_words: string;
  learning_priority: string;
}

type GamePhase = 'setup' | 'flashcard' | 'match';

interface FilterState {
  cefr: string;
  category: string;
  subcategory: string;
  count: number;
}

export function VocabGame() {
  const { learningLanguage } = useLearningLanguage();
  const [phase, setPhase] = useState<GamePhase>('setup');
  const [words, setWords] = useState<VocabWord[]>([]);
  const [categories, setCategories] = useState<{ category: string; subcategory: string }[]>([]);
  const [cefrLevels, setCefrLevels] = useState<{ cefr_level: string; count: number }[]>([]);
  const [loading, setLoading] = useState(false);
  const [noResults, setNoResults] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    cefr: '',
    category: '',
    subcategory: '',
    count: 6,
  });
  const [flashcardIndex, setFlashcardIndex] = useState(0);
  const [matchScore, setMatchScore] = useState<{ correct: number; total: number } | null>(null);

  /*
  ! category e subcategory são específicos do idioma anterior — manter ao trocar idioma
  ? causaria startGame enviando category=<valor_antigo>&language=<novo> e retornando vazio.
  */
  useEffect(() => {
    setFilters((prev) => ({ ...prev, cefr: '', category: '', subcategory: '' }));
    fetch(`/api/vocabulary?limit=1&language=${learningLanguage}`)
      .then((r) => r.json())
      .then((d) => {
        setCategories(d.categories || []);
        setCefrLevels(d.cefrLevels || []);
      });
  }, [learningLanguage]);

  const uniqueCategories = Array.from(new Set(categories.map((c) => c.category)));
  const subcategories = filters.category
    ? Array.from(
        new Set(
          categories.filter((c) => c.category === filters.category).map((c) => c.subcategory),
        ),
      )
    : [];

  const startGame = useCallback(async () => {
    setLoading(true);
    setNoResults(false);
    const params = new URLSearchParams({
      gameCount: String(filters.count),
      language: learningLanguage,
      ...(filters.cefr && { cefr: filters.cefr }),
      ...(filters.category && { category: filters.category }),
      ...(filters.subcategory && { subcategory: filters.subcategory }),
    });
    const res = await fetch(`/api/vocabulary?${params}`);
    const data = await res.json();
    const fetched: VocabWord[] = data.words || [];
    if (fetched.length === 0) {
      setNoResults(true);
      setLoading(false);
      return;
    }
    setWords(fetched);
    setFlashcardIndex(0);
    setMatchScore(null);
    setPhase('flashcard');
    setLoading(false);
  }, [filters, learningLanguage]);

  const handleFlashcardDone = () => {
    setPhase('match');
  };

  const handleMatchDone = (correct: number, total: number) => {
    setMatchScore({ correct, total });
  };

  const restart = () => {
    setPhase('setup');
    setWords([]);
    setMatchScore(null);
  };

  if (phase === 'setup') {
    return (
      <div className="max-w-lg mx-auto py-10 px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Vocabulary Card Game</h1>
          <p className="text-muted-foreground">Learn words with images, then test yourself!</p>
        </div>

        <div className="bg-card border border-border rounded-xl p-6 space-y-5 shadow-sm">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">CEFR Level</label>
            <select
              value={filters.cefr}
              onChange={(e) => setFilters((f) => ({ ...f, cefr: e.target.value }))}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">
                All Levels ({cefrLevels.reduce((s, l) => s + l.count, 0)} words)
              </option>
              {cefrLevels.map((l) => (
                <option key={l.cefr_level} value={l.cefr_level}>
                  {l.cefr_level} — {l.count} words
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Category</label>
            <select
              value={filters.category}
              onChange={(e) =>
                setFilters((f) => ({ ...f, category: e.target.value, subcategory: '' }))
              }
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">All Categories</option>
              {uniqueCategories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {subcategories.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Subcategory
              </label>
              <select
                value={filters.subcategory}
                onChange={(e) => setFilters((f) => ({ ...f, subcategory: e.target.value }))}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">All Subcategories</option>
                {subcategories.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Number of words: <span className="text-primary font-bold">{filters.count}</span>
            </label>
            <input
              type="range"
              min={4}
              max={12}
              step={2}
              value={filters.count}
              onChange={(e) => setFilters((f) => ({ ...f, count: Number(e.target.value) }))}
              className="w-full accent-primary"
            />
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>4</span>
              <span>8</span>
              <span>12</span>
            </div>
          </div>

          {noResults && (
            <div className="rounded-lg bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">
              No words found for this combination. Try a different level or category.
            </div>
          )}

          <button
            onClick={startGame}
            disabled={loading}
            className="w-full bg-primary text-primary-foreground py-3 rounded-lg font-semibold text-base hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {loading ? 'Loading...' : 'Start Learning →'}
          </button>
        </div>
      </div>
    );
  }

  if (phase === 'flashcard') {
    return (
      <div className="max-w-2xl mx-auto py-6 px-4">
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={restart}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            ← Back to setup
          </button>
          <span className="text-sm text-muted-foreground">
            {flashcardIndex + 1} / {words.length}
          </span>
        </div>

        <div className="mb-4">
          <div className="flex gap-1">
            {words.map((_, i) => (
              <div
                key={i}
                className={`h-1.5 flex-1 rounded-full transition-colors ${i <= flashcardIndex ? 'bg-primary' : 'bg-border'}`}
              />
            ))}
          </div>
        </div>

        {words[flashcardIndex] && (
          <VocabFlashcard
            word={words[flashcardIndex]}
            onNext={() => {
              if (flashcardIndex < words.length - 1) {
                setFlashcardIndex((i) => i + 1);
              } else {
                handleFlashcardDone();
              }
            }}
            isLast={flashcardIndex === words.length - 1}
          />
        )}
      </div>
    );
  }

  if (phase === 'match') {
    return (
      <div className="max-w-4xl mx-auto py-6 px-4">
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={restart}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            ← Back to setup
          </button>
          <h2 className="text-xl font-bold text-foreground">Match words to images</h2>
          <button
            onClick={() => setPhase('flashcard')}
            className="text-sm text-primary hover:underline"
          >
            Review cards again
          </button>
        </div>

        {matchScore ? (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">
              {matchScore.correct === matchScore.total ? '🎉' : '👍'}
            </div>
            <h2 className="text-3xl font-bold text-foreground mb-2">
              {matchScore.correct} / {matchScore.total} correct!
            </h2>
            <p className="text-muted-foreground mb-8">
              {matchScore.correct === matchScore.total
                ? 'Perfect score! You matched all words correctly.'
                : `You got ${matchScore.correct} out of ${matchScore.total}. Keep practicing!`}
            </p>
            <div className="flex gap-4 justify-center flex-wrap">
              <button
                onClick={startGame}
                disabled={loading}
                className="bg-primary text-primary-foreground px-6 py-2.5 rounded-lg font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {loading ? 'Loading...' : 'Play Again'}
              </button>
              <button
                onClick={restart}
                className="bg-secondary text-secondary-foreground px-6 py-2.5 rounded-lg font-semibold hover:bg-secondary/80 transition-colors"
              >
                New Game
              </button>
            </div>
          </div>
        ) : (
          <VocabMatchGame words={words} onComplete={handleMatchDone} />
        )}
      </div>
    );
  }

  return null;
}
