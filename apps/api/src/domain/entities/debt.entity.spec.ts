import { Debt } from './debt.entity';

const validProps = {
  id: 'debt-1',
  producerId: 'prod-1',
  creditor: 'Banco do Brasil',
  amount: 5000,
  dueDate: new Date('2025-08-01'),
  source: 'MANUAL' as const,
  status: 'PENDING' as const,
  createdAt: new Date(),
};

describe('Debt', () => {
  it('should create a valid debt', () => {
    const debt = new Debt(validProps);
    expect(debt.creditor).toBe('Banco do Brasil');
    expect(debt.amount).toBe(5000);
  });

  it('should trim creditor whitespace', () => {
    const debt = new Debt({ ...validProps, creditor: '  Sicredi  ' });
    expect(debt.creditor).toBe('Sicredi');
  });

  it('should throw for empty creditor', () => {
    expect(() => new Debt({ ...validProps, creditor: '' })).toThrow();
    expect(() => new Debt({ ...validProps, creditor: '   ' })).toThrow();
  });

  it('should throw for zero amount', () => {
    expect(() => new Debt({ ...validProps, amount: 0 })).toThrow();
  });

  it('should throw for negative amount', () => {
    expect(() => new Debt({ ...validProps, amount: -100 })).toThrow();
  });

  it('should throw for invalid date', () => {
    expect(() => new Debt({ ...validProps, dueDate: new Date('invalid') })).toThrow();
  });

  it('should detect overdue status', () => {
    const past = new Date();
    past.setDate(past.getDate() - 1);
    const debt = new Debt({ ...validProps, dueDate: past });
    expect(debt.isOverdue).toBe(true);
  });

  it('should not be overdue for future date', () => {
    const future = new Date();
    future.setDate(future.getDate() + 30);
    const debt = new Debt({ ...validProps, dueDate: future });
    expect(debt.isOverdue).toBe(false);
  });

  it('should mark as paid via withStatus', () => {
    const debt = new Debt(validProps);
    const paid = debt.withStatus('PAID');
    expect(paid.status).toBe('PAID');
  });

  it('should throw for invalid status transition (PAID -> PENDING)', () => {
    const paid = new Debt({ ...validProps, status: 'PAID' });
    expect(() => paid.withStatus('PENDING')).toThrow();
  });

  it('should mark OPEN_FINANCE debts as read-only', () => {
    const debt = new Debt({ ...validProps, source: 'OPEN_FINANCE' });
    expect(debt.isReadOnly).toBe(true);
  });

  it('should allow PENDING to transition to OVERDUE', () => {
    const debt = new Debt(validProps);
    expect(debt.canTransitionTo('OVERDUE')).toBe(true);
  });

  it('should not allow PAID to transition to anything', () => {
    const paid = new Debt({ ...validProps, status: 'PAID' });
    expect(paid.canTransitionTo('PENDING')).toBe(false);
    expect(paid.canTransitionTo('OVERDUE')).toBe(false);
  });
});
