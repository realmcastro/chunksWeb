'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, Home, Brain, BookOpen, BarChart3 } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { Sidebar } from './Sidebar';
import { useTranslation } from '@/lib/i18n/I18nProvider';

interface AppShellProps {
  children: React.ReactNode;
}

const BOTTOM_NAV = [
  { href: '/', icon: Home, labelKey: 'nav.home', fallback: 'Home', exact: true },
  { href: '/study', icon: Brain, labelKey: 'nav.study', fallback: 'Study', exact: false },
  { href: '/browse', icon: BookOpen, labelKey: 'nav.browse', fallback: 'Browse', exact: false },
  { href: '/progress', icon: BarChart3, labelKey: 'nav.progress', fallback: 'Progress', exact: false },
] as const;

function MobileBottomNav({ onMenuOpen }: { onMenuOpen: () => void }) {
  const pathname = usePathname();
  const { t } = useTranslation();

  return (
    <nav
      className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-card border-t border-border h-16 flex items-stretch"
      aria-label="Navegação mobile"
    >
      {BOTTOM_NAV.map(({ href, icon: Icon, labelKey, fallback, exact }) => {
        const isActive = exact ? pathname === href : pathname === href || pathname.startsWith(href + '/');
        const label = t(labelKey) || fallback;
        return (
          <Link
            key={href}
            href={href}
            aria-current={isActive ? 'page' : undefined}
            className={cn(
              'flex flex-1 flex-col items-center justify-center gap-0.5 text-[10px] font-medium transition-colors',
              isActive
                ? 'text-primary'
                : 'text-muted-foreground hover:text-accent-foreground',
            )}
          >
            <Icon className={cn('h-5 w-5', isActive && 'stroke-[2.5]')} />
            <span>{label}</span>
          </Link>
        );
      })}

      {/* More / menu button */}
      <button
        type="button"
        onClick={onMenuOpen}
        className="flex flex-1 flex-col items-center justify-center gap-0.5 text-[10px] font-medium text-muted-foreground hover:text-accent-foreground transition-colors"
        aria-label="Abrir menu"
      >
        <Menu className="h-5 w-5" />
        <span>More</span>
      </button>
    </nav>
  );
}

export function AppShell({ children }: AppShellProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar
        collapsed={collapsed}
        onCollapse={setCollapsed}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />

      <div
        className={cn(
          'flex flex-col flex-1 min-w-0 transition-all duration-300',
          collapsed ? 'lg:ml-16' : 'lg:ml-64',
        )}
      >
        {/* Mobile top bar */}
        <header className="flex lg:hidden h-14 shrink-0 items-center gap-3 border-b border-border bg-card px-4">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="p-2 rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            aria-label="Abrir menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          <span className="font-bold text-sm">OLife'S</span>
        </header>

        {/* Main content — extra bottom padding on mobile to clear the bottom nav */}
        <main className="flex-1 mx-auto w-full max-w-5xl px-4 sm:px-6 py-6 pb-24 lg:pb-6">
          {children}
        </main>
      </div>

      <MobileBottomNav onMenuOpen={() => setMobileOpen(true)} />
    </div>
  );
}
