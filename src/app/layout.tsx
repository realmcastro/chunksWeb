import type { Metadata, Viewport } from 'next';
import './globals.css';
import { AntdRegistry } from '@ant-design/nextjs-registry';
import { AppShell } from '@/components/layout/AppShell';
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
        <AntdRegistry>
          <I18nProvider>
            <AuthProvider>
              <LearningLanguageProvider>
                <AppShell>
                  <ErrorBoundary context="root">{children}</ErrorBoundary>
                </AppShell>
                <ToastProvider />
              </LearningLanguageProvider>
            </AuthProvider>
          </I18nProvider>
        </AntdRegistry>
      </body>
    </html>
  );
}
