import type { DebtSource, DebtStatus } from '@paiol/types';

const VALID_STATUS_TRANSITIONS: Record<DebtStatus, DebtStatus[]> = {
  PENDING: ['PAID', 'OVERDUE', 'RENEGOTIATED'],
  OVERDUE: ['PAID', 'RENEGOTIATED'],
  PAID: [],
  RENEGOTIATED: [],
};

interface DebtProps {
  id: string;
  producerId: string;
  creditor: string;
  amount: number;
  dueDate: Date;
  description?: string;
  source: DebtSource;
  status: DebtStatus;
  bankCode?: string;
  contractNumber?: string;
  createdAt: Date;
}

export class Debt {
  readonly id: string;
  readonly producerId: string;
  readonly creditor: string;
  readonly amount: number;
  readonly dueDate: Date;
  readonly description?: string;
  readonly source: DebtSource;
  readonly status: DebtStatus;
  readonly bankCode?: string;
  readonly contractNumber?: string;
  readonly createdAt: Date;

  constructor(props: DebtProps) {
    if (!props.creditor?.trim()) throw new Error('Nome do credor é obrigatório');
    if (props.amount <= 0) throw new Error('Valor deve ser maior que zero');
    if (!(props.dueDate instanceof Date) || isNaN(props.dueDate.getTime())) {
      throw new Error('Data de vencimento inválida');
    }
    Object.assign(this, props);
    this.id = props.id;
    this.producerId = props.producerId;
    this.creditor = props.creditor.trim();
    this.amount = props.amount;
    this.dueDate = props.dueDate;
    this.description = props.description;
    this.source = props.source;
    this.status = props.status;
    this.bankCode = props.bankCode;
    this.contractNumber = props.contractNumber;
    this.createdAt = props.createdAt;
  }

  get isOverdue(): boolean {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    return this.status === 'PENDING' && this.dueDate < now;
  }

  get isReadOnly(): boolean {
    return this.source === 'OPEN_FINANCE';
  }

  canTransitionTo(newStatus: DebtStatus): boolean {
    return VALID_STATUS_TRANSITIONS[this.status]?.includes(newStatus) ?? false;
  }

  withStatus(newStatus: DebtStatus): Debt {
    if (!this.canTransitionTo(newStatus)) {
      throw new Error(`Não é possível mudar de ${this.status} para ${newStatus}`);
    }
    return new Debt({ ...this, status: newStatus });
  }
}
