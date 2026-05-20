import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { CreateDebtHandler } from './create-debt.handler';
import { CreateDebtCommand } from './create-debt.command';
import { Debt } from '../../../domain/entities/debt.entity';
import { Producer } from '../../../domain/entities/producer.entity';
import type { IDebtRepository } from '../../../domain/repositories/debt.repository.interface';
import type { IProducerRepository } from '../../../domain/repositories/producer.repository.interface';

const makeProducer = (plan: 'basic' | 'professional' = 'professional') =>
  new Producer({ id: 'prod-1', phone: '+5511987654321', name: 'João', plan, createdAt: new Date() });

const makeDebtRepo = (overrides: Partial<IDebtRepository> = {}): IDebtRepository => ({
  findById: jest.fn().mockResolvedValue(null),
  findByContractNumber: jest.fn().mockResolvedValue(null),
  findByProducer: jest.fn().mockResolvedValue({ debts: [], total: 0 }),
  findUpcoming: jest.fn().mockResolvedValue([]),
  findPossibleDuplicate: jest.fn().mockResolvedValue(null),
  countByProducer: jest.fn().mockResolvedValue(0),
  save: jest.fn().mockImplementation((d: Debt) => Promise.resolve(d)),
  update: jest.fn(),
  delete: jest.fn().mockResolvedValue(undefined),
  markOverdue: jest.fn().mockResolvedValue(0),
  getDashboard: jest.fn(),
  ...overrides,
});

const makeProducerRepo = (producer: Producer | null = makeProducer()): IProducerRepository => ({
  findById: jest.fn().mockResolvedValue(producer),
  findByPhone: jest.fn().mockResolvedValue(null),
  save: jest.fn().mockImplementation((p: Producer) => Promise.resolve(p)),
  update: jest.fn(),
  delete: jest.fn(),
});

const baseCommand = new CreateDebtCommand(
  'prod-1',
  'Sicredi',
  5000,
  new Date('2025-12-31'),
  'MANUAL',
  undefined,
  undefined,
  undefined,
  false,
);

describe('CreateDebtHandler', () => {
  it('cria uma dívida com sucesso', async () => {
    const debtRepo = makeDebtRepo();
    const handler = new CreateDebtHandler(debtRepo, makeProducerRepo());
    const result = await handler.execute(baseCommand);
    expect(result).toBeInstanceOf(Debt);
    expect(result.creditor).toBe('Sicredi');
    expect(result.amount).toBe(5000);
    expect(result.status).toBe('PENDING');
    expect(debtRepo.save).toHaveBeenCalled();
  });

  it('lança se o produtor não existe', async () => {
    const handler = new CreateDebtHandler(makeDebtRepo(), makeProducerRepo(null));
    await expect(handler.execute(baseCommand)).rejects.toThrow(BadRequestException);
  });

  it('lança PLAN_LIMIT_REACHED quando limite do plano básico é atingido', async () => {
    const producer = makeProducer('basic');
    const debtRepo = makeDebtRepo({ countByProducer: jest.fn().mockResolvedValue(5) });
    const handler = new CreateDebtHandler(debtRepo, makeProducerRepo(producer));
    await expect(handler.execute(baseCommand)).rejects.toThrow(ForbiddenException);
  });

  it('lança DUPLICATE_DEBT quando há possível duplicata', async () => {
    const existing = new Debt({
      id: 'debt-old',
      producerId: 'prod-1',
      creditor: 'Sicredi',
      amount: 5100,
      dueDate: new Date('2025-12-20'),
      source: 'MANUAL',
      status: 'PENDING',
      createdAt: new Date(),
    });
    const debtRepo = makeDebtRepo({ findPossibleDuplicate: jest.fn().mockResolvedValue(existing) });
    const handler = new CreateDebtHandler(debtRepo, makeProducerRepo());
    await expect(handler.execute(baseCommand)).rejects.toThrow(BadRequestException);
  });

  it('ignora duplicata quando forceDuplicate = true', async () => {
    const existing = new Debt({
      id: 'debt-old',
      producerId: 'prod-1',
      creditor: 'Sicredi',
      amount: 5100,
      dueDate: new Date('2025-12-20'),
      source: 'MANUAL',
      status: 'PENDING',
      createdAt: new Date(),
    });
    const debtRepo = makeDebtRepo({ findPossibleDuplicate: jest.fn().mockResolvedValue(existing) });
    const command = new CreateDebtCommand('prod-1', 'Sicredi', 5000, new Date('2025-12-31'), 'MANUAL', undefined, undefined, undefined, true);
    const handler = new CreateDebtHandler(debtRepo, makeProducerRepo());
    const result = await handler.execute(command);
    expect(result).toBeInstanceOf(Debt);
    expect(debtRepo.findPossibleDuplicate).not.toHaveBeenCalled();
  });
});
