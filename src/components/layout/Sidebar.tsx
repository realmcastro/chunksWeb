'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  BookOpen,
  Brain,
  BarChart3,
  Settings,
  Search,
  Menu,
  X,
  ChevronLeft,
} from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils/cn';
import { Button } from '@/components/ui/Button';
import { useTranslation } from '@/lib/i18n/I18nProvider';
import { useLearningLanguage } from '@/lib/contexts/LearningLanguageContext';
import { Globe, GraduationCap } from 'lucide-react';
import { LanguageSelector } from '@/components/LanguageSelector';
import { LearningLanguageSelector } from '@/components/LearningLanguageSelector';

const navigation = [
  { name: 'Home', href: '/', icon: Home },
  { name: 'Browse', href: '/browse', icon: BookOpen },
  { name: 'Study', href: '/study', icon: Brain },
  { name: 'Progress', href: '/progress', icon: BarChart3 },
  { name: 'Settings', href: '/settings', icon: Settings },
];

function LanguageSection() {
  const { language: i18nLang } = useTranslation();
  const { learningLanguage } = useLearningLanguage();

  return (
    <div className="px-4 py-3 border-b border-border space-y-3">
      <div className="space-y-1.5">
        <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
          <GraduationCap className="h-3 w-3" />
          Learning
        </div>
        <LearningLanguageSelector />
      </div>
      <div className="space-y-1.5">
        <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
          <Globe className="h-3 w-3" />
          Interface
        </div>
        <LanguageSelector />
      </div>
    </div>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* Mobile menu button */}
      <button
        className="fixed top-4 left-4 z-50 lg:hidden p-2 rounded-md bg-card border border-border"
        onClick={() => setMobileOpen(true)}
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed left-0 top-0 z-50 h-full w-64 bg-card border-r border-border transition-all duration-300',
          collapsed && 'lg:w-16',
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
        )}
      >
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex h-16 items-center justify-between px-4 border-b border-border">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <BookOpen className="h-4 w-4" />
              </div>
              {!collapsed && <span className="font-bold text-lg">ChunksWeb</span>}
            </Link>
            <button
              className="hidden lg:block p-1 rounded hover:bg-accent"
              onClick={() => setCollapsed(!collapsed)}
            >
              <ChevronLeft
                className={cn('h-4 w-4 transition-transform', collapsed && 'rotate-180')}
              />
            </button>
            <button
              className="lg:hidden p-1 rounded hover:bg-accent"
              onClick={() => setMobileOpen(false)}
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Language Selectors */}
          {!collapsed && <LanguageSection />}

          {/* Navigation */}
          <nav className="flex-1 space-y-1 p-2">
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                    collapsed && 'lg:justify-center lg:px-2',
                  )}
                  onClick={() => setMobileOpen(false)}
                >
                  <item.icon className="h-5 w-5 flex-shrink-0" />
                  {!collapsed && item.name}
                </Link>
              );
            })}
          </nav>

          {/* Search button */}
          {!collapsed && (
            <div className="p-4 border-t border-border">
              <Link
                href="/search"
                className="flex items-center gap-2 w-full px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-accent rounded transition-colors"
              >
                <Search className="h-4 w-4" />
                Search
                <span className="ml-auto text-xs text-muted-foreground">/</span>
              </Link>
            </div>
          )}
        </div>
      </aside>

      {/* Main content wrapper */}
      <div
        className={cn(
          'min-h-screen transition-all duration-300',
          collapsed ? 'lg:ml-16' : 'lg:ml-64',
        )}
      >
        {/* Header */}
        <header className="sticky top-0 z-30 h-16 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="flex h-full items-center px-4 lg:px-8">
            <div className="flex-1" />
            <div className="flex items-center gap-2">
              {/* Theme toggle */}
              <Link href="/search" className="p-2 rounded-lg hover:bg-accent lg:hidden">
                <Search className="h-5 w-5" />
              </Link>
            </div>
          </div>
        </header>
      </div>
    </>
  );
}
