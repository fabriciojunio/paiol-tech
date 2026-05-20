import type { AlertStatus, AlertType } from '@paiol/types';

const VALID_DAYS_BEFORE = [1, 3, 5, 7, 15] as const;

interface AlertProps {
  id: string;
  producerId: string;
  debtId: string;
  type: AlertType;
  daysBefore: number;
  sentAt?: Date;
  status: AlertStatus;
  createdAt: Date;
}

export class Alert {
  readonly id: string;
  readonly producerId: string;
  readonly debtId: string;
  readonly type: AlertType;
  readonly daysBefore: number;
  readonly sentAt?: Date;
  readonly status: AlertStatus;
  readonly createdAt: Date;

  constructor(props: AlertProps) {
    if (!VALID_DAYS_BEFORE.includes(props.daysBefore as (typeof VALID_DAYS_BEFORE)[number])) {
      throw new Error(`daysBefore inválido. Valores aceitos: ${VALID_DAYS_BEFORE.join(', ')}`);
    }
    Object.assign(this, props);
    this.id = props.id;
    this.producerId = props.producerId;
    this.debtId = props.debtId;
    this.type = props.type;
    this.daysBefore = props.daysBefore;
    this.sentAt = props.sentAt;
    this.status = props.status;
    this.createdAt = props.createdAt;
  }

  get isPending(): boolean {
    return this.status === 'PENDING';
  }

  markAsSent(): Alert {
    return new Alert({ ...this, status: 'SENT', sentAt: new Date() });
  }

  markAsFailed(): Alert {
    return new Alert({ ...this, status: 'FAILED' });
  }
}
