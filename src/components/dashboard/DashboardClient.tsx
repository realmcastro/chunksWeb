'use client';

import Link from 'next/link';
import { BookOpen, Brain, Calendar, Flame, Play, Zap } from 'lucide-react';
import { useTranslation } from '@/lib/i18n/I18nProvider';

type LocalChunk = {
  id: number;
  chunk_text: string;
  meaning: string;
  category_id: number;
  frequency: string | null;
  pattern: string | null;
  cefr_level_id: number | null;
};

type LocalCategory = {
  id: number;
  corpus_id: number;
  code: string;
  name: string;
  type: string;
  description: string | null;
  color_hex: string | null;
  total_entries: number;
};

type DashboardStats = {
  totalChunks: number;
  totalCategories: number;
  dueToday: number;
  streak: number;
};

type DashboardClientProps = {
  stats: DashboardStats;
  recentChunks: LocalChunk[];
  categories: LocalCategory[];
};

export function DashboardClient({ stats, recentChunks, categories }: DashboardClientProps) {
  const { t } = useTranslation();

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('dashboard.title')}</h1>
          <p className="text-muted-foreground mt-1">
            {t('dashboard.chunksAcross', {
              chunks: stats.totalChunks,
              categories: stats.totalCategories,
            })}
          </p>
        </div>
        <Link
          href="/study"
          className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
        >
          <Play className="h-4 w-4" />
          {t('dashboard.startStudy')}
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={<BookOpen className="h-5 w-5" />}
          label={t('dashboard.totalChunks')}
          value={stats.totalChunks.toString()}
          color="primary"
        />
        <StatCard
          icon={<Calendar className="h-5 w-5" />}
          label={t('dashboard.dueToday')}
          value={stats.dueToday.toString()}
          color="warning"
        />
        <StatCard
          icon={<Brain className="h-5 w-5" />}
          label={t('dashboard.categoriesCount')}
          value={stats.totalCategories.toString()}
          color="success"
        />
        <StatCard
          icon={<Flame className="h-5 w-5" />}
          label={t('dashboard.streak')}
          value={stats.streak.toString()}
          color="danger"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <QuickActionCard
          href="/browse"
          icon={<BookOpen className="h-6 w-6" />}
          title={t('dashboard.browseChunks')}
          description={t('dashboard.exploreMaterials')}
          color="primary"
        />
        <QuickActionCard
          href="/study"
          icon={<Brain className="h-6 w-6" />}
          title={t('dashboard.studyNow')}
          description={t('dashboard.reviewDue')}
          color="success"
        />
        <QuickActionCard
          href="/progress"
          icon={<Zap className="h-6 w-6" />}
          title={t('dashboard.trackProgress')}
          description={t('dashboard.viewJourney')}
          color="warning"
        />
      </div>

      <div className="rounded-lg border bg-card">
        <div className="px-6 py-4 border-b">
          <h2 className="font-semibold text-lg">{t('dashboard.recentChunks')}</h2>
        </div>
        <div className="divide-y">
          {recentChunks.length === 0 ? (
            <div className="px-6 py-8 text-center text-muted-foreground">
              {t('dashboard.noChunksYet')}
            </div>
          ) : (
            recentChunks.map((chunk) => (
              <Link
                key={chunk.id}
                href={`/chunk/${chunk.id}`}
                className="flex items-center gap-4 px-6 py-3 hover:bg-muted/50 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{chunk.chunk_text}</p>
                  <p className="text-sm text-muted-foreground truncate">{chunk.meaning}</p>
                </div>
                <span className="text-xs text-muted-foreground">
                  {chunk.frequency || 0} {t('dashboard.freq')}
                </span>
              </Link>
            ))
          )}
        </div>
      </div>

      <div className="rounded-lg border bg-card">
        <div className="px-6 py-4 border-b">
          <h2 className="font-semibold text-lg">{t('dashboard.categories')}</h2>
        </div>
        <div className="divide-y">
          {categories.slice(0, 8).map((cat) => {
            const colorClass = cat.color_hex || '#607d8b';
            return (
              <Link
                key={cat.id}
                href={`/browse?category=${cat.id}`}
                className="flex items-center gap-4 px-6 py-3 hover:bg-muted/50 transition-colors"
              >
                <div
                  className="w-3 h-3 rounded-full shrink-0"
                  style={{ backgroundColor: colorClass }}
                />
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{cat.name}</p>
                  {cat.description && (
                    <p className="text-sm text-muted-foreground truncate">{cat.description}</p>
                  )}
                </div>
                <span className="text-sm text-muted-foreground">
                  {cat.total_entries} {t('dashboard.chunks')}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: 'primary' | 'success' | 'warning' | 'danger';
}) {
  const colorClasses = {
    primary: 'bg-primary/10 text-primary',
    success: 'bg-success/10 text-success',
    warning: 'bg-warning/10 text-warning',
    danger: 'bg-destructive/10 text-destructive',
  };

  return (
    <div className="rounded-lg border bg-card p-4">
      <div
        className={`w-10 h-10 rounded-lg ${colorClasses[color]} flex items-center justify-center mb-3`}
      >
        {icon}
      </div>
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  );
}

function QuickActionCard({
  href,
  icon,
  title,
  description,
  color,
}: {
  href: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  color: 'primary' | 'success' | 'warning';
}) {
  const colorClasses = {
    primary: 'border-primary/20 hover:border-primary/50 hover:bg-primary/5',
    success: 'border-success/20 hover:border-success/50 hover:bg-success/5',
    warning: 'border-warning/20 hover:border-warning/50 hover:bg-warning/5',
  };

  return (
    <Link
      href={href}
      className={`rounded-lg border bg-card p-6 transition-colors ${colorClasses[color]}`}
    >
      <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center mb-4">
        {icon}
      </div>
      <h3 className="font-semibold mb-1">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </Link>
  );
}
