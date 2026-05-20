import type { Alert } from '../entities/alert.entity';

export interface IAlertRepository {
  findById(id: string): Promise<Alert | null>;
  findByProducer(producerId: string): Promise<Alert[]>;
  findByDebt(debtId: string): Promise<Alert[]>;
  findPendingDue(daysAhead: number): Promise<Alert[]>;
  save(alert: Alert): Promise<Alert>;
  update(id: string, data: Partial<Pick<Alert, 'daysBefore' | 'type' | 'status' | 'sentAt'>>): Promise<Alert>;
  delete(id: string): Promise<void>;
}

export const ALERT_REPOSITORY = Symbol('IAlertRepository');
