'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { AlertTriangle, TrendingUp, Clock, Plus } from 'lucide-react';
import { Button, Card, CardContent } from '@paiol/ui';
import { formatCurrency, dueDateLabel } from '@paiol/utils';
import { apiClient } from '@/lib/api-client';
import { DebtCard } from '@/components/debt-card';
import { AppShell } from '@/components/app-shell';
import { useAuth } from '@/contexts/auth-context';
import type { Debt } from '@paiol/types';

interface DashboardData {
  totalOwed: number;
  overdueCount: number;
  overdueAmount: number;
  nextDue: { debt: Debt; daysUntil: number } | null;
  upcomingDebts: Debt[];
  countByStatus: { PENDING: number; PAID: number; OVERDUE: number };
}

export default function HomePage() {
  useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    apiClient
      .get<DashboardData>('/debts/dashboard')
      .then((d) => { if (!cancelled) setData(d); })
      .catch(() => {})
      .finally(() => { if (!cancelled) setIsLoading(false); });
    return () => { cancelled = true; };
  }, []);

  return (
    <AppShell title="🌾 Paiol">
      <div className="space-y-4">
        <p className="text-muted-foreground text-sm">
          Olá! Aqui estão suas dívidas.
        </p>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => <div key={i} className="h-28 bg-muted animate-pulse rounded-xl" />)}
          </div>
        ) : data ? (
          <>
            {/* Total em dívida */}
            <Card className="bg-primary text-primary-foreground">
              <CardContent className="p-5">
                <p className="text-primary-foreground/80 text-sm">Você deve ao total</p>
                <p className="text-4xl font-bold mt-1">{formatCurrency(data.totalOwed)}</p>
                <div className="flex gap-4 mt-3 text-sm text-primary-foreground/80">
                  <span>{data.countByStatus.PENDING} pendente{data.countByStatus.PENDING !== 1 ? 's' : ''}</span>
                  {data.overdueCount > 0 && (
                    <span className="text-yellow-300 font-medium">
                      {data.overdueCount} vencida{data.overdueCount !== 1 ? 's' : ''}
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Dívidas vencidas */}
            {data.overdueCount > 0 && (
              <Card className="border-red-200 bg-red-50">
                <CardContent className="p-4 flex items-center gap-3">
                  <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-red-900">
                      {data.overdueCount} dívida{data.overdueCount !== 1 ? 's' : ''} vencida{data.overdueCount !== 1 ? 's' : ''}
                    </p>
                    <p className="text-sm text-red-700">{formatCurrency(data.overdueAmount)} em atraso</p>
                  </div>
                  <Link href="/debts?status=OVERDUE" className="ml-auto">
                    <Button size="sm" variant="destructive">Ver</Button>
                  </Link>
                </CardContent>
              </Card>
            )}

            {/* Próximo vencimento */}
            {data.nextDue && (
              <Card>
                <CardContent className="p-4 flex items-center gap-3">
                  <Clock className="h-5 w-5 text-primary flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-muted-foreground">Próximo vencimento</p>
                    <p className="font-semibold truncate">{data.nextDue.debt.creditor}</p>
                    <p className="text-sm">
                      {formatCurrency(data.nextDue.debt.amount)} · {dueDateLabel(new Date(data.nextDue.debt.dueDate))}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Próximos vencimentos */}
            {data.upcomingDebts.length > 0 && (
              <div>
                <h2 className="font-semibold mb-3 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" /> Vencendo em breve
                </h2>
                <div className="space-y-3">
                  {data.upcomingDebts.map((debt) => (
                    <DebtCard key={debt.id} debt={debt} />
                  ))}
                </div>
                <Link href="/debts" className="block mt-3">
                  <Button variant="outline" className="w-full">Ver todas as dívidas</Button>
                </Link>
              </div>
            )}

            {data.totalOwed === 0 && (
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">Nenhuma dívida pendente — parabéns! 🎉</p>
                <Link href="/debts/new">
                  <Button><Plus className="h-4 w-4 mr-2" />Adicionar dívida</Button>
                </Link>
              </div>
            )}
          </>
        ) : (
          <p className="text-center text-muted-foreground py-8">
            Algo deu errado. Tente novamente em instantes.
          </p>
        )}
      </div>
    </AppShell>
  );
}
