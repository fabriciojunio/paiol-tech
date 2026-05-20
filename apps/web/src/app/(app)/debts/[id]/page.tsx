'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle2, Trash2, QrCode, Calendar, DollarSign, FileText } from 'lucide-react';
import { Button, Badge, Card, CardContent, CardHeader, CardTitle } from '@paiol/ui';
import { formatCurrency, formatDateBR, dueDateLabel } from '@paiol/utils';
import { AppShell } from '@/components/app-shell';
import { useToast } from '@/components/toast-provider';
import { apiClient, ApiClientError } from '@/lib/api-client';
import type { Debt } from '@paiol/types';

const STATUS_CONFIG = {
  PENDING: { label: 'Pendente', variant: 'warning' as const },
  PAID: { label: 'Paga', variant: 'success' as const },
  OVERDUE: { label: 'Vencida', variant: 'danger' as const },
  RENEGOTIATED: { label: 'Renegociada', variant: 'secondary' as const },
};

export default function DebtDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { toast } = useToast();

  const [debt, setDebt] = useState<Debt | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isActing, setIsActing] = useState(false);

  useEffect(() => {
    apiClient
      .get<Debt>(`/debts/${id}`)
      .then(setDebt)
      .catch(() => { toast({ title: 'Dívida não encontrada.', variant: 'destructive' }); router.replace('/debts'); })
      .finally(() => setIsLoading(false));
  }, [id, router, toast]);

  const markAsPaid = async () => {
    setIsActing(true);
    try {
      await apiClient.post(`/debts/${id}/pay`, {});
      toast({ title: 'Dívida marcada como paga!', variant: 'success' });
      router.replace('/debts');
    } catch (err) {
      const msg = err instanceof ApiClientError ? err.message : 'Erro ao marcar como paga.';
      toast({ title: msg, variant: 'destructive' });
    } finally {
      setIsActing(false);
    }
  };

  const deleteDebt = async () => {
    if (!confirm('Remover esta dívida?')) return;
    setIsActing(true);
    try {
      await apiClient.delete(`/debts/${id}`);
      toast({ title: 'Dívida removida.' });
      router.replace('/debts');
    } catch {
      toast({ title: 'Erro ao remover dívida.', variant: 'destructive' });
    } finally {
      setIsActing(false);
    }
  };

  if (isLoading) {
    return (
      <AppShell title="Dívida" showBack>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <div key={i} className="h-24 bg-muted animate-pulse rounded-xl" />)}
        </div>
      </AppShell>
    );
  }

  if (!debt) return null;

  const status = STATUS_CONFIG[debt.status];
  const isActionable = debt.status === 'PENDING' || debt.status === 'OVERDUE';
  const isReadOnly = debt.source === 'OPEN_FINANCE';

  return (
    <AppShell title="Detalhes da dívida" showBack>
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between flex-wrap gap-2">
              <CardTitle className="text-xl">{debt.creditor}</CardTitle>
              <Badge variant={status.variant}>{status.label}</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2 text-3xl font-bold">
              <DollarSign className="h-6 w-6 text-muted-foreground" />
              {formatCurrency(debt.amount)}
            </div>

            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>Vencimento: {formatDateBR(debt.dueDate)} ({dueDateLabel(new Date(debt.dueDate))})</span>
            </div>

            {debt.description && (
              <div className="flex items-start gap-2 text-sm text-muted-foreground">
                <FileText className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span>{debt.description}</span>
              </div>
            )}
          </CardContent>
        </Card>

        {isActionable && !isReadOnly && (
          <div className="space-y-2">
            <Button className="w-full" disabled={isActing} onClick={() => void markAsPaid()}>
              <CheckCircle2 className="h-4 w-4 mr-2" /> Marcar como paga
            </Button>

            <Link
              href={`/payments/pix?debtId=${debt.id}&amount=${debt.amount}&creditor=${encodeURIComponent(debt.creditor)}`}
              className="block"
            >
              <Button variant="outline" className="w-full">
                <QrCode className="h-4 w-4 mr-2" /> Pagar com PIX
              </Button>
            </Link>

            <Button
              variant="ghost"
              className="w-full text-destructive hover:text-destructive"
              disabled={isActing}
              onClick={() => void deleteDebt()}
            >
              <Trash2 className="h-4 w-4 mr-2" /> Remover dívida
            </Button>
          </div>
        )}
      </div>
    </AppShell>
  );
}
