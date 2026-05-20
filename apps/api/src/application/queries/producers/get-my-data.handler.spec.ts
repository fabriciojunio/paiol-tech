import { NotFoundException } from '@nestjs/common';
import { GetMyDataHandler } from './get-my-data.handler';
import { GetMyDataQuery } from './get-my-data.query';
import { Producer } from '../../../domain/entities/producer.entity';
import { Debt } from '../../../domain/entities/debt.entity';
import type { IProducerRepository } from '../../../domain/repositories/producer.repository.interface';
import type { IDebtRepository } from '../../../domain/repositories/debt.repository.interface';

const makeProducer = () =>
  new Producer({ id: 'prod-1', phone: '+5511987654321', plan: 'professional', createdAt: new Date() });

const makeDebt = () =>
  new Debt({ id: 'd1', producerId: 'prod-1', creditor: 'BB', amount: 1000, dueDate: new Date(), source: 'MANUAL', status: 'PENDING', createdAt: new Date() });

const makeProducerRepo = (p: Producer | null = makeProducer()): IProducerRepository => ({
  findById: jest.fn().mockResolvedValue(p),
  findByPhone: jest.fn(),
  save: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
});

const makeDebtRepo = (): IDebtRepository => ({
  findById: jest.fn(),
  findByContractNumber: jest.fn().mockResolvedValue(null),
  findByProducer: jest.fn().mockResolvedValue({ debts: [makeDebt()], total: 1 }),
  findUpcoming: jest.fn(),
  findPossibleDuplicate: jest.fn(),
  countByProducer: jest.fn(),
  save: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  markOverdue: jest.fn(),
  getDashboard: jest.fn(),
});

const makeAudit = () => ({
  log: jest.fn().mockResolvedValue(undefined),
  findByProducer: jest.fn().mockResolvedValue([]),
});

describe('GetMyDataHandler', () => {
  it('retorna export completo com producer, debts e auditLogs', async () => {
    const audit = makeAudit();
    const handler = new GetMyDataHandler(makeProducerRepo(), makeDebtRepo(), audit as never);
    const result = await handler.execute(new GetMyDataQuery('prod-1'));
    expect(result.producer.phone).toBe('+5511987654321');
    expect(result.debts).toHaveLength(1);
    expect(result.auditLogs).toEqual([]);
    expect(result.exportedAt).toBeDefined();
    expect(audit.log).toHaveBeenCalledWith(expect.objectContaining({ action: 'DATA_EXPORT' }));
  });

  it('lança NotFoundException se produtor não existe', async () => {
    const handler = new GetMyDataHandler(makeProducerRepo(null), makeDebtRepo(), makeAudit() as never);
    await expect(handler.execute(new GetMyDataQuery('x'))).rejects.toThrow(NotFoundException);
  });
});
