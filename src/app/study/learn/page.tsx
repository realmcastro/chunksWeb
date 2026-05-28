'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Dices, BookOpen, Brain, Zap } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { useTranslation } from '@/lib/i18n/I18nProvider';
import { useLearningLanguage } from '@/lib/contexts/LearningLanguageContext';

/*
! Invariantes, contratos, pré-condições e decisões críticas e riscos.
? Descrição técnica relevante que não seja óbvia pelo nome.

- /study/learn: Category selection page for learning new chunks
- Shows grid of categories with progress
- Has "Random Mode" button at top
- Click category to see chunks, or use random mode
*/

interface CategoryWithProgress {
  id: number;
  name: string;
  color_hex: string | null;
  code: string;
  type: string;
  totalChunks: number;
  learnedChunks: number;
  masteredChunks: number;
}

export default function LearnPage() {
  const { t } = useTranslation();
  const { learningLanguage } = useLearningLanguage();
  const [categories, setCategories] = useState<CategoryWithProgress[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCategories();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [learningLanguage]);

  const fetchCategories = async () => {
    try {
      const response = await fetch(`/api/learn/categories?language=${learningLanguage}`);
      const data = await response.json();
      /*
      ! Categorias são globais (sem coluna de linguagem própria); os counts já vêm filtrados por idioma.
      ? Exibir categorias com totalChunks = 0 para o idioma selecionado confunde o usuário — remover da lista.
      ? Categorias grammar/foundation mantêm contagem própria sem filtro de idioma; exibi-las sempre.
      */
      const visible = (data.categories || []).filter(
        (cat: CategoryWithProgress) => cat.type !== 'chunk' || cat.totalChunks > 0,
      );
      setCategories(visible);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container py-8 max-w-4xl mx-auto text-center">
        <p className="text-muted-foreground">Loading categories...</p>
      </div>
    );
  }

  return (
    <div className="container py-8 max-w-4xl mx-auto">
      <div className="mb-8 flex items-center gap-4">
        <Link href="/study">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold tracking-tight">{t('learn.title')}</h1>
          <p className="text-muted-foreground text-sm">{t('learn.subtitle')}</p>
        </div>
        <Link href="/study/random">
          <Button className="gap-2">
            <Dices className="h-4 w-4" />
            {t('buttons.surpriseMe')}
          </Button>
        </Link>
      </div>

      {/* Quick Random Section */}
      <Card className="mb-8">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                <Dices className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold">{t('buttons.surpriseMe')}</h3>
                <p className="text-sm text-muted-foreground">
                  {t('learn.randomChunksDescription')}
                </p>
              </div>
            </div>
            <Link href="/study/random">
              <Button>{t('learn.startRandomStudy')}</Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Category Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {categories.map((category) => (
          <Card key={category.id} className="hover:border-primary/50 transition-colors">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-3">
                <div
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: category.color_hex || '#607d8b' }}
                />
                <span className="truncate">{category.name}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {category.type === 'chunk' ? (
                <>
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <BookOpen className="h-3 w-3" />
                      {category.totalChunks} {t('learn.chunks')}
                    </span>
                    <span className="flex items-center gap-1">
                      <Brain className="h-3 w-3" />
                      {category.learnedChunks} {t('learn.learned')}
                    </span>
                  </div>
                  <div className="space-y-1">
                    <div className="h-2 bg-secondary rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${category.totalChunks > 0 ? (category.learnedChunks / category.totalChunks) * 100 : 0}%`,
                          backgroundColor: category.color_hex || '#607d8b',
                        }}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>
                        {category.learnedChunks} {t('learn.started')}
                      </span>
                      <span className="flex items-center gap-1">
                        <Zap className="h-3 w-3 text-yellow-500" />
                        {category.masteredChunks} {t('learn.mastered')}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Link href={`/study/learn/${category.id}`} className="flex-1">
                      <Button className="w-full gap-1">
                        <Zap className="h-3 w-3" />
                        Estudar
                      </Button>
                    </Link>
                    <Link
                      href={`/study/random?categoryId=${category.id}&categoryName=${encodeURIComponent(category.name)}`}
                      className="flex-1"
                    >
                      <Button variant="outline" className="w-full gap-1">
                        <Dices className="h-3 w-3" />
                        {t('buttons.random')}
                      </Button>
                    </Link>
                    <Link href={`/browse?category=${category.id}&language=${learningLanguage}`}>
                      <Button variant="ghost" size="icon">
                        <BookOpen className="h-3 w-3" />
                      </Button>
                    </Link>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <BookOpen className="h-3 w-3" />
                      {category.totalChunks} structures
                    </span>
                  </div>
                  <Link href={`/grammar?category=${category.id}`} className="block">
                    <Button variant="outline" className="w-full gap-1">
                      <BookOpen className="h-3 w-3" />
                      {t('nav.browse')}
                    </Button>
                  </Link>
                </>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
