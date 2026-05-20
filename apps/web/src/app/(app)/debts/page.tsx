'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import { Button } from '@paiol/ui';
import type { DebtStatus } from '@paiol/types';
import { useDebts } from '@/hooks/use-debts';
import { DebtCard } from '@/components/debt-card';
import { AppShell } from '@/components/app-shell';

const STATUS_FILTERS: { label: string; value: DebtStatus | undefined }[] = [
  { label: 'Todas', value: undefined },
  { label: 'Pendentes', value: 'PENDING' },
  { label: 'Vencidas', value: 'OVERDUE' },
  { label: 'Pagas', value: 'PAID' },
];

export default function DebtsPage() {
  const [statusFilter, setStatusFilter] = useState<DebtStatus | undefined>(undefined);
  const { debts, total, isLoading, error, markAsPaid, deleteDebt } = useDebts({
    filters: statusFilter !== undefined ? { status: statusFilter } : {},
  });

  return (
    <AppShell title="Suas dívidas">
      <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
        {STATUS_FILTERS.map((f) => (
          <button
            key={f.label}
            onClick={() => setStatusFilter(f.value)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              statusFilter === f.value
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-accent'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="mt-4">
        {isLoading && (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-muted animate-pulse rounded-xl" />
            ))}
          </div>
        )}

        {error && (
          <p className="text-center text-muted-foreground py-8">{error}</p>
        )}

        {!isLoading && !error && debts.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">Nenhuma dívida encontrada</p>
            <Link href="/debts/new">
              <Button>Adicionar primeira dívida</Button>
            </Link>
          </div>
        )}

        {!isLoading && !error && debts.length > 0 && (
          <>
            <p className="text-sm text-muted-foreground mb-3">
              {total} dívida{total !== 1 ? 's' : ''}
            </p>
            <div className="space-y-3">
              {debts.map((debt) => (
                <DebtCard
                  key={debt.id}
                  debt={debt}
                  onMarkAsPaid={markAsPaid}
                  onDelete={deleteDebt}
                />
              ))}
            </div>
          </>
        )}
      </div>

      <Link href="/debts/new" className="fixed bottom-6 right-4">
        <Button size="lg" className="rounded-full shadow-lg h-14 w-14 p-0">
          <Plus className="h-6 w-6" />
          <span className="sr-only">Adicionar dívida</span>
        </Button>
      </Link>
    </AppShell>
  );
}
