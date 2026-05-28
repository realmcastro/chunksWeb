'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, CheckCircle, AlertCircle, XCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';

interface ExplanationEntry {
  id: number;
  explanation: string;
  quality: number;
  created_at: number;
}

interface ChunkGroup {
  chunk_id: number;
  chunk_text: string;
  meaning: string;
  explanations: ExplanationEntry[];
}

const QUALITY_LABEL: Record<number, { label: string; icon: typeof CheckCircle; color: string }> = {
  1: { label: 'A rever', icon: XCircle, color: 'text-red-500' },
  2: { label: 'Parcial', icon: AlertCircle, color: 'text-yellow-500' },
  3: { label: 'Clara', icon: CheckCircle, color: 'text-green-500' },
};

function formatDate(ts: number) {
  return new Date(ts * 1000).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function ChunkCard({ group }: { group: ChunkGroup }) {
  const [expanded, setExpanded] = useState(false);
  const latest = group.explanations[0];
  const q = QUALITY_LABEL[latest.quality] ?? QUALITY_LABEL[2];
  const Icon = q.icon;
  const hasMultiple = group.explanations.length > 1;

  return (
    <Card>
      <CardContent className="p-5 space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <p className="font-bold text-lg font-serif">{group.chunk_text}</p>
            <p className="text-sm text-muted-foreground">{group.meaning}</p>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <Icon className={`h-4 w-4 ${q.color}`} />
            <span className={`text-xs font-semibold ${q.color}`}>{q.label}</span>
          </div>
        </div>

        {/* Latest explanation */}
        <div className="p-3 rounded-lg bg-primary/5 border border-primary/10">
          <p className="text-xs text-muted-foreground mb-1">{formatDate(latest.created_at)}</p>
          <p className="text-sm">{latest.explanation}</p>
        </div>

        {/* Older explanations (collapsed by default) */}
        {hasMultiple && (
          <div>
            <button
              onClick={() => setExpanded((e) => !e)}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
              {expanded ? 'Ocultar' : `Ver ${group.explanations.length - 1} explicação${group.explanations.length > 2 ? 'ões' : ''} anterior${group.explanations.length > 2 ? 'es' : ''}`}
            </button>

            {expanded && (
              <div className="mt-3 space-y-2 border-l-2 border-border pl-4">
                {group.explanations.slice(1).map((e) => {
                  const eq = QUALITY_LABEL[e.quality] ?? QUALITY_LABEL[2];
                  const EIcon = eq.icon;
                  return (
                    <div key={e.id} className="space-y-1">
                      <div className="flex items-center gap-1.5">
                        <EIcon className={`h-3 w-3 ${eq.color}`} />
                        <span className="text-xs text-muted-foreground">{formatDate(e.created_at)}</span>
                      </div>
                      <p className="text-sm text-muted-foreground">{e.explanation}</p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function FeynmanHistoryPage() {
  const [grouped, setGrouped] = useState<ChunkGroup[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 1 | 2 | 3>('all');

  useEffect(() => {
    fetch('/api/feynman/history')
      .then((r) => r.json())
      .then((d) => {
        setGrouped(d.grouped || []);
        setTotal(d.total || 0);
      })
      .finally(() => setLoading(false));
  }, []);

  const filtered = filter === 'all'
    ? grouped
    : grouped.filter((g) => g.explanations[0].quality === filter);

  return (
    <div className="container py-8 max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-6 flex items-center gap-4">
        <Link href="/study/feynman">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold tracking-tight">Diário de Explicações</h1>
          <p className="text-muted-foreground text-sm">
            {loading ? '...' : `${total} explicação${total !== 1 ? 'ões' : ''} em ${grouped.length} chunk${grouped.length !== 1 ? 's' : ''}`}
          </p>
        </div>
      </div>

      {/* Filter bar */}
      {!loading && grouped.length > 0 && (
        <div className="flex gap-2 mb-6 flex-wrap">
          {(['all', 3, 2, 1] as const).map((f) => {
            const labels = { all: 'Todos', 3: '✅ Claras', 2: '🟡 Parciais', 1: '❌ A rever' };
            return (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                  filter === f
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-background border-border text-muted-foreground hover:border-primary/50'
                }`}
              >
                {labels[f]}
              </button>
            );
          })}
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-muted animate-pulse rounded-xl" />
          ))}
        </div>
      ) : grouped.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-4xl mb-4">📝</p>
          <p className="text-lg font-semibold mb-2">Nenhuma explicação ainda</p>
          <p className="text-muted-foreground mb-6">Complete uma sessão Feynman para ver seu diário aqui.</p>
          <Link href="/study/feynman">
            <Button>Iniciar Feynman</Button>
          </Link>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          Nenhum chunk com esse filtro.
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((g) => (
            <ChunkCard key={g.chunk_id} group={g} />
          ))}
        </div>
      )}
    </div>
  );
}
