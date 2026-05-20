import type { Debt } from '@paiol/types';

const DUPLICATE_VALUE_TOLERANCE = 0.05;
const DUPLICATE_DATE_TOLERANCE_DAYS = 15;

export function isPossibleDuplicate(
  existing: Pick<Debt, 'amount' | 'dueDate'>,
  candidate: { amount: number; dueDate: Date },
): boolean {
  const valueDiff = Math.abs(existing.amount - candidate.amount) / existing.amount;
  if (valueDiff > DUPLICATE_VALUE_TOLERANCE) return false;

  const daysDiff =
    Math.abs(new Date(existing.dueDate).getTime() - candidate.dueDate.getTime()) /
    (1000 * 60 * 60 * 24);
  return daysDiff <= DUPLICATE_DATE_TOLERANCE_DAYS;
}

export function calcTotalOwed(debts: Pick<Debt, 'amount' | 'status'>[]): number {
  return debts
    .filter((d) => d.status === 'PENDING' || d.status === 'OVERDUE')
    .reduce((sum, d) => sum + d.amount, 0);
}

export const COMMON_CREDITORS = [
  'Banco do Brasil',
  'Caixa Econômica Federal',
  'Banco do Nordeste',
  'Sicredi',
  'Sicoob',
  'Bradesco',
  'Itaú',
  'Santander',
  'BNB',
  'BNDES',
  'Cooperativa de Crédito',
] as const;
