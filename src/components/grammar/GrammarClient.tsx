'use client';

import { useState, useEffect, useCallback, useRef, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  BookOpen,
  Search,
  ChevronLeft,
  ChevronRight,
  Volume2,
  Languages,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { useTranslation } from '@/lib/i18n/I18nProvider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { translateText, isTranslationAvailable, SupportedLanguage } from '@/lib/translation';
import { useTTSPlaybackClient } from '@/lib/pronunciation/hooks/useTTSPlaybackClient';
import type { Locale } from '@/lib/pronunciation/types';
import { useLearningLanguage } from '@/lib/contexts/LearningLanguageContext';
import { toast } from '@/lib/hooks/useToast';

/*
! Invariantes, contratos, pré-condições e decisões críticas e riscos.
? Descrição técnica relevante que não seja óbvia pelo nome.

- GrammarClient: Client component for grammar structures browsing
- Shows expandable cards with TTS, translation, and examples
- Each card can expand to show all examples (up to 3)
- TTS uses existing pronunciation system
- Translate button shows translation of example text
*/

type LocalGrammarStructure = {
  id: number;
  category_id: number;
  structure_label: string;
  core_meaning: string;
  primary_function: string | null;
  pattern: string | null;
  key_forms: string | null;
  essential_vocabulary: string | null;
  when_to_use: string | null;
  why_it_matters: string | null;
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

type GrammarExample = {
  id: number;
  text_en: string;
  text_target: string | null;
};

type GrammarClientProps = {
  initialStructures: LocalGrammarStructure[];
  initialCategories: LocalCategory[];
  initialTotalCount: number;
};

const ITEMS_PER_PAGE = 50;

export function GrammarClient({
  initialStructures,
  initialCategories,
  initialTotalCount,
}: GrammarClientProps) {
  const { t, language } = useTranslation();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [structures, setStructures] = useState<LocalGrammarStructure[]>(initialStructures);
  const [categories, setCategories] = useState<LocalCategory[]>(initialCategories);
  const [totalCount, setTotalCount] = useState(initialTotalCount);
  const [loading, setLoading] = useState(false);

  // TTS locale deve refletir o idioma do conteúdo estudado, não o idioma da UI
  const { learningLanguage } = useLearningLanguage();
  const locale = (
    learningLanguage === 'fr' ? 'fr-FR' : learningLanguage === 'de' ? 'de-DE' : 'en-US'
  ) as Locale;

  // State for expandable cards and their examples
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());
  const [examplesLoading, setExamplesLoading] = useState<Record<number, boolean>>({});
  const [examplesMap, setExamplesMap] = useState<Record<number, GrammarExample[]>>({});
  // Ref to track which structure IDs have been fetched (avoids stale closure race conditions)
  const fetchedExampleIds = useRef<Set<number>>(new Set());

  // State for per-example translations using composite key "structureId-exampleId"
  const [translations, setTranslations] = useState<Record<string, string>>({});
  const [translatingKey, setTranslatingKey] = useState<Record<string, boolean>>({});

  const categoryId = searchParams.get('category') ? parseInt(searchParams.get('category')!) : null;
  const searchQuery = searchParams.get('search') || '';
  const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
  const offset = (page - 1) * ITEMS_PER_PAGE;
  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  /*
  ! learningLanguage nas deps garante re-fetch ao trocar idioma no seletor.
  ? Sem language, a API retorna estruturas de todos os idiomas disponíveis.
  */
  const fetchStructures = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.set('search', searchQuery);
      if (categoryId) params.set('category', categoryId.toString());
      params.set('limit', ITEMS_PER_PAGE.toString());
      params.set('offset', offset.toString());
      params.set('language', learningLanguage);

      const response = await fetch(`/api/grammar/structures?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setStructures(data.structures || []);
        setTotalCount(data.totalCount || 0);
      }
    } catch (error) {
      console.error('Failed to fetch structures:', error);
      toast.error('Failed to load grammar structures', { description: 'Check your connection and try again.' });
    } finally {
      setLoading(false);
    }
  }, [searchQuery, categoryId, offset, learningLanguage]);

  useEffect(() => {
    fetchStructures();
  }, [fetchStructures]);

  // Fetch examples when a card is expanded — ref prevents duplicate in-flight fetches
  useEffect(() => {
    const fetchExamples = async (structureId: number) => {
      if (fetchedExampleIds.current.has(structureId)) return;
      fetchedExampleIds.current.add(structureId);

      setExamplesLoading((prev) => ({ ...prev, [structureId]: true }));
      try {
        const response = await fetch(`/api/grammar/structures/${structureId}/examples`);
        if (response.ok) {
          const data = await response.json();
          setExamplesMap((prev) => ({ ...prev, [structureId]: data.examples || [] }));
        } else {
          fetchedExampleIds.current.delete(structureId);
        }
      } catch (error) {
        console.error('Failed to fetch examples:', error);
        toast.error('Failed to load examples', { description: 'Could not fetch examples for this structure.' });
        fetchedExampleIds.current.delete(structureId);
      } finally {
        setExamplesLoading((prev) => ({ ...prev, [structureId]: false }));
      }
    };

    expandedIds.forEach((id) => fetchExamples(id));
  }, [expandedIds]);

  const toggleExpanded = useCallback((structureId: number) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(structureId)) {
        next.delete(structureId);
      } else {
        next.add(structureId);
      }
      return next;
    });
  }, []);

  const handleTranslateExample = useCallback(
    async (structureId: number, exampleId: number, text: string) => {
      if (!isTranslationAvailable(language)) return;

      const key = `${structureId}-${exampleId}`;
      if (translations[key]) {
        setTranslations((prev) => {
          const next = { ...prev };
          delete next[key];
          return next;
        });
        return;
      }

      setTranslatingKey((prev) => ({ ...prev, [key]: true }));
      try {
        const translated = await translateText(text, language as SupportedLanguage, learningLanguage);
        setTranslations((prev) => ({ ...prev, [key]: translated }));
      } catch (error) {
        console.error('Failed to translate:', error);
        toast.error('Translation failed', { description: 'Could not translate this example.' });
      } finally {
        setTranslatingKey((prev) => ({ ...prev, [key]: false }));
      }
    },
    [language, translations],
  );

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
      router.push(`/grammar?${params.toString()}`);
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
      router.push(`/grammar?${params.toString()}`);
    },
    [router, searchParams],
  );

  const filteredCategories = categories.filter(
    (c) => c.type === 'foundation' || c.type === 'grammar',
  );

  return (
    <div className="container py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight mb-2">{t('grammar.title')}</h1>
        <p className="text-muted-foreground">
          {t('grammar.showing', {
            start: totalCount > 0 ? offset + 1 : 0,
            end: Math.min(offset + structures.length, totalCount),
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
          {categoryId && <input type="hidden" name="category" value={categoryId} />}
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            name="search"
            placeholder={t('grammar.searchPlaceholder')}
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
              name="category"
              className="px-3 py-2 rounded-lg border bg-background text-sm"
              value={categoryId?.toString() || ''}
              onChange={(e) => handleCategoryChange(e.target.value)}
            >
              <option value="">{t('grammar.categoryAll')}</option>
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
        ) : structures.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium mb-2">{t('grammar.noResults')}</p>
            <p className="text-sm">{t('grammar.tryAdjusting')}</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-1 lg:grid-cols-2 items-start">
            {structures.map((structure) => {
              const category = categories.find((c) => c.id === structure.category_id);
              const isExpanded = expandedIds.has(structure.id);
              const isLoadingExamples = examplesLoading[structure.id];
              const examples = examplesMap[structure.id] || [];

              return (
                <Card key={structure.id} className="hover:border-primary/50 transition-colors">
                  <CardHeader
                    className="cursor-pointer select-none"
                    onClick={() => toggleExpanded(structure.id)}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="flex-1">
                        <span className="text-lg">{structure.structure_label}</span>
                      </CardTitle>
                      <div className="flex items-center gap-2">
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
                        {isExpanded ? (
                          <ChevronUp className="h-4 w-4 ml-2 shrink-0 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="h-4 w-4 ml-2 shrink-0 text-muted-foreground" />
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-sm text-muted-foreground">{structure.core_meaning}</p>

                    {/* Expandable Examples Section - TTS and Translate on examples */}
                    {isExpanded && (
                      <div className="pt-3 border-t space-y-2">
                        <p className="text-xs font-medium text-muted-foreground">
                          {t('chunk.examples')}:
                        </p>
                        {isLoadingExamples ? (
                          <p className="text-sm text-muted-foreground">Loading examples...</p>
                        ) : examples.length === 0 ? (
                          <p className="text-sm text-muted-foreground">No examples available</p>
                        ) : (
                          examples.map((example) => {
                            const key = `${structure.id}-${example.id}`;
                            const translated = translations[key];
                            return (
                              <div
                                key={example.id}
                                className="p-3 rounded-lg bg-secondary/50 space-y-1"
                              >
                                <div className="flex items-start gap-2">
                                  <p className="flex-1 text-sm">{example.text_en}</p>
                                  <GrammarTTSButton text={example.text_en} locale={locale} />
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() =>
                                      handleTranslateExample(
                                        structure.id,
                                        example.id,
                                        example.text_en,
                                      )
                                    }
                                    disabled={translatingKey[key]}
                                    className="h-7 w-7 p-0"
                                    title={t('buttons.translate')}
                                  >
                                    <Languages className="h-3 w-3" />
                                  </Button>
                                </div>
                                {example.text_target && (
                                  <p className="text-xs text-muted-foreground ml-9">
                                    {example.text_target}
                                  </p>
                                )}
                                {translated && (
                                  <p className="text-xs text-muted-foreground italic ml-9">
                                    {translated}
                                  </p>
                                )}
                              </div>
                            );
                          })
                        )}
                      </div>
                    )}

                    {structure.key_forms && (
                      <div>
                        <p className="text-xs font-medium text-muted-foreground mb-1">
                          {t('grammar.keyForms')}:
                        </p>
                        <p className="text-sm">{structure.key_forms}</p>
                      </div>
                    )}

                    {structure.essential_vocabulary && (
                      <div>
                        <p className="text-xs font-medium text-muted-foreground mb-1">
                          {t('grammar.essentialVocabulary')}:
                        </p>
                        <p className="text-sm">{structure.essential_vocabulary}</p>
                      </div>
                    )}

                    {structure.when_to_use && (
                      <div>
                        <p className="text-xs font-medium text-muted-foreground mb-1">
                          {t('grammar.whenToUse')}:
                        </p>
                        <p className="text-sm">{structure.when_to_use}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </Suspense>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-8">
          <Link
            href={`/grammar?${buildQueryString({ ...Object.fromEntries(searchParams.entries()), page: page - 1 })}`}
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
                  href={`/grammar?${buildQueryString({ ...Object.fromEntries(searchParams.entries()), page: pageNum })}`}
                >
                  <Button variant={page === pageNum ? 'default' : 'outline'} size="sm">
                    {pageNum}
                  </Button>
                </Link>
              );
            })}
          </div>

          <Link
            href={`/grammar?${buildQueryString({ ...Object.fromEntries(searchParams.entries()), page: page + 1 })}`}
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

/*
? TTS button component for grammar structures
*/
function GrammarTTSButton({ text, locale }: { text: string; locale: Locale }) {
  const tts = useTTSPlaybackClient({ locale });

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => tts.speak(text)}
      title="Listen"
      className="h-7 w-7 p-0"
    >
      <Volume2 className="h-3 w-3" />
    </Button>
  );
}
