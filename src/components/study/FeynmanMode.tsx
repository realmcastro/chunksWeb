'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/Card';
import { ArrowRight, RefreshCw, CheckCircle, XCircle, AlertCircle, History } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface LastExplanation {
  text: string;
  quality: number | null;
  createdAt: number | null;
}

interface FeynmanChunk {
  id: string;
  chunk: string;
  meaning: string;
  explanation?: string | null;
  lastExplanation?: LastExplanation | null;
  examples: { id: string; sentence: string; translation?: string }[];
  category: { id: string; name: string; level: string };
}

interface FeynmanModeProps {
  chunk: FeynmanChunk;
  onComplete: (quality: number) => void;
  onSkip: () => void;
}

type Step = 'intro' | 'explain' | 'compare' | 'rate';

const QUALITY_OPTIONS = [
  {
    value: 1,
    icon: XCircle,
    color: 'border-red-300 hover:border-red-500 hover:bg-red-50 dark:hover:bg-red-950/30',
    selectedColor: 'border-red-500 bg-red-50 dark:bg-red-950/30',
    label: 'Não consegui explicar',
    detail: 'Conceito errado ou em branco — preciso rever.',
    key: '1',
  },
  {
    value: 2,
    icon: AlertCircle,
    color: 'border-yellow-300 hover:border-yellow-500 hover:bg-yellow-50 dark:hover:bg-yellow-950/30',
    selectedColor: 'border-yellow-500 bg-yellow-50 dark:bg-yellow-950/30',
    label: 'Expliquei parcialmente',
    detail: 'Entendi a ideia mas fui vago ou perdi detalhes.',
    key: '2',
  },
  {
    value: 3,
    icon: CheckCircle,
    color: 'border-green-300 hover:border-green-500 hover:bg-green-50 dark:hover:bg-green-950/30',
    selectedColor: 'border-green-500 bg-green-50 dark:bg-green-950/30',
    label: 'Expliquei claramente',
    detail: 'Preciso e simples — poderia ensinar outra pessoa.',
    key: '3',
  },
];

const QUALITY_COLORS: Record<number, string> = {
  1: 'text-red-500',
  2: 'text-yellow-500',
  3: 'text-green-500',
};

const QUALITY_LABELS: Record<number, string> = {
  1: 'A rever',
  2: 'Parcial',
  3: 'Clara',
};

function formatRelativeDate(ts: number): string {
  const days = Math.floor((Date.now() / 1000 - ts) / 86400);
  if (days === 0) return 'hoje';
  if (days === 1) return 'ontem';
  return `há ${days} dias`;
}

export function FeynmanMode({ chunk, onComplete, onSkip }: FeynmanModeProps) {
  const [step, setStep] = useState<Step>('intro');
  const [explanation, setExplanation] = useState('');
  const [revisedExplanation, setRevisedExplanation] = useState('');
  const [selectedQuality, setSelectedQuality] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // The explanation that gets saved: revised version if the user rewrote, otherwise original
  const finalExplanation = revisedExplanation.trim().length >= 15
    ? revisedExplanation.trim()
    : explanation.trim();

  const handleRate = useCallback(
    async (quality: number) => {
      if (isSaving) return;
      setSelectedQuality(quality);
      setIsSaving(true);
      try {
        await fetch('/api/feynman/submit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chunkId: parseInt(chunk.id, 10),
            explanation: finalExplanation,
            quality,
          }),
        });
      } catch {
        // save failure is non-blocking
      } finally {
        setIsSaving(false);
        onComplete(quality);
      }
    },
    [chunk.id, finalExplanation, isSaving, onComplete],
  );

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Don't intercept when typing in a textarea
      if (e.target instanceof HTMLTextAreaElement) return;

      if (step === 'intro' && e.key === 'Enter') {
        setStep('explain');
        setTimeout(() => textareaRef.current?.focus(), 50);
      }

      if (step === 'compare' && e.key === 'Enter' && !(e.target instanceof HTMLTextAreaElement)) {
        setStep('rate');
      }

      if (step === 'rate' && !isSaving) {
        if (e.key === '1') handleRate(1);
        if (e.key === '2') handleRate(2);
        if (e.key === '3') handleRate(3);
      }

      if (e.key === 'Escape') {
        if (step === 'explain') setStep('intro');
        if (step === 'compare') setStep('explain');
        if (step === 'rate') setStep('compare');
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [step, isSaving, handleRate]);

  const levelColor =
    chunk.category.level === 'foundation'
      ? 'var(--foundation)'
      : chunk.category.level === 'basic'
        ? 'var(--basic)'
        : 'var(--advanced)';

  // ── INTRO ──────────────────────────────────────────────────────────────────
  if (step === 'intro') {
    const prev = chunk.lastExplanation;
    return (
      <Card className="max-w-2xl mx-auto">
        <CardContent className="p-8 space-y-6">
          <div className="text-center">
            <span
              className="inline-block px-3 py-1 rounded-full text-xs font-semibold text-white mb-4"
              style={{ backgroundColor: levelColor }}
            >
              {chunk.category.name}
            </span>
            <h2 className="text-3xl font-bold font-serif mb-2">{chunk.chunk}</h2>
            <p className="text-sm text-muted-foreground">
              Leia o chunk. Agora feche os olhos por 3 segundos e pense no que ele significa.
            </p>
          </div>

          {/* Delta — previous Feynman explanation */}
          {prev && (
            <div className="rounded-xl border border-border bg-muted/30 overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-2 border-b border-border bg-muted/50">
                <History className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Sua última explicação
                  {prev.createdAt ? ` · ${formatRelativeDate(prev.createdAt)}` : ''}
                </span>
                {prev.quality && (
                  <span className={cn('ml-auto text-xs font-bold', QUALITY_COLORS[prev.quality])}>
                    {QUALITY_LABELS[prev.quality]}
                  </span>
                )}
              </div>
              <p className="px-4 py-3 text-sm text-muted-foreground italic">"{prev.text}"</p>
              <p className="px-4 pb-3 text-xs text-amber-600 dark:text-amber-400 font-medium">
                Desta vez, tente ir além — seja mais preciso, mais completo.
              </p>
            </div>
          )}

          <div className="p-4 rounded-lg bg-primary/5 border border-primary/20 text-sm space-y-1">
            <p className="font-semibold text-foreground">Como funciona:</p>
            <p className="text-muted-foreground">
              Você vai escrever sua explicação <strong>sem ver o significado real</strong>.
              Depois vamos comparar. Esse gap é onde o aprendizado acontece.
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => { setStep('explain'); setTimeout(() => textareaRef.current?.focus(), 50); }}
              className="flex-1 inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground px-4 py-2.5 rounded-lg font-semibold hover:bg-primary/90 transition-colors"
            >
              Começar explicação
              <ArrowRight className="h-4 w-4" />
            </button>
            <button
              onClick={onSkip}
              className="px-4 py-2.5 rounded-lg border border-border text-sm text-muted-foreground hover:bg-accent transition-colors"
            >
              Pular
            </button>
          </div>
          <p className="text-center text-xs text-muted-foreground/50">Enter para começar · Esc para pular</p>
        </CardContent>
      </Card>
    );
  }

  // ── EXPLAIN (meaning hidden — pure retrieval) ──────────────────────────────
  if (step === 'explain') {
    const charCount = explanation.trim().length;
    const canSubmit = charCount >= 15;

    return (
      <Card className="max-w-2xl mx-auto">
        <CardContent className="p-8 space-y-5">
          <div className="p-4 rounded-lg bg-secondary/50 text-center">
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Explique este chunk</p>
            <p className="text-2xl font-bold font-serif">{chunk.chunk}</p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">
              O que significa? Como você explicaria para um amigo que nunca ouviu isso?
            </label>
            <textarea
              ref={textareaRef}
              autoFocus
              value={explanation}
              onChange={(e) => setExplanation(e.target.value)}
              placeholder="Escreva com suas próprias palavras. Sem consultar nada..."
              className="w-full h-36 rounded-lg border border-border bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <p className={cn('text-xs text-right', canSubmit ? 'text-muted-foreground' : 'text-muted-foreground/50')}>
              {charCount} caracteres {!canSubmit && `— mínimo 15`}
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setStep('compare')}
              disabled={!canSubmit}
              className="flex-1 inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground px-4 py-2.5 rounded-lg font-semibold hover:bg-primary/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Ver significado real
              <ArrowRight className="h-4 w-4" />
            </button>
            <button
              onClick={() => setStep('intro')}
              className="px-4 py-2.5 rounded-lg border border-border text-sm text-muted-foreground hover:bg-accent transition-colors"
            >
              Voltar
            </button>
          </div>
          <p className="text-center text-xs text-muted-foreground/50">Esc para voltar</p>
        </CardContent>
      </Card>
    );
  }

  // ── COMPARE (revelation + gap identification + optional rewrite) ────────────
  if (step === 'compare') {
    return (
      <div className="max-w-2xl mx-auto space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* User's explanation */}
          <Card className="border-primary/30">
            <CardContent className="p-5 space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-primary">Sua explicação</p>
              <p className="text-sm">{explanation}</p>
            </CardContent>
          </Card>

          {/* Real meaning */}
          <Card className="border-green-300 dark:border-green-800">
            <CardContent className="p-5 space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-green-600 dark:text-green-400">Significado real</p>
              <p className="text-sm font-medium">{chunk.meaning}</p>
              {chunk.examples[0] && (
                <div className="pt-2 border-t border-border">
                  <p className="text-xs text-muted-foreground mb-1">Exemplo:</p>
                  <p className="text-xs italic">"{chunk.examples[0].sentence}"</p>
                  {chunk.examples[0].translation && (
                    <p className="text-xs text-muted-foreground mt-0.5">{chunk.examples[0].translation}</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Card className="bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800">
          <CardContent className="p-4">
            <p className="text-sm text-amber-800 dark:text-amber-200">
              <strong>Identifique os gaps:</strong> O que você acertou? O que deixou passar?
              Esses pontos em branco são exatamente onde você precisa focar — é aqui que o aprendizado acontece.
            </p>
          </CardContent>
        </Card>

        {/* Rewrite step — optional */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-muted-foreground">
            Reescreva sua explicação com o que aprendeu agora <span className="text-xs">(opcional)</span>
          </label>
          <textarea
            value={revisedExplanation}
            onChange={(e) => setRevisedExplanation(e.target.value)}
            placeholder="Agora que você viu o significado real, como explicaria melhor? Escreva aqui para consolidar o aprendizado..."
            className="w-full h-28 rounded-lg border border-border bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary"
          />
          {revisedExplanation.trim().length > 0 && revisedExplanation.trim().length < 15 && (
            <p className="text-xs text-muted-foreground/60">Mínimo 15 caracteres para substituir a original</p>
          )}
        </div>

        <button
          onClick={() => setStep('rate')}
          className="w-full inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground px-4 py-2.5 rounded-lg font-semibold hover:bg-primary/90 transition-colors"
        >
          Avaliar meu entendimento
          <ArrowRight className="h-4 w-4" />
        </button>
        <p className="text-center text-xs text-muted-foreground/50">Enter para avaliar · Esc para voltar</p>
      </div>
    );
  }

  // ── RATE (metacognition — honest self-assessment) ──────────────────────────
  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div className="text-center">
        <p className="text-lg font-semibold">Como foi sua explicação?</p>
        <p className="text-sm text-muted-foreground">Seja honesto — isso calibra o próximo intervalo de revisão.</p>
        {revisedExplanation.trim().length >= 15 && (
          <p className="text-xs text-green-600 dark:text-green-400 mt-1">
            ✓ Será salva a versão reescrita
          </p>
        )}
      </div>

      <div className="space-y-3">
        {QUALITY_OPTIONS.map((opt) => {
          const Icon = opt.icon;
          const isSelected = selectedQuality === opt.value;
          return (
            <button
              key={opt.value}
              onClick={() => handleRate(opt.value)}
              disabled={isSaving}
              className={cn(
                'w-full flex items-center gap-4 p-4 rounded-xl border-2 text-left transition-all duration-150',
                isSelected ? opt.selectedColor : opt.color,
                isSaving && !isSelected && 'opacity-40 cursor-not-allowed',
              )}
            >
              <Icon className={cn(
                'h-6 w-6 shrink-0',
                opt.value === 1 ? 'text-red-500' : opt.value === 2 ? 'text-yellow-500' : 'text-green-500',
              )} />
              <div className="flex-1">
                <p className="font-semibold text-sm">{opt.label}</p>
                <p className="text-xs text-muted-foreground">{opt.detail}</p>
              </div>
              <span className="text-xs text-muted-foreground/50 shrink-0 hidden sm:block">[{opt.key}]</span>
              {isSaving && isSelected && (
                <RefreshCw className="h-4 w-4 animate-spin text-muted-foreground" />
              )}
            </button>
          );
        })}
      </div>

      <button
        onClick={() => setStep('explain')}
        disabled={isSaving}
        className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors py-2"
      >
        ← Reescrever minha explicação
      </button>
      <p className="text-center text-xs text-muted-foreground/50">Teclas 1 · 2 · 3 para avaliar · Esc para voltar</p>
    </div>
  );
}
