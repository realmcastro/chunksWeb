'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import { MathCaptcha } from '@/components/auth/MathCaptcha';
import { Loader2, CheckCircle2 } from 'lucide-react';
import { useTranslation } from '@/lib/i18n/I18nProvider';

interface CaptchaData {
  captchaId: string;
  captchaAnswer: number;
}

export default function ForgotPasswordPage() {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [captcha, setCaptcha] = useState<CaptchaData | null>(null);
  const honeypotRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!captcha) {
      setError(t('captcha.solveToContinue'));
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/request-reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          captchaId: captcha.captchaId,
          captchaAnswer: captcha.captchaAnswer,
          honeypot: honeypotRef.current?.value || '',
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || t('errors.generic'));
        setCaptcha(null);
        return;
      }

      setSuccess(true);
    } catch {
      setError(t('errors.generic'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold">{t('auth.forgotPasswordTitle')}</h1>
          <p className="text-muted-foreground mt-2">{t('auth.forgotPasswordDesc')}</p>
        </div>

        <div className="bg-card border rounded-lg p-6 space-y-6">
          {success ? (
            <div className="text-center space-y-4">
              <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto" />
              <h2 className="text-lg font-semibold">{t('auth.checkYourEmail')}</h2>
              <p className="text-sm text-muted-foreground">
                {t('auth.checkYourEmailDesc')}
              </p>
              <Link
                href="/login"
                className="inline-block mt-4 text-sm text-primary hover:underline"
              >
                {t('auth.backToLogin')}
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium mb-1">
                  {t('auth.email')}
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md bg-background"
                  placeholder="you@example.com"
                  required
                  autoFocus
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
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {t('auth.sendingResetLink')}
                  </span>
                ) : (
                  t('auth.sendResetLink')
                )}
              </button>
              <p className="text-center text-sm text-muted-foreground">
                <Link href="/login" className="text-primary hover:underline">
                  {t('auth.backToLogin')}
                </Link>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
