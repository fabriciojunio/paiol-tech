import type { Debt } from '../entities/debt.entity';
import type { DebtFilters, PaginationQuery } from '@paiol/types';

export interface DebtPage {
  debts: Debt[];
  total: number;
}

export interface DuplicateCheckParams {
  producerId: string;
  amount: number;
  dueDate: Date;
  excludeId?: string;
}

export interface IDebtRepository {
  findById(id: string): Promise<Debt | null>;
  findByContractNumber(producerId: string, contractNumber: string): Promise<Debt | null>;
  findByProducer(producerId: string, filters?: DebtFilters, pagination?: PaginationQuery): Promise<DebtPage>;
  findUpcoming(producerId: string, daysAhead: number): Promise<Debt[]>;
  findPossibleDuplicate(params: DuplicateCheckParams): Promise<Debt | null>;
  countByProducer(producerId: string): Promise<number>;
  save(debt: Debt): Promise<Debt>;
  update(id: string, data: Partial<Pick<Debt, 'creditor' | 'amount' | 'dueDate' | 'description' | 'status'>>): Promise<Debt>;
  delete(id: string): Promise<void>;
  markOverdue(): Promise<number>;
  getDashboard(producerId: string): Promise<{
    totalOwed: number;
    overdueCount: number;
    overdueAmount: number;
    nextDue: Debt | null;
    upcomingDebts: Debt[];
    countByStatus: Record<string, number>;
  }>;
}

export const DEBT_REPOSITORY = Symbol('IDebtRepository');
