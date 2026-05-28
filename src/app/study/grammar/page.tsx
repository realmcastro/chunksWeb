'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, RotateCcw, CheckCircle, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { cn } from '@/lib/utils/cn';
import { useLearningLanguage } from '@/lib/contexts/LearningLanguageContext';

interface GrammarStructure {
  id: string;
  label: string;
  meaning: string;
  function: string | null;
  whenToUse: string | null;
  pattern: string | null;
  keyVariations: string | null;
  whyItMatters: string | null;
  commonMistakes: string | null;
  examples: { id: string; sentence: string; translation?: string }[];
  category: { id: string; name: string; color: string };
}

function GrammarCard({
  structure,
  onNext,
  onSkip,
  index,
  total,
}: {
  structure: GrammarStructure;
  onNext: () => void;
  onSkip: () => void;
  index: number;
  total: number;
}) {
  const [revealed, setRevealed] = useState(false);

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      {/* Structure label */}
      <Card>
        <CardContent className="p-6 text-center space-y-3">
          <div className="flex items-center justify-center gap-2">
            <div
              className="w-3 h-3 rounded-full shrink-0"
              style={{ backgroundColor: structure.category.color }}
            />
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              {structure.category.name}
            </span>
          </div>

          <h2 className="text-3xl font-bold font-serif">{structure.label}</h2>

          {structure.pattern && (
            <div className="inline-block bg-muted px-3 py-1 rounded-md text-sm font-mono text-muted-foreground">
              {structure.pattern}
            </div>
          )}

          {!revealed && (
            <p className="text-sm text-muted-foreground mt-2">
              Pense em como você usaria esta estrutura. O que ela significa?
            </p>
          )}
        </CardContent>
      </Card>

      {!revealed ? (
        <button
          onClick={() => setRevealed(true)}
          className="w-full inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground px-4 py-3 rounded-lg font-semibold hover:bg-primary/90 transition-colors"
        >
          Ver explicação
          <ArrowRight className="h-4 w-4" />
        </button>
      ) : (
        <div className="space-y-3 animate-in fade-in-0 slide-in-from-bottom-2 duration-300">
          {/* Core meaning */}
          <Card className="border-green-300 dark:border-green-800">
            <CardContent className="p-5 space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-green-600 dark:text-green-400">
                Significado central
              </p>
              <p className="font-medium">{structure.meaning}</p>
              {structure.function && (
                <p className="text-sm text-muted-foreground">{structure.function}</p>
              )}
            </CardContent>
          </Card>

          {/* When to use */}
          {structure.whenToUse && (
            <Card>
              <CardContent className="p-4 space-y-1">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Quando usar
                </p>
                <p className="text-sm">{structure.whenToUse}</p>
              </CardContent>
            </Card>
          )}

          {/* Key variations */}
          {structure.keyVariations && (
            <Card>
              <CardContent className="p-4 space-y-1">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Variações-chave
                </p>
                <p className="text-sm font-mono text-primary">{structure.keyVariations}</p>
              </CardContent>
            </Card>
          )}

          {/* Why it matters */}
          {structure.whyItMatters && (
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="p-4 space-y-1">
                <p className="text-xs font-semibold text-primary uppercase tracking-wide">
                  Por que importa
                </p>
                <p className="text-sm">{structure.whyItMatters}</p>
              </CardContent>
            </Card>
          )}

          {/* Common mistakes */}
          {structure.commonMistakes && (
            <Card className="bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800">
              <CardContent className="p-4 space-y-1">
                <p className="text-xs font-semibold text-red-600 dark:text-red-400 uppercase tracking-wide">
                  Erros comuns
                </p>
                <p className="text-sm text-red-800 dark:text-red-200">{structure.commonMistakes}</p>
              </CardContent>
            </Card>
          )}

          {/* Examples */}
          {structure.examples.length > 0 && (
            <Card>
              <CardContent className="p-4 space-y-3">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Exemplos
                </p>
                {structure.examples.slice(0, 3).map((ex) => (
                  <div key={ex.id} className="space-y-0.5">
                    <p className="text-sm italic">"{ex.sentence}"</p>
                    {ex.translation && (
                      <p className="text-xs text-muted-foreground">{ex.translation}</p>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={onSkip}
              className="flex-1 px-4 py-2.5 rounded-lg border border-border text-sm text-muted-foreground hover:bg-accent transition-colors"
            >
              Próximo
            </button>
            <button
              onClick={onNext}
              className="flex-1 inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground px-4 py-2.5 rounded-lg font-semibold hover:bg-primary/90 transition-colors"
            >
              <CheckCircle className="h-4 w-4" />
              Entendido
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function GrammarStudyPage() {
  const { learningLanguage } = useLearningLanguage();
  const [structures, setStructures] = useState<GrammarStructure[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [sessionComplete, setSessionComplete] = useState(false);
  const [reviewedCount, setReviewedCount] = useState(0);

  const fetchStructures = useCallback(() => {
    setLoading(true);
    setCurrentIndex(0);
    setSessionComplete(false);
    setReviewedCount(0);
    fetch(`/api/grammar/study?limit=10&language=${learningLanguage}`)
      .then((r) => r.json())
      .then((d) => setStructures(d.structures || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [learningLanguage]);

  useEffect(() => {
    fetchStructures();
  }, [fetchStructures]);

  const advance = useCallback(
    (counted: boolean) => {
      if (counted) setReviewedCount((c) => c + 1);
      if (currentIndex >= structures.length - 1) {
        setSessionComplete(true);
      } else {
        setCurrentIndex((i) => i + 1);
      }
    },
    [currentIndex, structures.length],
  );

  if (loading) {
    return (
      <div className="container py-8 max-w-2xl mx-auto text-center">
        <p className="text-muted-foreground">Carregando estruturas...</p>
      </div>
    );
  }

  if (sessionComplete) {
    return (
      <div className="container py-8 max-w-2xl mx-auto text-center space-y-6">
        <div>
          <div className="text-5xl mb-4">📚</div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Sessão concluída!</h1>
          <p className="text-muted-foreground">
            Você revisou <strong>{reviewedCount}</strong> estrutura{reviewedCount !== 1 ? 's' : ''}{' '}
            gramaticais.
          </p>
        </div>
        <div className="flex justify-center gap-3 flex-wrap">
          <Button onClick={fetchStructures}>
            <RotateCcw className="mr-2 h-4 w-4" />
            Nova sessão
          </Button>
          <Link href="/study">
            <Button variant="outline">← Estudar</Button>
          </Link>
        </div>
      </div>
    );
  }

  const current = structures[currentIndex];

  return (
    <div className="container py-8 max-w-3xl mx-auto">
      <div className="mb-6 flex items-center gap-4">
        <Link href="/study">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-xl font-bold tracking-tight flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            Gramática
          </h1>
          <p className="text-muted-foreground text-sm">
            {structures.length > 0
              ? `${currentIndex + 1} de ${structures.length}`
              : 'Sem estruturas'}
          </p>
        </div>
      </div>

      {structures.length > 0 && (
        <div className="mb-6 h-1.5 bg-border rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all duration-500"
            style={{ width: `${(currentIndex / structures.length) * 100}%` }}
          />
        </div>
      )}

      {current ? (
        <GrammarCard
          key={current.id}
          structure={current}
          onNext={() => advance(true)}
          onSkip={() => advance(false)}
          index={currentIndex}
          total={structures.length}
        />
      ) : (
        <div className="text-center py-16 text-muted-foreground">
          Nenhuma estrutura disponível para praticar.
        </div>
      )}
    </div>
  );
}
