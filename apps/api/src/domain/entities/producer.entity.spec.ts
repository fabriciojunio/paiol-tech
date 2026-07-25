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
    expect(() => new Producer({ ...validProps, plan: 'gold' as never })).toThrow('inválido');
  });

  it('permite cadastro ilimitado de dívidas no plano básico (núcleo grátis)', () => {
    const producer = new Producer(validProps);
    expect(producer.canAddDebt(4)).toBe(true);
    expect(producer.canAddDebt(1000)).toBe(true);
  });

  it('permite cadastro ilimitado no plano professional', () => {
    const producer = new Producer({ ...validProps, plan: 'professional' });
    expect(producer.canAddDebt(1000)).toBe(true);
  });

  it('libera voz e foto de boleto em todos os planos', () => {
    const basic = new Producer(validProps);
    expect(basic.hasVoiceAccess).toBe(true);
    expect(basic.hasOcrAccess).toBe(true);

    const pro = new Producer({ ...validProps, plan: 'professional' });
    expect(pro.hasVoiceAccess).toBe(true);
    expect(pro.hasOcrAccess).toBe(true);
  });
});
