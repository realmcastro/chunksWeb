'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { MathCaptcha } from '@/components/auth/MathCaptcha';
import { useTranslation } from '@/lib/i18n/I18nProvider';

interface CaptchaData {
  captchaId: string;
  captchaAnswer: number;
}

export default function RegisterPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [captcha, setCaptcha] = useState<CaptchaData | null>(null);
  const honeypotRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (!captcha) {
      setError(t('captcha.solveToContinue'));
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username,
          password,
          ...(email && { email }),
          captchaId: captcha.captchaId,
          captchaAnswer: captcha.captchaAnswer,
          honeypot: honeypotRef.current?.value || '',
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Registration failed');
        setCaptcha(null);
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
              <label htmlFor="email" className="block text-sm font-medium mb-1">
                {t('auth.emailOptional')}
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border rounded-md bg-background"
                placeholder="you@example.com"
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

            {/* Honeypot — hidden from humans, bots fill it */}
            <input
              ref={honeypotRef}
              name="email_address"
              type="text"
              tabIndex={-1}
              autoComplete="off"
              aria-hidden="true"
              className="absolute -left-[9999px] h-0 w-0 overflow-hidden"
            />

            <div className="border rounded-md p-4 bg-muted/30">
              <p className="text-sm text-muted-foreground mb-3 text-center">
                {t('captcha.solveToContinue')}
              </p>
              <MathCaptcha onSolved={setCaptcha} />
              {captcha && (
                <p className="text-green-600 dark:text-green-400 text-sm text-center mt-2">
                  ✓ {t('captcha.verified') ?? 'Verified'}
                </p>
              )}
            </div>

            {error && <p className="text-red-500 text-sm">{error}</p>}
            <button
              type="submit"
              disabled={loading || !captcha}
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
        </div>
      </div>
    </div>
  );
}
