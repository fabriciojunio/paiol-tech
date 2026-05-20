import { Producer } from './producer.entity';

const validProps = {
  id: '1',
  phone: '+5511999999999',
  plan: 'basic' as const,
  createdAt: new Date(),
};

describe('Producer', () => {
  it('should create a valid producer', () => {
    const producer = new Producer(validProps);
    expect(producer.phone).toBe('+5511999999999');
    expect(producer.plan).toBe('basic');
  });

  it('should throw for invalid phone', () => {
    expect(() => new Producer({ ...validProps, phone: 'invalid' })).toThrow('inválido');
  });

  it('should throw for invalid plan', () => {
    expect(() => new Producer({ ...validProps, plan: 'gold' as any })).toThrow('inválido');
  });

  it('should allow adding debt when under limit', () => {
    const producer = new Producer(validProps);
    expect(producer.canAddDebt(4)).toBe(true);
  });

  it('should block adding debt when at limit (basic = 5)', () => {
    const producer = new Producer(validProps);
    expect(producer.canAddDebt(5)).toBe(false);
  });

  it('should allow unlimited debts for professional plan', () => {
    const producer = new Producer({ ...validProps, plan: 'professional' });
    expect(producer.canAddDebt(1000)).toBe(true);
  });

  it('should report correct feature access per plan', () => {
    const basic = new Producer(validProps);
    expect(basic.hasVoiceAccess).toBe(false);
    expect(basic.hasOcrAccess).toBe(false);

    const pro = new Producer({ ...validProps, plan: 'professional' });
    expect(pro.hasVoiceAccess).toBe(true);
    expect(pro.hasOcrAccess).toBe(true);
  });
});
