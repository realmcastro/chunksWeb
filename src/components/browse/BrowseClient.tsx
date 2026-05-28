'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { BookOpen, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { useTranslation } from '@/lib/i18n/I18nProvider';
import { useLearningLanguage } from '@/lib/contexts/LearningLanguageContext';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

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

type BrowseClientProps = {
  initialChunks: LocalChunk[];
  initialCategories: LocalCategory[];
  initialTotalCount: number;
};

const ITEMS_PER_PAGE = 50;

export function BrowseClient({
  initialChunks,
  initialCategories,
  initialTotalCount,
}: BrowseClientProps) {
  const { t } = useTranslation();
  const { learningLanguage } = useLearningLanguage();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [chunks, setChunks] = useState<LocalChunk[]>(initialChunks);
  const [categories, setCategories] = useState<LocalCategory[]>(initialCategories);
  const [totalCount, setTotalCount] = useState(initialTotalCount);
  const [loading, setLoading] = useState(false);

  const categoryId = searchParams.get('category') ? parseInt(searchParams.get('category')!) : null;
  const searchQuery = searchParams.get('search') || '';
  const acquisitionPriority = searchParams.get('priority') || '';
  const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
  const offset = (page - 1) * ITEMS_PER_PAGE;
  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  /*
  ! learningLanguage deve estar nas deps — uma mudança de idioma invalida os chunks exibidos.
  ? Sem language, a API retorna chunks de todos os idiomas misturados.
  */
  const fetchChunks = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.set('search', searchQuery);
      if (categoryId) params.set('category', categoryId.toString());
      if (acquisitionPriority) params.set('priority', acquisitionPriority);
      params.set('limit', ITEMS_PER_PAGE.toString());
      params.set('offset', offset.toString());
      params.set('language', learningLanguage);

      const response = await fetch(`/api/chunks/browse?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setChunks(data.chunks || []);
        setTotalCount(data.totalCount || 0);
      }
    } catch (error) {
      console.error('Failed to fetch chunks:', error);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, categoryId, acquisitionPriority, offset, learningLanguage]);

  useEffect(() => {
    fetchChunks();
  }, [fetchChunks]);

  const buildQueryString = useCallback((params: Record<string, string | number | undefined>) => {
    const searchParamsNew = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        searchParamsNew.set(key, String(value));
      }
    });
    return searchParamsNew.toString();
  }, []);

  const handleSearch = useCallback(
    (formData: FormData) => {
      const search = formData.get('search') as string;
      const params = new URLSearchParams(searchParams.toString());
      if (search) {
        params.set('search', search);
      } else {
        params.delete('search');
      }
      params.delete('page');
      router.push(`/browse?${params.toString()}`);
    },
    [router, searchParams],
  );

  const handlePriorityChange = useCallback(
    (priority: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (priority) {
        params.set('priority', priority);
      } else {
        params.delete('priority');
      }
      params.delete('page');
      router.push(`/browse?${params.toString()}`);
    },
    [router, searchParams],
  );

  const handleCategoryChange = useCallback(
    (category: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (category) {
        params.set('category', category);
      } else {
        params.delete('category');
      }
      params.delete('page');
      router.push(`/browse?${params.toString()}`);
    },
    [router, searchParams],
  );

  const getCategoryById = (id: number) => categories.find((c) => c.id === id);

  // Filter to only show chunk-type categories (grammar categories have their own page)
  const filteredCategories = categories.filter((cat) => cat.type === 'chunk');

  return (
    <div className="container py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight mb-2">{t('browse.title')}</h1>
        <p className="text-muted-foreground">
          {t('browse.showing', {
            start: totalCount > 0 ? offset + 1 : 0,
            end: Math.min(offset + chunks.length, totalCount),
            total: totalCount,
          })}
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-4 mb-8">
        <form
          className="flex-1 relative"
          onSubmit={(e) => {
            e.preventDefault();
            handleSearch(new FormData(e.currentTarget));
          }}
        >
          {acquisitionPriority && (
            <input type="hidden" name="priority" value={acquisitionPriority} />
          )}
          {categoryId && <input type="hidden" name="category" value={categoryId} />}
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            name="search"
            placeholder={t('browse.searchPlaceholder')}
            defaultValue={searchQuery}
            className="pl-10"
          />
          <Button type="submit" className="absolute right-1 top-1/2 -translate-y-1/2 h-8">
            {t('buttons.search')}
          </Button>
        </form>

        <div className="flex flex-wrap gap-2">
          <div className="flex gap-2">
            <select
              name="priority"
              className="px-3 py-2 rounded-lg border bg-background text-sm"
              value={acquisitionPriority}
              onChange={(e) => handlePriorityChange(e.target.value)}
            >
              <option value="">{t('browse.priority.all')}</option>
              <option value="Automatic production">{t('browse.priority.automatic')}</option>
              <option value="Active recall">{t('browse.priority.active')}</option>
              <option value="Passive recognition">{t('browse.priority.passive')}</option>
              <option value="Unknown">{t('browse.priority.unknown')}</option>
            </select>
          </div>

          <div className="flex gap-2">
            <select
              name="category"
              className="px-3 py-2 rounded-lg border bg-background text-sm"
              value={categoryId?.toString() || ''}
              onChange={(e) => handleCategoryChange(e.target.value)}
            >
              <option value="">{t('browse.category.all')}</option>
              {filteredCategories.map((cat) => (
                <option key={cat.id} value={cat.id.toString()}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <Suspense fallback={<div className="text-center py-12">{t('common.loading')}</div>}>
        {loading ? (
          <div className="text-center py-12">{t('common.loading')}</div>
        ) : chunks.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium mb-2">{t('browse.noResults')}</p>
            <p className="text-sm">{t('browse.tryAdjusting')}</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {chunks.map((chunk) => {
              const category = getCategoryById(chunk.category_id);
              return (
                <Link key={chunk.id} href={`/chunk/${chunk.id}`}>
                  <Card className="h-full hover:border-primary/50 transition-colors cursor-pointer">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h3 className="font-semibold text-lg leading-tight">{chunk.chunk_text}</h3>
                        {category && (
                          <span
                            className="text-xs px-2 py-0.5 rounded-full shrink-0"
                            style={{
                              backgroundColor: category.color_hex || '#607d8b',
                              color: 'white',
                            }}
                          >
                            {category.code}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                        {chunk.meaning}
                      </p>
                      {chunk.pattern && (
                        <p className="text-xs font-mono text-muted-foreground/70 bg-muted/50 px-2 py-1 rounded">
                          {chunk.pattern}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}
      </Suspense>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-8">
          <Link
            href={`/browse?${buildQueryString({ ...Object.fromEntries(searchParams.entries()), page: page - 1 })}`}
            className={`p-2 rounded-md ${page <= 1 ? 'pointer-events-none opacity-50' : ''}`}
          >
            <Button variant="outline" disabled={page <= 1}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </Link>

          <div className="flex items-center gap-1">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum: number;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (page <= 3) {
                pageNum = i + 1;
              } else if (page >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = page - 2 + i;
              }
              return (
                <Link
                  key={pageNum}
                  href={`/browse?${buildQueryString({ ...Object.fromEntries(searchParams.entries()), page: pageNum })}`}
                >
                  <Button variant={page === pageNum ? 'default' : 'outline'} size="sm">
                    {pageNum}
                  </Button>
                </Link>
              );
            })}
          </div>

          <Link
            href={`/browse?${buildQueryString({ ...Object.fromEntries(searchParams.entries()), page: page + 1 })}`}
            className={`p-2 rounded-md ${page >= totalPages ? 'pointer-events-none opacity-50' : ''}`}
          >
            <Button variant="outline" disabled={page >= totalPages}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}
