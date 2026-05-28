'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Home,
  BookOpen,
  Brain,
  BarChart3,
  Settings,
  Menu,
  X,
  Sun,
  Moon,
  LogOut,
  User,
  Heart,
  ChevronDown,
  GraduationCap,
} from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils/cn';
import { useAuth } from '@/components/providers/AuthProvider';
import { useTranslation } from '@/lib/i18n/I18nProvider';
import { LanguageSelector } from '@/components/LanguageSelector';
import { LearningLanguageSelector } from '@/components/LearningLanguageSelector';
import { OfflineIndicator } from '@/components/OfflineIndicator';

/*
! Invariants, contratos, pré-condições, decisões críticas e riscos.
? Descrição técnica relevante que não seja óbvia pelo nome.

- TopNav: Horizontal navigation bar that replaces the sidebar
- Desktop: Fixed at top, full width with horizontal links
- Mobile: Collapses to hamburger menu with slide-out drawer
- Theme toggle follows system preference but can be manually overridden
- Language selector allows switching between EN, PT, ES
*/

export function TopNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { t } = useTranslation();
  const { user, loading, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('system');

  /*
  ! Top-level nav is intentionally short. "Content" groups read-mode pages
  ! (Browse / Grammar / Favorites) into a dropdown so the bar does not grow
  ! past ~5 visible items at desktop widths. Mobile menu still lists each
  ! page flat under "Content" so users can find them without hover.
  */
  const navigation = [
    { name: t('nav.home'), href: '/', icon: Home },
    { name: t('nav.study'), href: '/study', icon: Brain },
    { name: t('nav.progress'), href: '/progress', icon: BarChart3 },
    { name: t('nav.settings'), href: '/settings', icon: Settings },
  ];

  const contentMenu = [
    { name: t('nav.browse'), href: '/browse', icon: BookOpen },
    { name: t('nav.grammar'), href: '/grammar', icon: GraduationCap },
    { name: t('nav.favorites'), href: '/favorites', icon: Heart },
  ];

  const [contentOpen, setContentOpen] = useState(false);
  const contentRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!contentOpen) return;
    const handler = (e: MouseEvent) => {
      if (contentRef.current && !contentRef.current.contains(e.target as Node)) {
        setContentOpen(false);
      }
    };
    const escHandler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setContentOpen(false);
    };
    document.addEventListener('mousedown', handler);
    document.addEventListener('keydown', escHandler);
    return () => {
      document.removeEventListener('mousedown', handler);
      document.removeEventListener('keydown', escHandler);
    };
  }, [contentOpen]);

  /*
  ! Scroll lock while mobile drawer is open.
  ! Without this, touching the dimmed backdrop region scrolls the page
  ! underneath, which is jarring and visually leaks the drawer animation.
  ! We freeze `body` overflow + preserve the prior value so unmount of the
  ! drawer cleanly restores whatever the page set (e.g. modal stacks).
  ! Also closes the drawer on Escape to match standard dialog semantics.
  */
  useEffect(() => {
    if (!mobileMenuOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const escHandler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileMenuOpen(false);
    };
    document.addEventListener('keydown', escHandler);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', escHandler);
    };
  }, [mobileMenuOpen]);

  const contentActive = contentMenu.some(
    (item) => pathname === item.href || pathname.startsWith(item.href + '/'),
  );

  useEffect(() => {
    const stored = localStorage.getItem('theme') as 'light' | 'dark' | 'system' | null;
    if (stored) setTheme(stored);
  }, []);

  useEffect(() => {
    const root = window.document.documentElement;
    if (
      theme === 'dark' ||
      (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)
    ) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme]);

  const toggleTheme = () => {
    const next = theme === 'light' ? 'dark' : theme === 'dark' ? 'system' : 'light';
    setTheme(next);
    localStorage.setItem('theme', next);
  };

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  return (
    <>
      {/* Desktop Top Navigation */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            {/* Logo */}
            <div className="flex items-center gap-8">
              <Link href="/" className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <BookOpen className="h-5 w-5" />
                </div>
                <span className="text-lg font-bold hidden sm:block">ChunksWeb</span>
              </Link>

              {/* Desktop Navigation */}
              <nav className="hidden md:flex items-center gap-1">
                {navigation.map((item, idx) => {
                  const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                  // Insert Content dropdown right after Home
                  const renderDropdownNext = idx === 0;
                  return (
                    <span key={item.name} className="flex items-center gap-1">
                      <Link
                        href={item.href}
                        className={cn(
                          'flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                          isActive
                            ? 'bg-primary text-primary-foreground'
                            : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                        )}
                      >
                        <item.icon className="h-4 w-4" />
                        {item.name}
                      </Link>
                      {renderDropdownNext && (
                        <div className="relative" ref={contentRef}>
                          <button
                            type="button"
                            onClick={() => setContentOpen((o) => !o)}
                            aria-haspopup="menu"
                            aria-expanded={contentOpen}
                            className={cn(
                              'flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                              contentActive
                                ? 'bg-primary text-primary-foreground'
                                : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                            )}
                          >
                            <BookOpen className="h-4 w-4" />
                            Content
                            <ChevronDown
                              className={cn(
                                'h-3.5 w-3.5 transition-transform',
                                contentOpen && 'rotate-180',
                              )}
                            />
                          </button>
                          {contentOpen && (
                            <div
                              role="menu"
                              className="absolute left-0 top-full mt-1 min-w-[200px] rounded-md border border-border bg-card shadow-lg py-1 z-50"
                            >
                              {contentMenu.map((sub) => {
                                const subActive =
                                  pathname === sub.href || pathname.startsWith(sub.href + '/');
                                return (
                                  <Link
                                    key={sub.name}
                                    href={sub.href}
                                    role="menuitem"
                                    onClick={() => setContentOpen(false)}
                                    className={cn(
                                      'flex items-center gap-2 px-3 py-2 text-sm transition-colors',
                                      subActive
                                        ? 'bg-primary/10 text-primary'
                                        : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                                    )}
                                  >
                                    <sub.icon className="h-4 w-4" />
                                    {sub.name}
                                  </Link>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      )}
                    </span>
                  );
                })}
              </nav>
            </div>

            {/* Right side actions */}
            <div className="flex items-center gap-2">
              <OfflineIndicator />
              <LearningLanguageSelector />
              <LanguageSelector />
              {!loading && (
                <>
                  {user ? (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground hidden sm:block">
                        {user.username}
                      </span>
                      <button
                        onClick={handleLogout}
                        className="p-2 rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                        title={t('auth.logout')}
                      >
                        <LogOut className="h-5 w-5" />
                      </button>
                    </div>
                  ) : (
                    <Link
                      href="/login"
                      className="flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90"
                    >
                      <User className="h-4 w-4" />
                      {t('auth.login')}
                    </Link>
                  )}
                </>
              )}
              <button
                onClick={toggleTheme}
                className="p-2 rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              >
                {theme === 'dark' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
              </button>

              {/* Mobile menu button */}
              <button
                className="md:hidden p-2 rounded-md text-muted-foreground hover:bg-accent"
                onClick={() => setMobileMenuOpen(true)}
              >
                <Menu className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Navigation Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="fixed inset-0 bg-background/80 backdrop-blur-sm"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="fixed inset-y-0 left-0 w-full max-w-xs bg-card border-r border-border">
            <div className="flex h-16 items-center justify-between px-4 border-b border-border">
              <Link
                href="/"
                className="flex items-center gap-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <BookOpen className="h-4 w-4" />
                </div>
                <span className="font-bold">ChunksWeb</span>
              </Link>
              <button
                className="p-2 rounded-md hover:bg-accent"
                onClick={() => setMobileMenuOpen(false)}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <nav className="p-4 space-y-1">
              {navigation.map((item, idx) => {
                const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                const node = (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(
                      'flex items-center gap-3 px-3 py-3 rounded-lg text-base font-medium transition-colors',
                      isActive
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                    )}
                  >
                    <item.icon className="h-5 w-5" />
                    {item.name}
                  </Link>
                );
                if (idx !== 0) return node;
                return (
                  <span key={item.name}>
                    {node}
                    <div className="pl-3 mt-1 space-y-1 border-l border-border ml-3">
                      <p className="px-3 py-1 text-xs uppercase tracking-wide text-muted-foreground">
                        Content
                      </p>
                      {contentMenu.map((sub) => {
                        const subActive =
                          pathname === sub.href || pathname.startsWith(sub.href + '/');
                        return (
                          <Link
                            key={sub.name}
                            href={sub.href}
                            onClick={() => setMobileMenuOpen(false)}
                            className={cn(
                              'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                              subActive
                                ? 'bg-primary/10 text-primary'
                                : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                            )}
                          >
                            <sub.icon className="h-4 w-4" />
                            {sub.name}
                          </Link>
                        );
                      })}
                    </div>
                  </span>
                );
              })}
              {!loading && !user && (
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-3 py-3 rounded-lg text-base font-medium bg-primary text-primary-foreground"
                >
                  <User className="h-5 w-5" />
                  {t('auth.login')}
                </Link>
              )}
              {user && (
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    handleLogout();
                  }}
                  className="flex items-center gap-3 px-3 py-3 rounded-lg text-base font-medium text-muted-foreground hover:bg-accent w-full"
                >
                  <LogOut className="h-5 w-5" />
                  {t('auth.logout')} ({user.username})
                </button>
              )}
            </nav>
          </div>
        </div>
      )}
    </>
  );
}
