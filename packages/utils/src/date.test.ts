import { describe, it, expect } from 'vitest';
import { daysUntil, isOverdue, dueDateLabel, formatDateBR } from './date';

describe('daysUntil', () => {
  it('should return 0 for today', () => {
    const today = new Date();
    expect(daysUntil(today)).toBe(0);
  });

  it('should return positive for future date', () => {
    const future = new Date();
    future.setDate(future.getDate() + 5);
    expect(daysUntil(future)).toBe(5);
  });

  it('should return negative for past date', () => {
    const past = new Date();
    past.setDate(past.getDate() - 3);
    expect(daysUntil(past)).toBe(-3);
  });
});

describe('isOverdue', () => {
  it('should be overdue for yesterday', () => {
    const past = new Date();
    past.setDate(past.getDate() - 1);
    expect(isOverdue(past)).toBe(true);
  });

  it('should not be overdue for today', () => {
    expect(isOverdue(new Date())).toBe(false);
  });
});

describe('dueDateLabel', () => {
  it('should label today', () => {
    expect(dueDateLabel(new Date())).toBe('Vence hoje');
  });

  it('should label tomorrow', () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    expect(dueDateLabel(tomorrow)).toBe('Vence amanhã');
  });

  it('should label past as overdue', () => {
    const past = new Date();
    past.setDate(past.getDate() - 2);
    expect(dueDateLabel(past)).toContain('Vencida há 2 dias');
  });
});

describe('formatDateBR', () => {
  it('should format date in Brazilian format', () => {
    expect(formatDateBR(new Date('2025-08-15T12:00:00Z'))).toBe('15/08/2025');
  });
});
