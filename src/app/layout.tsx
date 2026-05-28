import type { Metadata, Viewport } from 'next';
import './globals.css';
import { TopNav } from '@/components/layout/TopNav';
import { AuthProvider } from '@/components/providers/AuthProvider';
import { I18nProvider } from '@/lib/i18n/I18nProvider';
import { LearningLanguageProvider } from '@/lib/contexts/LearningLanguageContext';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { ToastProvider } from '@/components/providers/ToastProvider';

export const metadata: Metadata = {
  title: 'ChunksWeb - English Fluency Learning',
  description:
    'Master English through chunk-based learning, structured grammar progression, and scientifically optimized review.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'ChunksWeb',
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#3b82f6' },
    { media: '(prefers-color-scheme: dark)', color: '#0a0a0a' },
  ],
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Merriweather:wght@400;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen antialiased">
        <I18nProvider>
          <AuthProvider>
            <LearningLanguageProvider>
              <TopNav />
              <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
                <ErrorBoundary context="root">{children}</ErrorBoundary>
              </main>
              <ToastProvider />
            </LearningLanguageProvider>
          </AuthProvider>
        </I18nProvider>
      </body>
    </html>
  );
}
