'use client';

import { useState, useCallback, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, History } from 'lucide-react';
import { FeynmanMode } from '@/components/study/FeynmanMode';
import { Button } from '@/components/ui/Button';
import { useLearningLanguage } from '@/lib/contexts/LearningLanguageContext';

interface FeynmanChunk {
  id: string;
  chunk: string;
  meaning: string;
  explanation?: string | null;
  examples: { id: string; sentence: string; translation?: string }[];
  category: { id: string; name: string; level: string };
}

export default function FeynmanPage() {
  const { learningLanguage } = useLearningLanguage();
  const [chunks, setChunks] = useState<FeynmanChunk[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [sessionComplete, setSessionComplete] = useState(false);
  const [completedCount, setCompletedCount] = useState(0);
  const [qualityCounts, setQualityCounts] = useState({ perfect: 0, good: 0, needsWork: 0 });

  useEffect(() => {
    fetch(`/api/feynman/chunks?limit=10&language=${learningLanguage}`)
      .then((r) => r.json())
      .then((d) => setChunks(d.chunks || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [learningLanguage]);

  const handleComplete = useCallback(
    (quality: number) => {
      setCompletedCount((c) => c + 1);
      setQualityCounts((q) => ({
        perfect: q.perfect + (quality === 3 ? 1 : 0),
        good: q.good + (quality === 2 ? 1 : 0),
        needsWork: q.needsWork + (quality === 1 ? 1 : 0),
      }));

      if (currentIndex >= chunks.length - 1) {
        setSessionComplete(true);
        fetch('/api/session/end', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            mode: 'feynman',
            chunksReviewed: completedCount + 1,
            chunksMastered: qualityCounts.perfect + (quality === 3 ? 1 : 0),
          }),
        }).catch(() => {});
      } else {
        setCurrentIndex((i) => i + 1);
      }
    },
    [currentIndex, chunks.length, completedCount, qualityCounts],
  );

  const handleSkip = useCallback(() => {
    if (currentIndex >= chunks.length - 1) {
      setSessionComplete(true);
    } else {
      setCurrentIndex((i) => i + 1);
    }
  }, [currentIndex, chunks.length]);

  if (loading) {
    return (
      <div className="container py-8 max-w-2xl mx-auto text-center">
        <p className="text-muted-foreground">Carregando chunks...</p>
      </div>
    );
  }

  if (sessionComplete) {
    const total = qualityCounts.perfect + qualityCounts.good + qualityCounts.needsWork;
    return (
      <div className="container py-8 max-w-2xl mx-auto text-center">
        <div className="mb-8">
          <div className="text-5xl mb-4">
            {qualityCounts.perfect === completedCount && completedCount > 0 ? '🏆' : '🧠'}
          </div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Sessão concluída!</h1>
          {completedCount > 0 ? (
            <p className="text-muted-foreground">
              Você explicou <strong>{completedCount}</strong> chunk{completedCount > 1 ? 's' : ''}.
            </p>
          ) : (
            <p className="text-muted-foreground">Nenhuma explicação esta sessão.</p>
          )}
        </div>

        {total > 0 && (
          <div className="grid grid-cols-3 gap-3 mb-8 max-w-sm mx-auto">
            <div className="p-3 rounded-lg bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800">
              <p className="text-2xl font-bold text-green-600">{qualityCounts.perfect}</p>
              <p className="text-xs text-green-600">Claras</p>
            </div>
            <div className="p-3 rounded-lg bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-800">
              <p className="text-2xl font-bold text-yellow-600">{qualityCounts.good}</p>
              <p className="text-xs text-yellow-600">Parciais</p>
            </div>
            <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800">
              <p className="text-2xl font-bold text-red-600">{qualityCounts.needsWork}</p>
              <p className="text-xs text-red-600">A rever</p>
            </div>
          </div>
        )}

        <div className="flex justify-center gap-3 flex-wrap">
          <Link href="/study/feynman/history">
            <Button variant="outline">
              <History className="mr-2 h-4 w-4" />
              Ver minhas explicações
            </Button>
          </Link>
          <Link href="/study/feynman">
            <Button
              onClick={() => {
                setSessionComplete(false);
                setCurrentIndex(0);
                setCompletedCount(0);
                setQualityCounts({ perfect: 0, good: 0, needsWork: 0 });
              }}
            >
              Nova sessão
            </Button>
          </Link>
          <Link href="/study">
            <Button variant="ghost">← Estudar</Button>
          </Link>
        </div>
      </div>
    );
  }

  const currentChunk = chunks[currentIndex];

  return (
    <div className="container py-8 max-w-3xl mx-auto">
      <div className="mb-6 flex items-center gap-4">
        <Link href="/study">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-xl font-bold tracking-tight">Método Feynman</h1>
          <p className="text-muted-foreground text-sm">
            {chunks.length > 0 ? `${currentIndex + 1} de ${chunks.length}` : 'Sem chunks'}
          </p>
        </div>
        <Link
          href="/study/feynman/history"
          className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1"
        >
          <History className="h-4 w-4" />
          Histórico
        </Link>
      </div>

      {chunks.length > 0 && (
        <div className="mb-6 h-1.5 bg-border rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all duration-500"
            style={{ width: `${(currentIndex / chunks.length) * 100}%` }}
          />
        </div>
      )}

      {currentChunk ? (
        <FeynmanMode
          key={currentChunk.id}
          chunk={currentChunk}
          onComplete={handleComplete}
          onSkip={handleSkip}
        />
      ) : (
        <div className="text-center py-16 text-muted-foreground">
          Nenhum chunk disponível para praticar.
        </div>
      )}
    </div>
  );
}
