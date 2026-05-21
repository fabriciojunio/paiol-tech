'use client';

import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Home, ListTodo, Bell, User } from 'lucide-react';
import { cn } from '@paiol/ui';

interface AppShellProps {
  title: string;
  showBack?: boolean;
  children: React.ReactNode;
}

const NAV_ITEMS = [
  { href: '/', icon: Home, label: 'Início' },
  { href: '/debts', icon: ListTodo, label: 'Dívidas' },
  { href: '/alerts', icon: Bell, label: 'Avisos' },
  { href: '/account', icon: User, label: 'Conta' },
];

export function AppShell({ title, showBack = false, children }: AppShellProps) {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b px-4 py-3 flex items-center gap-3 safe-top">
        {showBack && (
          <button
            onClick={() => router.back()}
            className="p-1.5 -ml-1.5 rounded-lg hover:bg-accent transition-colors"
            aria-label="Voltar"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
        )}
        <div className="flex items-center gap-2 flex-1">
          {!showBack && <span className="text-xl">🌾</span>}
          <h1 className="font-bold text-lg tracking-tight">{title}</h1>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 px-4 py-5 pb-28 max-w-lg mx-auto w-full">
        {children}
      </main>

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur border-t safe-bottom shadow-[0_-1px_0_rgba(0,0,0,0.05)]">
        <div className="flex justify-around max-w-lg mx-auto">
          {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
            const active = href === '/' ? pathname === '/' : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex flex-col items-center gap-1 py-2.5 px-4 text-xs font-medium transition-colors relative',
                  active ? 'text-primary' : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {active && (
                  <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-b-full bg-primary" />
                )}
                <Icon className={cn('h-5 w-5 transition-transform', active && 'scale-110')} />
                <span>{label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
