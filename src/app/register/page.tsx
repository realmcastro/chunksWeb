'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { MathCaptcha } from '@/components/auth/MathCaptcha';
import { SliderCaptcha } from '@/components/auth/SliderCaptcha';
import { useTranslation } from '@/lib/i18n/I18nProvider';

type CaptchaStep = 'math' | 'slider' | 'form';

export default function RegisterPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const [step, setStep] = useState<CaptchaStep>('math');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleMathSuccess = useCallback(() => {
    setStep('slider');
  }, []);

  const handleSliderSuccess = useCallback(() => {
    setStep('form');
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Registration failed');
        return;
      }

      router.push('/login');
    } catch {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold">{t('auth.createAccount')}</h1>
          <p className="text-muted-foreground mt-2">{t('auth.startYourJourney')}</p>
        </div>

        <div className="bg-card border rounded-lg p-6 space-y-6">
          {step === 'math' && (
            <div className="space-y-4">
              <div className="text-center text-sm text-muted-foreground mb-4">
                {t('captcha.solveToContinue')}
              </div>
              <MathCaptcha onSuccess={handleMathSuccess} />
            </div>
          )}

          {step === 'slider' && (
            <div className="space-y-4">
              <div className="text-center text-sm text-muted-foreground mb-4">
                {t('captcha.oneMoreStep')}
              </div>
              <SliderCaptcha onSuccess={handleSliderSuccess} />
              <button
                type="button"
                onClick={() => setStep('math')}
                className="w-full text-sm text-muted-foreground hover:text-foreground"
              >
                {t('captcha.backToMath')}
              </button>
            </div>
          )}

          {step === 'form' && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="username" className="block text-sm font-medium mb-1">
                  {t('auth.username')}
                </label>
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md bg-background"
                  required
                  minLength={3}
                  autoFocus
                />
              </div>
              <div>
                <label htmlFor="password" className="block text-sm font-medium mb-1">
                  {t('auth.password')}
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md bg-background"
                  required
                  minLength={4}
                />
              </div>
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium mb-1">
                  {t('auth.confirmPassword')}
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md bg-background"
                  required
                  minLength={4}
                />
              </div>
              {error && <p className="text-red-500 text-sm">{error}</p>}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50"
              >
                {loading ? t('auth.creatingAccount') : t('auth.register')}
              </button>
              <p className="text-center text-sm text-muted-foreground">
                {t('auth.alreadyHaveAccount')}{' '}
                <Link href="/login" className="text-primary hover:underline">
                  {t('auth.signInLink')}
                </Link>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
