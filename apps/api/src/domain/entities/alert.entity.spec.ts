import { Alert } from './alert.entity';

const validProps = {
  id: 'alert-1',
  producerId: 'prod-1',
  debtId: 'debt-1',
  type: 'WHATSAPP' as const,
  daysBefore: 3,
  status: 'PENDING' as const,
  createdAt: new Date(),
};

describe('Alert', () => {
  it('should create a valid alert', () => {
    const alert = new Alert(validProps);
    expect(alert.daysBefore).toBe(3);
    expect(alert.status).toBe('PENDING');
  });

  it('should accept all valid daysBefore values', () => {
    for (const days of [1, 3, 5, 7, 15]) {
      const alert = new Alert({ ...validProps, daysBefore: days });
      expect(alert.daysBefore).toBe(days);
    }
  });

  it('should throw for invalid daysBefore', () => {
    expect(() => new Alert({ ...validProps, daysBefore: 2 })).toThrow();
    expect(() => new Alert({ ...validProps, daysBefore: 0 })).toThrow();
    expect(() => new Alert({ ...validProps, daysBefore: 30 })).toThrow();
  });

  it('should mark as sent', () => {
    const alert = new Alert(validProps);
    const sent = alert.markAsSent();
    expect(sent.status).toBe('SENT');
    expect(sent.sentAt).toBeInstanceOf(Date);
  });

  it('should mark as failed', () => {
    const alert = new Alert(validProps);
    const failed = alert.markAsFailed();
    expect(failed.status).toBe('FAILED');
  });

  it('should report isPending correctly', () => {
    const pending = new Alert(validProps);
    expect(pending.isPending).toBe(true);
    const sent = pending.markAsSent();
    expect(sent.isPending).toBe(false);
  });
});
