'use client';

import { useState, useEffect, useCallback, use } from 'react';
import Link from 'next/link';
import { ArrowLeft, RotateCcw, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { cn } from '@/lib/utils/cn';
import { useLearningLanguage } from '@/lib/contexts/LearningLanguageContext';

interface Chunk {
  id: string;
  chunk: string;
  meaning: string;
  note?: string | null;
  examples: { id: string; sentence: string; translation?: string }[];
  category: { id: string; name: string; level: string; color: string };
}

function FlashCard({ chunk, onNext, index, total }: {
  chunk: Chunk;
  onNext: () => void;
  index: number;
  total: number;
}) {
  const [flipped, setFlipped] = useState(false);

  // Reset flip when chunk changes
  useEffect(() => { setFlipped(false); }, [chunk.id]);

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      {/* Card */}
      <div
        className="cursor-pointer select-none"
        onClick={() => !flipped && setFlipped(true)}
      >
        <Card className={cn(
          'transition-all duration-200 min-h-[200px]',
          !flipped && 'hover:border-primary/50 hover:shadow-md',
        )}>
          <CardContent className="p-8 flex flex-col items-center justify-center text-center min-h-[200px] space-y-4">
            {!flipped ? (
              <>
                <div
                  className="w-3 h-3 rounded-full mb-2"
                  style={{ backgroundColor: chunk.category.color }}
                />
                <h2 className="text-3xl font-bold font-serif">{chunk.chunk}</h2>
                <p className="text-sm text-muted-foreground mt-2">Toque para ver o significado</p>
              </>
            ) : (
              <div className="space-y-4 w-full text-left animate-in fade-in-0 duration-200">
                <div className="text-center">
                  <p className="text-xl font-bold font-serif mb-1">{chunk.chunk}</p>
                  <p className="text-sm font-semibold text-primary">{chunk.meaning}</p>
                </div>

                {chunk.note && (
                  <div className="p-3 rounded-lg bg-muted/50 text-sm text-muted-foreground">
                    {chunk.note}
                  </div>
                )}

                {chunk.examples.length > 0 && (
                  <div className="space-y-2 pt-2 border-t border-border">
                    {chunk.examples.slice(0, 2).map((ex) => (
                      <div key={ex.id}>
                        <p className="text-sm italic">"{ex.sentence}"</p>
                        {ex.translation && (
                          <p className="text-xs text-muted-foreground">{ex.translation}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Actions */}
      {flipped ? (
        <button
          onClick={onNext}
          className="w-full inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground px-4 py-3 rounded-lg font-semibold hover:bg-primary/90 transition-colors"
        >
          {index < total - 1 ? 'Próximo' : 'Finalizar'}
          <ChevronRight className="h-4 w-4" />
        </button>
      ) : (
        <div className="text-center text-sm text-muted-foreground">
          {index + 1} de {total} — toque no card para revelar
        </div>
      )}
    </div>
  );
}

export default function CategoryDrillPage({ params }: { params: Promise<{ categoryId: string }> }) {
  const { categoryId } = use(params);
  const { learningLanguage } = useLearningLanguage();
  const [chunks, setChunks] = useState<Chunk[]>([]);
  const [categoryName, setCategoryName] = useState('');
  const [categoryColor, setCategoryColor] = useState('#607d8b');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [done, setDone] = useState(false);

  const fetchChunks = useCallback(() => {
    setLoading(true);
    setCurrentIndex(0);
    setDone(false);
    fetch(`/api/chunks/random?categoryId=${categoryId}&limit=20&language=${learningLanguage}`)
      .then((r) => r.json())
      .then((d) => {
        const raw: Chunk[] = d.chunks || [];
        setChunks(raw);
        if (raw.length > 0) {
          setCategoryName(raw[0].category?.name || '');
          setCategoryColor(raw[0].category?.color || '#607d8b');
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [categoryId, learningLanguage]);

  useEffect(() => { fetchChunks(); }, [fetchChunks]);

  const handleNext = useCallback(() => {
    if (currentIndex >= chunks.length - 1) {
      setDone(true);
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

  if (done) {
    return (
      <div className="container py-8 max-w-2xl mx-auto text-center space-y-6">
        <div>
          <div className="text-5xl mb-4">🎯</div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Sessão concluída!</h1>
          <p className="text-muted-foreground">
            Você revisou <strong>{chunks.length}</strong> chunks de <strong>{categoryName}</strong>.
          </p>
        </div>
        <div className="flex justify-center gap-3 flex-wrap">
          <Button onClick={fetchChunks}>
            <RotateCcw className="mr-2 h-4 w-4" />
            Repetir
          </Button>
          <Link href="/study/learn">
            <Button variant="outline">← Categorias</Button>
          </Link>
        </div>
      </div>
    );
  }

  const current = chunks[currentIndex];

  return (
    <div className="container py-8 max-w-3xl mx-auto">
      <div className="mb-6 flex items-center gap-4">
        <Link href="/study/learn">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div
            className="w-3 h-3 rounded-full shrink-0"
            style={{ backgroundColor: categoryColor }}
          />
          <div>
            <h1 className="text-xl font-bold tracking-tight truncate">{categoryName || 'Categoria'}</h1>
            <p className="text-muted-foreground text-sm">
              {chunks.length > 0 ? `${currentIndex + 1} de ${chunks.length}` : 'Sem chunks'}
            </p>
          </div>
        </div>
      </div>

      {chunks.length > 0 && (
        <div className="mb-6 h-1.5 bg-border rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all duration-500"
            style={{ width: `${(currentIndex / chunks.length) * 100}%` }}
          />
        </div>
      )}

      {current ? (
        <FlashCard
          key={current.id}
          chunk={current}
          onNext={handleNext}
          index={currentIndex}
          total={chunks.length}
        />
      ) : (
        <div className="text-center py-16 text-muted-foreground">
          Nenhum chunk disponível nesta categoria.
        </div>
      )}
    </div>
  );
}
