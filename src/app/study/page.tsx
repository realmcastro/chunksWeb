'use client';

import { useAuth } from '@/components/providers/AuthProvider';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import {
  BookOpen,
  Zap,
  Dices,
  Gamepad2,
  GraduationCap,
  Heart,
  AlertTriangle,
  Headphones,
  Mic,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useState, useEffect } from 'react';
import { useTranslation } from '@/lib/i18n/I18nProvider';

export default function StudyPage() {
  const { t } = useTranslation();
  const { user, loading } = useAuth();
  const [totalChunks, setTotalChunks] = useState(0);
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      redirect('/login?redirect=/study');
    }

    if (user) {
      fetch('/api/progress/stats')
        .then((res) => res.json())
        .then((data) => setTotalChunks(data.totalChunks || 0))
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
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="h-48 bg-muted rounded" />
            <div className="h-48 bg-muted rounded" />
            <div className="h-48 bg-muted rounded" />
          </div>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="container py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight mb-2">{t('nav.study')}</h1>
        <p className="text-muted-foreground">{t('study.chooseYourLearningMode')}</p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        {/* Quick Practice */}
        <Card className="hover:border-primary/50 transition-colors">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Dices className="h-5 w-5" />
              {t('study.quickPractice')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">{t('study.quickPracticeDesc')}</p>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span>10 {t('study.randomCards')}</span>
            </div>
            <Link href="/study/random" className="block">
              <Button className="w-full">
                <Dices className="mr-2 h-4 w-4" />
                {t('buttons.rollTheDice')}
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Learn New */}
        <Card className="hover:border-primary/50 transition-colors">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              {t('study.learnNew')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">{t('study.learnNewDesc')}</p>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span>{totalChunks} {t('study.chunksAvailable')}</span>
            </div>
            <Link href="/study/learn" className="block">
              <Button className="w-full">
                <BookOpen className="mr-2 h-4 w-4" />
                {t('buttons.chooseCategory')}
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Word Game */}
        <Card className="hover:border-primary/50 transition-colors">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Gamepad2 className="h-5 w-5" />
              Word Game
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">Learn vocabulary with image flashcards, then test yourself in a match game.</p>
            <Link href="/vocabulary-game" className="block">
              <Button className="w-full">
                <Gamepad2 className="mr-2 h-4 w-4" />
                Play Word Game
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Feynman Mode */}
        <Card className="hover:border-primary/50 transition-colors">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              {t('study.feynmanMode')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">{t('study.feynmanModeDesc')}</p>
            <Link href="/study/feynman" className="block">
              <Button variant="outline" className="w-full">
                <Zap className="mr-2 h-4 w-4" />
                {t('buttons.startFeynmanMode')}
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Grammar Study */}
        <Card className="hover:border-primary/50 transition-colors">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5" />
              Estruturas Gramaticais
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              Explore padrões gramaticais: significado, variações, quando usar e exemplos em contexto.
            </p>
            <Link href="/study/grammar" className="block">
              <Button variant="outline" className="w-full">
                <GraduationCap className="mr-2 h-4 w-4" />
                Estudar Gramática
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Study favorites */}
        <Card className="hover:border-primary/50 transition-colors">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Heart className="h-5 w-5 text-red-500" />
              Study favorites
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              Random session drawn only from chunks you have favorited.
            </p>
            <Link href="/study/random?source=favorites" className="block">
              <Button variant="outline" className="w-full">
                <Heart className="mr-2 h-4 w-4" />
                Practice favorites
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Review mistakes */}
        <Card className="hover:border-primary/50 transition-colors">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              Review mistakes
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              Revisit chunks your last review reset to repetitions=0.
            </p>
            <Link href="/study/errored" className="block">
              <Button variant="outline" className="w-full">
                <AlertTriangle className="mr-2 h-4 w-4" />
                Study errored
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Dictation */}
        <Card className="hover:border-primary/50 transition-colors">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Headphones className="h-5 w-5" />
              Dictation
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              Listen to the TTS and type what you hear. Fuzzy-matched against the chunk.
            </p>
            <Link href="/study/dictation" className="block">
              <Button variant="outline" className="w-full">
                <Headphones className="mr-2 h-4 w-4" />
                Start dictation
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Speaking */}
        <Card className="hover:border-primary/50 transition-colors">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mic className="h-5 w-5" />
              Speaking
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              Read the chunk aloud. Browser speech recognition grades your pronunciation.
            </p>
            <Link href="/study/speaking" className="block">
              <Button variant="outline" className="w-full">
                <Mic className="mr-2 h-4 w-4" />
                Start speaking
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
