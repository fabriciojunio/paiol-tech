'use client';

import type { Debt } from '@paiol/types';
import { formatCurrency, dueDateLabel, formatDateBR } from '@paiol/utils';
import { Badge, Button, Card, CardContent } from '@paiol/ui';
import { CheckCircle2, Trash2, ChevronRight } from 'lucide-react';
import Link from 'next/link';

const STATUS_CONFIG = {
  PENDING: { label: 'Pendente', variant: 'warning' as const },
  PAID: { label: 'Paga', variant: 'success' as const },
  OVERDUE: { label: 'Vencida', variant: 'danger' as const },
  RENEGOTIATED: { label: 'Renegociada', variant: 'secondary' as const },
};

const SOURCE_LABEL = {
  OPEN_FINANCE: 'Do banco',
  MANUAL: 'Manual',
  VOICE: 'Por voz',
  OCR: 'Foto de boleto',
};

interface DebtCardProps {
  debt: Debt;
  onMarkAsPaid?: (id: string) => void;
  onDelete?: (id: string) => void;
}

export function DebtCard({ debt, onMarkAsPaid, onDelete }: DebtCardProps) {
  const status = STATUS_CONFIG[debt.status];
  const isReadOnly = debt.source === 'OPEN_FINANCE';
  const isActionable = debt.status === 'PENDING' || debt.status === 'OVERDUE';

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-foreground truncate">{debt.creditor}</span>
              <Badge variant={status.variant}>{status.label}</Badge>
              {isReadOnly && (
                <Badge variant="outline" className="text-xs">
                  {SOURCE_LABEL[debt.source]}
                </Badge>
              )}
            </div>
            <p className="text-2xl font-bold text-foreground mt-1">{formatCurrency(debt.amount)}</p>
            <p className="text-sm text-muted-foreground mt-0.5">
              {dueDateLabel(new Date(debt.dueDate))} · {formatDateBR(debt.dueDate)}
            </p>
            {debt.description && (
              <p className="text-sm text-muted-foreground mt-0.5 truncate">{debt.description}</p>
            )}
          </div>
          <div className="flex flex-col gap-2 flex-shrink-0">
            <Link href={`/debts/${debt.id}`}>
              <Button variant="ghost" size="icon" aria-label="Ver detalhes">
                <ChevronRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>

        {(isActionable && !isReadOnly) && (
          <div className="flex gap-2 mt-3 pt-3 border-t">
            {onMarkAsPaid && (
              <Button
                size="sm"
                className="flex-1"
                onClick={() => onMarkAsPaid(debt.id)}
              >
                <CheckCircle2 className="h-4 w-4 mr-1" />
                Marcar como paga
              </Button>
            )}
            {onDelete && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onDelete(debt.id)}
                aria-label="Remover dívida"
              >
                <Trash2 className="h-4 w-4 text-muted-foreground" />
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
