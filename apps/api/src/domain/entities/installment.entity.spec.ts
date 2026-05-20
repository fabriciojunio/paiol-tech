import { Installment } from './installment.entity';

describe('Installment', () => {
  const makeInstallment = (overrides = {}) =>
    new Installment({
      debtId: 'debt-1',
      numero: 1,
      valor: 1000,
      dataVencimento: new Date('2025-01-01'),
      status: 'PENDENTE',
      ...overrides,
    });

  it('deve criar parcela com id gerado automaticamente', () => {
    const parcela = makeInstallment();
    expect(parcela.id).toBeDefined();
    expect(parcela.id).toHaveLength(36);
  });

  it('deve identificar parcela vencida corretamente', () => {
    const vencida = makeInstallment({ dataVencimento: new Date('2020-01-01') });
    expect(vencida.estaVencida()).toBe(true);
  });

  it('nao deve considerar parcela paga como vencida', () => {
    const paga = makeInstallment({ status: 'PAGO' });
    expect(paga.estaVencida()).toBe(false);
  });

  it('deve registrar pagamento e alterar status para PAGO', () => {
    const parcela = makeInstallment({ dataVencimento: new Date(Date.now() + 86_400_000) });
    parcela.registrarPagamento(new Date());
    expect(parcela.status).toBe('PAGO');
  });

  it('deve lancar erro ao tentar pagar parcela ja paga', () => {
    const parcela = makeInstallment({ status: 'PAGO' });
    expect(() => parcela.registrarPagamento(new Date())).toThrow('Parcela já foi paga');
  });

  it('deve retornar 0 de juros para parcela nao vencida', () => {
    const parcela = makeInstallment({ dataVencimento: new Date(Date.now() + 86_400_000 * 30) });
    expect(parcela.calcularJuros(0.02)).toBe(0);
  });
});
