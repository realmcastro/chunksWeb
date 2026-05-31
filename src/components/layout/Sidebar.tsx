'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Home,
  BookOpen,
  Brain,
  BarChart3,
  Settings,
  X,
  ChevronLeft,
  ChevronDown,
  Sun,
  Moon,
  Monitor,
  LogOut,
  User,
  Heart,
  GraduationCap,
  Globe,
  Languages,
  Gamepad2,
  Library,
  LucideIcon,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils/cn';
import { useAuth } from '@/components/providers/AuthProvider';
import { useTranslation } from '@/lib/i18n/I18nProvider';
import { LanguageSelector } from '@/components/LanguageSelector';
import { LearningLanguageSelector } from '@/components/LearningLanguageSelector';
import { OfflineIndicator } from '@/components/OfflineIndicator';

interface RouteItem {
  href: string;
  labelKey: string;
  fallback: string;
  icon: LucideIcon;
}

interface AccordionGroup {
  key: string;
  labelKey: string;
  fallback: string;
  icon: LucideIcon;
  routes: RouteItem[];
}

const HOME_ROUTE: RouteItem = { href: '/', labelKey: 'nav.home', fallback: 'Home', icon: Home };

const LINGUAS_ROUTES: RouteItem[] = [
  { href: '/study', labelKey: 'nav.study', fallback: 'Study', icon: Brain },
  { href: '/favorites', labelKey: 'nav.favorites', fallback: 'Favorites', icon: Heart },
];

const CONTENT_ACCORDION: AccordionGroup = {
  key: 'conteudo',
  labelKey: 'nav.content',
  fallback: 'Content',
  icon: Library,
  routes: [
    { href: '/browse', labelKey: 'nav.browse', fallback: 'Browse', icon: BookOpen },
    { href: '/grammar', labelKey: 'nav.grammar', fallback: 'Grammar', icon: GraduationCap },
    { href: '/vocabulary-game', labelKey: 'nav.vocabularyGame', fallback: 'Vocab Game', icon: Gamepad2 },
  ],
};

const PROGRESS_ROUTE: RouteItem = {
  href: '/progress',
  labelKey: 'nav.progress',
  fallback: 'Progress',
  icon: BarChart3,
};

const SETTINGS_ROUTE: RouteItem = {
  href: '/settings',
  labelKey: 'nav.settings',
  fallback: 'Settings',
  icon: Settings,
};

interface SidebarProps {
  collapsed: boolean;
  onCollapse: (v: boolean) => void;
  mobileOpen: boolean;
  onMobileClose: () => void;
}

function useIsActive(href: string) {
  const pathname = usePathname();
  return href === '/'
    ? pathname === '/'
    : pathname === href || pathname.startsWith(href + '/');
}

interface NavLinkProps {
  item: RouteItem;
  collapsed: boolean;
  indent?: boolean;
  onClick?: () => void;
}

function NavLink({ item, collapsed, indent, onClick }: NavLinkProps) {
  const { t } = useTranslation();
  const isActive = useIsActive(item.href);
  const label = t(item.labelKey) || item.fallback;

  return (
    <Link
      href={item.href}
      onClick={onClick}
      title={collapsed ? label : undefined}
      aria-current={isActive ? 'page' : undefined}
      className={cn(
        'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
        indent && 'ml-4 text-xs',
        isActive
          ? 'bg-primary text-primary-foreground'
          : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
        collapsed && 'lg:justify-center lg:px-2',
      )}
    >
      <item.icon className={cn('flex-shrink-0', indent ? 'h-3.5 w-3.5' : 'h-4 w-4')} />
      {!collapsed && <span>{label}</span>}
    </Link>
  );
}

interface SectionLabelProps {
  icon: LucideIcon;
  label: string;
  collapsed: boolean;
}

function SectionLabel({ icon: Icon, label, collapsed }: SectionLabelProps) {
  if (collapsed) return <div className="h-px bg-border mx-2 my-1.5" />;
  return (
    <div className="flex items-center gap-1.5 px-3 pt-3 pb-1">
      <Icon className="h-3 w-3 text-muted-foreground/60" />
      <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">
        {label}
      </span>
    </div>
  );
}

interface AccordionProps {
  group: AccordionGroup;
  collapsed: boolean;
  onLinkClick?: () => void;
}

function Accordion({ group, collapsed, onLinkClick }: AccordionProps) {
  const { t } = useTranslation();
  const pathname = usePathname();
  const anyActive = group.routes.some(
    (r) => pathname === r.href || pathname.startsWith(r.href + '/'),
  );
  const [open, setOpen] = useState(anyActive);
  const label = t(group.labelKey) || group.fallback;

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        title={collapsed ? label : undefined}
        className={cn(
          'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
          anyActive
            ? 'text-primary'
            : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
          collapsed && 'lg:justify-center lg:px-2',
        )}
      >
        <group.icon className="h-4 w-4 flex-shrink-0" />
        {!collapsed && (
          <>
            <span className="flex-1 text-left">{label}</span>
            <ChevronDown
              className={cn('h-3.5 w-3.5 transition-transform', open && 'rotate-180')}
            />
          </>
        )}
      </button>

      {open && !collapsed && (
        <div className="mt-0.5 space-y-0.5">
          {group.routes.map((route) => (
            <NavLink
              key={route.href}
              item={route}
              collapsed={false}
              indent
              onClick={onLinkClick}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function Sidebar({ collapsed, onCollapse, mobileOpen, onMobileClose }: SidebarProps) {
  const router = useRouter();
  const { user, loading, logout } = useAuth();
  const { t } = useTranslation();
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('system');

  useEffect(() => {
    const stored = localStorage.getItem('theme') as 'light' | 'dark' | 'system' | null;
    if (stored) setTheme(stored);
  }, []);

  useEffect(() => {
    const root = window.document.documentElement;
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (theme === 'dark' || (theme === 'system' && prefersDark)) {
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
    onMobileClose();
    await logout();
    router.push('/login');
  };

  const ThemeIcon = theme === 'dark' ? Moon : theme === 'light' ? Sun : Monitor;
  const themeLabel = theme === 'dark' ? 'Dark' : theme === 'light' ? 'Light' : 'System';

  return (
    <>
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 lg:hidden"
          onClick={onMobileClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={cn(
          'fixed left-0 top-0 z-50 h-full bg-card border-r border-border',
          'flex flex-col transition-all duration-300',
          collapsed ? 'lg:w-16' : 'lg:w-64',
          'w-64',
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
        )}
        aria-label="Navegação principal"
      >
        {/* Header — on desktop: center logo when collapsed. On mobile: always justify-between for close button. */}
        <div className={cn(
          'flex h-14 shrink-0 items-center border-b border-border',
          collapsed ? 'lg:justify-center lg:px-2 justify-between px-3' : 'justify-between px-3',
        )}>
          <Link
            href="/"
            onClick={onMobileClose}
            className="flex items-center gap-2 min-w-0"
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <BookOpen className="h-4 w-4" />
            </div>
            {!collapsed && <span className="font-bold text-sm truncate">OLife'S</span>}
          </Link>

          {/* Collapse toggle — only in header when expanded */}
          {!collapsed && (
            <button
              type="button"
              onClick={() => onCollapse(true)}
              className="hidden lg:flex p-1.5 rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              aria-label="Colapsar sidebar"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
          )}

          {/* Mobile close — always present on mobile (collapsed has no effect there) */}
          <button
            type="button"
            onClick={onMobileClose}
            className="lg:hidden p-1.5 rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            aria-label="Fechar menu"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Scrollable nav */}
        <div className="flex flex-col flex-1 overflow-y-auto overflow-x-hidden py-2">
          <div className="px-2 space-y-0.5">
            {/* Expand button — only visible on desktop when collapsed */}
            {collapsed && (
              <button
                type="button"
                onClick={() => onCollapse(false)}
                className="hidden lg:flex w-full items-center justify-center rounded-lg px-2 py-2 text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
                aria-label="Expandir sidebar"
              >
                <ChevronLeft className="h-4 w-4 rotate-180" />
              </button>
            )}

            {/* Home */}
            <NavLink item={HOME_ROUTE} collapsed={collapsed} onClick={onMobileClose} />

            {/* ── LÍNGUAS section ── */}
            <SectionLabel icon={Languages} label="Línguas" collapsed={collapsed} />

            {/* Language selectors — hidden when collapsed (accessible via Settings) */}
            {!collapsed && (
              <div className="px-3 py-2 space-y-2.5">
                <div className="space-y-1">
                  <div className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground/60">
                    <GraduationCap className="h-3 w-3" />
                    Aprendendo
                  </div>
                  <LearningLanguageSelector />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground/60">
                    <Globe className="h-3 w-3" />
                    Interface
                  </div>
                  <LanguageSelector />
                </div>
              </div>
            )}

            {LINGUAS_ROUTES.map((route) => (
              <NavLink
                key={route.href}
                item={route}
                collapsed={collapsed}
                onClick={onMobileClose}
              />
            ))}

            {/* ── CONTEÚDO section ── */}
            <SectionLabel icon={Library} label="Conteúdo" collapsed={collapsed} />

            <Accordion
              group={CONTENT_ACCORDION}
              collapsed={collapsed}
              onLinkClick={onMobileClose}
            />

            {/* ── PROGRESSO section ── */}
            <SectionLabel icon={BarChart3} label="Progresso" collapsed={collapsed} />

            <NavLink item={PROGRESS_ROUTE} collapsed={collapsed} onClick={onMobileClose} />
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-border px-2 py-2 space-y-0.5">
          <NavLink item={SETTINGS_ROUTE} collapsed={collapsed} onClick={onMobileClose} />

          {/* Theme toggle */}
          <button
            type="button"
            onClick={toggleTheme}
            title={collapsed ? themeLabel : undefined}
            className={cn(
              'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors',
              collapsed && 'lg:justify-center lg:px-2',
            )}
          >
            <ThemeIcon className={cn('h-4 w-4 flex-shrink-0', theme === 'system' && 'opacity-60')} />
            {!collapsed && <span>{themeLabel}</span>}
          </button>

          {/* User / logout */}
          {!loading && (
            <>
              {user ? (
                <button
                  type="button"
                  onClick={handleLogout}
                  title={collapsed ? (t('auth.logout') || 'Logout') : undefined}
                  className={cn(
                    'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors',
                    collapsed && 'lg:justify-center lg:px-2',
                  )}
                >
                  <LogOut className="h-4 w-4 flex-shrink-0" />
                  {!collapsed && (
                    <span className="truncate min-w-0">
                      {t('auth.logout') || 'Logout'}
                      <span className="text-muted-foreground/60 ml-1">· {user.username}</span>
                    </span>
                  )}
                </button>
              ) : (
                <Link
                  href="/login"
                  onClick={onMobileClose}
                  title={collapsed ? (t('auth.login') || 'Login') : undefined}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors',
                    collapsed && 'lg:justify-center lg:px-2',
                  )}
                >
                  <User className="h-4 w-4 flex-shrink-0" />
                  {!collapsed && <span>{t('auth.login') || 'Login'}</span>}
                </Link>
              )}
            </>
          )}

          <div className={cn('flex items-center gap-2 px-3 py-1', collapsed && 'justify-center px-0')}>
            <OfflineIndicator />
          </div>
        </div>
      </aside>
    </>
  );
}
