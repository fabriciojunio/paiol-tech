import { NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { MarkDebtAsPaidHandler, MarkDebtAsPaidCommand } from './mark-debt-paid.handler';
import { Debt } from '../../../domain/entities/debt.entity';
import type { IDebtRepository } from '../../../domain/repositories/debt.repository.interface';

const makeDebt = (overrides: Partial<ConstructorParameters<typeof Debt>[0]> = {}) =>
  new Debt({
    id: 'debt-1',
    producerId: 'prod-1',
    creditor: 'Banco do Brasil',
    amount: 1000,
    dueDate: new Date('2025-12-31'),
    source: 'MANUAL',
    status: 'PENDING',
    createdAt: new Date(),
    ...overrides,
  });

const makeRepo = (debt: Debt | null): IDebtRepository => ({
  findById: jest.fn().mockResolvedValue(debt),
  findByContractNumber: jest.fn().mockResolvedValue(null),
  findByProducer: jest.fn(),
  findUpcoming: jest.fn(),
  findPossibleDuplicate: jest.fn(),
  countByProducer: jest.fn(),
  save: jest.fn(),
  update: jest.fn().mockImplementation((_id: string, data: { status: string }) =>
    Promise.resolve(makeDebt({ status: data.status as 'PAID' })),
  ),
  delete: jest.fn(),
  markOverdue: jest.fn(),
  getDashboard: jest.fn(),
});

describe('MarkDebtAsPaidHandler', () => {
  it('marca dívida PENDING como PAID', async () => {
    const debt = makeDebt({ status: 'PENDING' });
    const repo = makeRepo(debt);
    const handler = new MarkDebtAsPaidHandler(repo);
    const result = await handler.execute(new MarkDebtAsPaidCommand('debt-1', 'prod-1'));
    expect(repo.update).toHaveBeenCalledWith('debt-1', { status: 'PAID' });
    expect(result.status).toBe('PAID');
  });

  it('lança NotFoundException quando dívida não existe', async () => {
    const handler = new MarkDebtAsPaidHandler(makeRepo(null));
    await expect(handler.execute(new MarkDebtAsPaidCommand('x', 'prod-1'))).rejects.toThrow(NotFoundException);
  });

  it('lança ForbiddenException quando produtor não é dono', async () => {
    const debt = makeDebt({ producerId: 'outro-prod' });
    const handler = new MarkDebtAsPaidHandler(makeRepo(debt));
    await expect(handler.execute(new MarkDebtAsPaidCommand('debt-1', 'prod-1'))).rejects.toThrow(ForbiddenException);
  });

  it('lança BadRequestException quando dívida PAID tenta ser marcada como PAID', async () => {
    const debt = makeDebt({ status: 'PAID' });
    const handler = new MarkDebtAsPaidHandler(makeRepo(debt));
    await expect(handler.execute(new MarkDebtAsPaidCommand('debt-1', 'prod-1'))).rejects.toThrow(BadRequestException);
  });

  it('permite OVERDUE → PAID', async () => {
    const debt = makeDebt({ status: 'OVERDUE' });
    const repo = makeRepo(debt);
    const handler = new MarkDebtAsPaidHandler(repo);
    await handler.execute(new MarkDebtAsPaidCommand('debt-1', 'prod-1'));
    expect(repo.update).toHaveBeenCalledWith('debt-1', { status: 'PAID' });
  });
});
