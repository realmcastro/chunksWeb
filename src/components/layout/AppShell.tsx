'use client';

import { useState } from 'react';
import { Menu } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { Sidebar } from './Sidebar';

interface AppShellProps {
  children: React.ReactNode;
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
        {/* Mobile top bar — visible only on small screens */}
        <header className="flex lg:hidden h-14 shrink-0 items-center gap-3 border-b border-border bg-background px-4">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="p-2 rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            aria-label="Abrir menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          <span className="font-bold text-sm">ChunksWeb</span>
        </header>

        <main className="flex-1 mx-auto w-full max-w-5xl px-4 sm:px-6 py-6">
          {children}
        </main>
      </div>
    </div>
  );
}
