'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from '@/lib/i18n/I18nProvider';

interface CaptchaData {
  captchaId: string;
  captchaAnswer: number;
}

interface MathCaptchaProps {
  onSolved: (data: CaptchaData) => void;
}

/*
! Server-verified math CAPTCHA. Fetches challenge from /api/auth/captcha/challenge,
! user types answer, parent receives { captchaId, captchaAnswer } to include
! in the auth request. Server validates — client never sees the correct answer.
*/
export function MathCaptcha({ onSolved }: MathCaptchaProps) {
  const { t } = useTranslation();
  const [expression, setExpression] = useState('');
  const [challengeId, setChallengeId] = useState('');
  const [answer, setAnswer] = useState('');
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchChallenge = useCallback(async () => {
    setLoading(true);
    setAnswer('');
    setError(false);
    try {
      const res = await fetch('/api/auth/captcha/challenge');
      const data = await res.json();
      setChallengeId(data.challengeId);
      setExpression(data.expression);
    } catch {
      setExpression('? + ?');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchChallenge();
  }, [fetchChallenge]);

  const handleSubmit = useCallback(
    () => {
      const numAnswer = parseInt(answer.trim(), 10);
      if (isNaN(numAnswer)) {
        setError(true);
        setTimeout(() => setError(false), 500);
        return;
      }
      onSolved({ captchaId: challengeId, captchaAnswer: numAnswer });
    },
    [answer, challengeId, onSolved],
  );

  if (loading) {
    return (
      <div className="text-center text-sm text-muted-foreground py-4">
        Loading...
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="text-center">
        <label htmlFor="captcha-answer" className="text-lg font-medium">
          {expression} = ?
        </label>
      </div>
      <div className="flex gap-2">
        <input
          id="captcha-answer"
          type="text"
          inputMode="numeric"
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          placeholder={t('captcha.typeAnswer') ?? 'Type your answer'}
          className={`flex-1 px-3 py-2 border rounded-md text-center text-lg bg-background text-foreground ${
            error ? 'border-red-500' : 'border-input'
          }`}
          autoFocus
          autoComplete="off"
          aria-label={`What is ${expression}?`}
        />
        <button
          type="button"
          onClick={handleSubmit}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
        >
          {t('captcha.verify') ?? 'Verify'}
        </button>
      </div>
      {error && (
        <p className="text-red-500 text-sm text-center" role="alert">
          {t('captcha.incorrectAnswer')}
        </p>
      )}
      <button
        type="button"
        onClick={fetchChallenge}
        className="w-full text-xs text-muted-foreground hover:text-foreground"
      >
        {t('captcha.newChallenge') ?? 'Get a new problem'}
      </button>
    </div>
  );
}
