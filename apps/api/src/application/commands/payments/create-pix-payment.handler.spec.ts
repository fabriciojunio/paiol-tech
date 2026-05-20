import { NotFoundException } from '@nestjs/common';
import { CreatePixPaymentHandler } from './create-pix-payment.handler';
import { CreatePixPaymentCommand } from './create-pix-payment.command';
import { Producer } from '../../../domain/entities/producer.entity';
import { Debt } from '../../../domain/entities/debt.entity';
import type { IProducerRepository } from '../../../domain/repositories/producer.repository.interface';
import type { IDebtRepository } from '../../../domain/repositories/debt.repository.interface';
import type { IPaymentService, CreatePixPaymentResult } from '../../../domain/services/payment.service.interface';

const makeProducer = () =>
  new Producer({ id: 'prod-1', phone: '+5511987654321', plan: 'professional', createdAt: new Date() });

const makeDebt = () =>
  new Debt({ id: 'debt-1', producerId: 'prod-1', creditor: 'BB', amount: 1500, dueDate: new Date(), source: 'MANUAL', status: 'PENDING', createdAt: new Date() });

const makePixResult = (): CreatePixPaymentResult => ({
  paymentId: 'pay-123',
  qrCode: '00020126...',
  qrCodeUrl: 'https://mock/qr.png',
  expiresAt: new Date(),
});

const makeProducerRepo = (p: Producer | null = makeProducer()): IProducerRepository => ({
  findById: jest.fn().mockResolvedValue(p),
  findByPhone: jest.fn(),
  save: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
});

const makeDebtRepo = (d: Debt | null = makeDebt()): IDebtRepository => ({
  findById: jest.fn().mockResolvedValue(d),
  findByContractNumber: jest.fn().mockResolvedValue(null),
  findByProducer: jest.fn(),
  findUpcoming: jest.fn(),
  findPossibleDuplicate: jest.fn(),
  countByProducer: jest.fn(),
  save: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  markOverdue: jest.fn(),
  getDashboard: jest.fn(),
});

const makePaymentService = (): IPaymentService => ({
  createPixPayment: jest.fn().mockResolvedValue(makePixResult()),
  getPaymentStatus: jest.fn().mockResolvedValue('PENDING'),
  verifyWebhookSignature: jest.fn().mockReturnValue(true),
});

describe('CreatePixPaymentHandler', () => {
  it('cria pagamento PIX com sucesso', async () => {
    const svc = makePaymentService();
    const handler = new CreatePixPaymentHandler(makeProducerRepo(), makeDebtRepo(), svc);
    const result = await handler.execute(new CreatePixPaymentCommand('prod-1', 'debt-1', 1500, 'Pagamento dívida BB'));
    expect(result.paymentId).toBe('pay-123');
    expect(svc.createPixPayment).toHaveBeenCalledWith(expect.objectContaining({ amount: 1500, externalId: 'debt-1' }));
  });

  it('lança NotFoundException se produtor não existe', async () => {
    const handler = new CreatePixPaymentHandler(makeProducerRepo(null), makeDebtRepo(), makePaymentService());
    await expect(handler.execute(new CreatePixPaymentCommand('x', 'debt-1', 100, 'test'))).rejects.toThrow(NotFoundException);
  });

  it('lança NotFoundException se dívida não existe', async () => {
    const handler = new CreatePixPaymentHandler(makeProducerRepo(), makeDebtRepo(null), makePaymentService());
    await expect(handler.execute(new CreatePixPaymentCommand('prod-1', 'x', 100, 'test'))).rejects.toThrow(NotFoundException);
  });

  it('lança NotFoundException se dívida pertence a outro produtor', async () => {
    const wrongDebt = new Debt({ id: 'debt-1', producerId: 'other-prod', creditor: 'BB', amount: 1500, dueDate: new Date(), source: 'MANUAL', status: 'PENDING', createdAt: new Date() });
    const handler = new CreatePixPaymentHandler(makeProducerRepo(), makeDebtRepo(wrongDebt), makePaymentService());
    await expect(handler.execute(new CreatePixPaymentCommand('prod-1', 'debt-1', 100, 'test'))).rejects.toThrow(NotFoundException);
  });
});
