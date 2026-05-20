'use client';

import { useRouter } from 'next/navigation';
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

  return (
    <div className="flex flex-col min-h-screen">
      <header className="sticky top-0 z-40 bg-background border-b px-4 py-3 flex items-center gap-3 safe-top">
        {showBack && (
          <button
            onClick={() => router.back()}
            className="p-1 -ml-1 rounded-md hover:bg-accent transition-colors"
            aria-label="Voltar"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
        )}
        <h1 className="font-semibold text-lg">{title}</h1>
      </header>

      <main className="flex-1 px-4 py-4 pb-24 max-w-lg mx-auto w-full">
        {children}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-background border-t safe-bottom">
        <div className="flex justify-around max-w-lg mx-auto">
          {NAV_ITEMS.map(({ href, icon: Icon, label }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex flex-col items-center gap-1 py-2 px-4 text-xs transition-colors',
                'text-muted-foreground hover:text-primary',
              )}
            >
              <Icon className="h-5 w-5" />
              <span>{label}</span>
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
}
