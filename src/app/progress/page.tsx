'use client';

import { useAuth } from '@/components/providers/AuthProvider';
import { redirect } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import {
  Flame, Brain, BookOpen, Target, ChevronDown, ChevronUp,
  Zap, CheckCircle, AlertCircle, XCircle, ArrowRight,
  TrendingUp, TrendingDown, Calendar,
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils/cn';

interface ProgressStats {
  totalChunks: number;
  totalGrammar: number;
  mastered: number;
  dueToday: number;
  streak: number;
  categoryProgress: {
    id: number;
    name: string;
    color_hex: string | null;
    chunks: number;
    grammarStructures: number;
    mastered: number;
    percentage: number;
  }[];
}

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

interface FeynmanAnalytics {
  qualityDistribution: { quality: number; count: number }[];
  dailyActivity: { date: string; count: number }[];
  improvingChunks: { chunk_id: number; chunk_text: string; first_quality: number; last_quality: number }[];
  decliningChunks: { chunk_id: number; chunk_text: string; first_quality: number; last_quality: number }[];
  strugglingChunks: { chunk_id: number; chunk_text: string; attempts: number; last_quality: number }[];
  totalExplanations: number;
  uniqueChunks: number;
}

const Q = {
  1: { icon: XCircle, color: 'text-red-500', bg: 'bg-red-100 dark:bg-red-950/40', border: 'border-red-200 dark:border-red-800', label: 'A rever' },
  2: { icon: AlertCircle, color: 'text-yellow-500', bg: 'bg-yellow-100 dark:bg-yellow-950/40', border: 'border-yellow-200 dark:border-yellow-800', label: 'Parcial' },
  3: { icon: CheckCircle, color: 'text-green-500', bg: 'bg-green-100 dark:bg-green-950/40', border: 'border-green-200 dark:border-green-800', label: 'Clara' },
} as const;

function formatDate(ts: number) {
  return new Date(ts * 1000).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
}

// ── Daily Goal Bar ──────────────────────────────────────────────────────────
function DailyGoalBar({ chunksToday, feynmanToday }: { chunksToday: number; feynmanToday: number }) {
  const [goal, setGoal] = useState(30);

  useEffect(() => {
    const saved = localStorage.getItem('dailyGoal');
    if (saved) setGoal(parseInt(saved, 10));
  }, []);

  const total = chunksToday + feynmanToday;
  const pct = Math.min(100, Math.round((total / goal) * 100));
  const done = total >= goal;

  return (
    <Card className={cn(done && 'border-green-300 dark:border-green-700')}>
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Target className={cn('h-5 w-5', done ? 'text-green-500' : 'text-primary')} />
            <span className="font-semibold text-sm">Meta do dia</span>
          </div>
          <span className={cn('text-sm font-bold', done ? 'text-green-600' : 'text-foreground')}>
            {total} / {goal} {done && '✓'}
          </span>
        </div>
        <div className="h-3 bg-muted rounded-full overflow-hidden">
          <div
            className={cn('h-full rounded-full transition-all duration-500', done ? 'bg-green-500' : 'bg-primary')}
            style={{ width: `${pct}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-muted-foreground mt-2">
          <span>{chunksToday} flashcards · {feynmanToday} Feynman</span>
          <span>{pct}%</span>
        </div>
      </CardContent>
    </Card>
  );
}

// ── Feynman Analytics ───────────────────────────────────────────────────────
function FeynmanAnalyticsSection({ analytics }: { analytics: FeynmanAnalytics }) {
  const total = analytics.totalExplanations;
  if (total === 0) return null;

  const dist = [1, 2, 3].map((q) => ({
    q,
    count: analytics.qualityDistribution.find((d) => d.quality === q)?.count ?? 0,
  }));

  const maxDay = Math.max(...analytics.dailyActivity.map((d) => d.count), 1);

  // Fill last 14 days
  const today = new Date();
  const last14: { date: string; count: number }[] = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const found = analytics.dailyActivity.find((a) => a.date === dateStr);
    last14.push({ date: dateStr, count: found?.count ?? 0 });
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold flex items-center gap-2">
        <TrendingUp className="h-5 w-5 text-primary" />
        Analytics — Feynman
      </h2>

      {/* Quality distribution */}
      <div className="grid grid-cols-3 gap-3">
        {dist.map(({ q, count }) => {
          const qStyle = Q[q as 1 | 2 | 3];
          const Icon = qStyle.icon;
          const pct = total > 0 ? Math.round((count / total) * 100) : 0;
          return (
            <Card key={q} className={cn(qStyle.bg, qStyle.border, 'border')}>
              <CardContent className="p-4 text-center">
                <Icon className={cn('h-5 w-5 mx-auto mb-1', qStyle.color)} />
                <p className={cn('text-2xl font-bold', qStyle.color)}>{count}</p>
                <p className="text-xs text-muted-foreground">{qStyle.label}</p>
                <p className="text-xs text-muted-foreground">{pct}%</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Activity heatmap (last 14 days) */}
      <Card>
        <CardContent className="p-5">
          <div className="flex items-center gap-2 mb-3">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-semibold">Atividade — últimos 14 dias</span>
          </div>
          <div className="flex items-end gap-1">
            {last14.map((day) => {
              const height = day.count === 0 ? 4 : Math.max(12, Math.round((day.count / maxDay) * 48));
              const label = new Date(day.date + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
              return (
                <div
                  key={day.date}
                  className="flex-1 flex flex-col items-center gap-1 group relative"
                >
                  <div
                    className={cn(
                      'w-full rounded-sm transition-all',
                      day.count === 0 ? 'bg-muted' : 'bg-primary/70 hover:bg-primary',
                    )}
                    style={{ height: `${height}px` }}
                  />
                  {/* Tooltip */}
                  <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 hidden group-hover:block z-10 pointer-events-none">
                    <div className="bg-popover border border-border text-xs rounded px-2 py-1 whitespace-nowrap shadow">
                      {label}: {day.count}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Improving / Declining */}
      {(analytics.improvingChunks.length > 0 || analytics.decliningChunks.length > 0) && (
        <div className="grid sm:grid-cols-2 gap-3">
          {analytics.improvingChunks.length > 0 && (
            <Card className="border-green-200 dark:border-green-800">
              <CardContent className="p-4 space-y-2">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="h-4 w-4 text-green-500" />
                  <span className="text-sm font-semibold text-green-700 dark:text-green-400">Melhorando</span>
                </div>
                {analytics.improvingChunks.map((c) => (
                  <div key={c.chunk_id} className="flex items-center justify-between text-sm">
                    <span className="font-medium truncate">{c.chunk_text}</span>
                    <span className="text-xs shrink-0 ml-2 text-green-600">
                      {Q[c.first_quality as 1|2|3]?.label} → {Q[c.last_quality as 1|2|3]?.label}
                    </span>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {analytics.decliningChunks.length > 0 && (
            <Card className="border-red-200 dark:border-red-800">
              <CardContent className="p-4 space-y-2">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingDown className="h-4 w-4 text-red-500" />
                  <span className="text-sm font-semibold text-red-700 dark:text-red-400">Regredindo</span>
                </div>
                {analytics.decliningChunks.map((c) => (
                  <div key={c.chunk_id} className="flex items-center justify-between text-sm">
                    <span className="font-medium truncate">{c.chunk_text}</span>
                    <span className="text-xs shrink-0 ml-2 text-red-600">
                      {Q[c.first_quality as 1|2|3]?.label} → {Q[c.last_quality as 1|2|3]?.label}
                    </span>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Struggling chunks */}
      {analytics.strugglingChunks.length > 0 && (
        <Card className="border-orange-200 dark:border-orange-800 bg-orange-50/50 dark:bg-orange-950/10">
          <CardContent className="p-4">
            <p className="text-sm font-semibold text-orange-700 dark:text-orange-400 mb-3">
              🔥 Chunks mais difíceis — foque nestes
            </p>
            <div className="space-y-2">
              {analytics.strugglingChunks.map((c) => (
                <div key={c.chunk_id} className="flex items-center justify-between text-sm">
                  <span className="font-medium">{c.chunk_text}</span>
                  <span className="text-xs text-red-500 font-semibold">{c.attempts}× a rever</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ── Evolution Pathway ───────────────────────────────────────────────────────
function EvolutionPathway({ group }: { group: ChunkGroup }) {
  const [open, setOpen] = useState(false);
  const timeline = [...group.explanations].reverse();
  const latest = group.explanations[0];
  const q = Q[latest.quality as 1 | 2 | 3] ?? Q[2];
  const Icon = q.icon;

  const first = timeline[0];
  const improved = timeline.length > 1 && latest.quality > first.quality;
  const declined = timeline.length > 1 && latest.quality < first.quality;

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-4 p-4 hover:bg-muted/40 transition-colors text-left"
      >
        <div className="flex items-center gap-0.5 shrink-0">
          {timeline.map((e, i) => (
            <span key={e.id} className="flex items-center gap-0.5">
              <span className={cn('w-2.5 h-2.5 rounded-full', {
                'bg-red-400': e.quality === 1,
                'bg-yellow-400': e.quality === 2,
                'bg-green-400': e.quality === 3,
              })} />
              {i < timeline.length - 1 && <span className="w-3 h-px bg-border" />}
            </span>
          ))}
        </div>

        <div className="flex-1 min-w-0">
          <p className="font-bold font-serif truncate">{group.chunk_text}</p>
          <p className="text-xs text-muted-foreground truncate">{group.meaning}</p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {improved && <span className="text-xs text-green-600 font-semibold hidden sm:block">↑ melhorou</span>}
          {declined && <span className="text-xs text-red-500 font-semibold hidden sm:block">↓ regrediu</span>}
          <div className={cn('flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold', q.bg, q.border, 'border')}>
            <Icon className={cn('h-3 w-3', q.color)} />
            <span className={q.color}>{q.label}</span>
          </div>
          {open ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
        </div>
      </button>

      {open && (
        <div className="border-t border-border px-4 py-4">
          <div className="relative pl-6">
            <div className="absolute left-2 top-2 bottom-2 w-px bg-border" />
            <div className="space-y-4">
              {timeline.map((e, i) => {
                const eq = Q[e.quality as 1 | 2 | 3] ?? Q[2];
                const EIcon = eq.icon;
                const isLatest = i === timeline.length - 1;
                return (
                  <div key={e.id} className="relative">
                    <div className={cn(
                      'absolute -left-6 top-1 w-4 h-4 rounded-full border-2 border-background flex items-center justify-center',
                      { 'bg-red-400': e.quality === 1, 'bg-yellow-400': e.quality === 2, 'bg-green-400': e.quality === 3 },
                    )} />
                    <div className={cn('rounded-lg p-3 border text-sm', isLatest ? eq.bg + ' ' + eq.border : 'bg-muted/30 border-border')}>
                      <div className="flex items-center gap-2 mb-1.5">
                        <EIcon className={cn('h-3.5 w-3.5', eq.color)} />
                        <span className="text-xs text-muted-foreground">{formatDate(e.created_at)}</span>
                        {isLatest && <span className="text-xs font-semibold text-muted-foreground ml-auto">mais recente</span>}
                      </div>
                      <p className="text-foreground leading-relaxed">{e.explanation}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="mt-4 p-3 rounded-lg bg-primary/5 border border-primary/15 text-xs">
            <span className="text-muted-foreground font-medium">Significado real: </span>
            <span className="text-foreground">{group.meaning}</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ProgressPage() {
  const { user, loading } = useAuth();
  const [stats, setStats] = useState<ProgressStats | null>(null);
  const [startedChunks, setStartedChunks] = useState(0);
  const [feynmanGroups, setFeynmanGroups] = useState<ChunkGroup[]>([]);
  const [feynmanTotal, setFeynmanTotal] = useState(0);
  const [feynmanAnalytics, setFeynmanAnalytics] = useState<FeynmanAnalytics | null>(null);
  const [dailyProgress, setDailyProgress] = useState({ chunksToday: 0, feynmanToday: 0 });
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      redirect('/login?redirect=/progress');
    }

    if (user) {
      Promise.all([
        fetch('/api/progress/stats').then((r) => r.json()),
        fetch('/api/feynman/history').then((r) => r.json()),
        fetch('/api/feynman/analytics').then((r) => r.json()),
        fetch('/api/progress/daily').then((r) => r.json()),
      ])
        .then(([data, feynman, analytics, daily]) => {
          setStats(data);
          setStartedChunks(data.startedChunks || 0);
          setFeynmanGroups(feynman.grouped || []);
          setFeynmanTotal(feynman.total || 0);
          setFeynmanAnalytics(analytics);
          setDailyProgress(daily);
        })
        .finally(() => setStatsLoading(false));
    } else if (!loading) {
      setStatsLoading(false);
    }
  }, [user, loading]);

  if (loading || statsLoading) {
    return (
      <div className="container py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-48 bg-muted rounded" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => <div key={i} className="h-24 bg-muted rounded" />)}
          </div>
        </div>
      </div>
    );
  }

  if (!user || !stats) return null;

  return (
    <div className="container py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-2">Progress</h1>
        <p className="text-muted-foreground">Track your learning journey</p>
      </div>

      {/* Daily Goal */}
      <DailyGoalBar
        chunksToday={dailyProgress.chunksToday}
        feynmanToday={dailyProgress.feynmanToday}
      />

      {/* Stats Overview */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <BookOpen className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-3xl font-bold">{stats.totalChunks}</p>
                <p className="text-sm text-muted-foreground">Total Chunks</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-success/10 flex items-center justify-center">
                <Target className="h-6 w-6 text-success" />
              </div>
              <div>
                <p className="text-3xl font-bold">{startedChunks}</p>
                <p className="text-sm text-muted-foreground">Started</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-warning/10 flex items-center justify-center">
                <Brain className="h-6 w-6 text-warning" />
              </div>
              <div>
                <p className="text-3xl font-bold">{stats.mastered}</p>
                <p className="text-sm text-muted-foreground">Mastered</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-destructive/10 flex items-center justify-center">
                <Flame className="h-6 w-6 text-destructive" />
              </div>
              <div>
                <p className="text-3xl font-bold">{stats.streak}</p>
                <p className="text-sm text-muted-foreground">Day Streak</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Category Progress */}
      <Card>
        <CardHeader>
          <CardTitle>Category Breakdown</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {stats.categoryProgress.map((cat) => (
            <div key={cat.id} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: cat.color_hex || '#607d8b' }}
                  />
                  <span className="font-medium">{cat.name}</span>
                </div>
                <span className="text-sm text-muted-foreground">
                  {cat.chunks} chunks, {cat.grammarStructures} grammar ({cat.mastered} mastered)
                </span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${cat.percentage}%`,
                    backgroundColor: cat.color_hex || '#607d8b',
                  }}
                />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Feynman Analytics */}
      {feynmanAnalytics && feynmanAnalytics.totalExplanations > 0 && (
        <FeynmanAnalyticsSection analytics={feynmanAnalytics} />
      )}

      {/* Feynman Evolution Pathways */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Zap className="h-5 w-5 text-primary" />
              Feynman — Evolução das Explicações
            </h2>
            {feynmanTotal > 0 && (
              <p className="text-sm text-muted-foreground mt-0.5">
                {feynmanTotal} explicação{feynmanTotal !== 1 ? 'ões' : ''} em {feynmanGroups.length} chunk{feynmanGroups.length !== 1 ? 's' : ''}
                {' · '}
                <span className="text-green-600 font-medium">
                  {feynmanGroups.filter((g) => g.explanations[0].quality === 3).length} claras
                </span>
                {' · '}
                <span className="text-red-500 font-medium">
                  {feynmanGroups.filter((g) => g.explanations[0].quality === 1).length} a rever
                </span>
              </p>
            )}
          </div>
          {feynmanGroups.length > 0 && (
            <Link
              href="/study/feynman/history"
              className="flex items-center gap-1 text-sm text-primary hover:underline"
            >
              Ver tudo
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          )}
        </div>

        {feynmanGroups.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-4xl mb-3">🧠</p>
              <p className="font-semibold mb-1">Nenhuma explicação Feynman ainda</p>
              <p className="text-sm text-muted-foreground mb-4">
                Cada vez que você explica um chunk, ele aparece aqui com o histórico completo de evolução.
              </p>
              <Link
                href="/study/feynman"
                className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-semibold hover:bg-primary/90 transition-colors"
              >
                <Zap className="h-4 w-4" />
                Iniciar Feynman
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {feynmanGroups.map((g) => (
              <EvolutionPathway key={g.chunk_id} group={g} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
