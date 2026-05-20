import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { DeleteDebtHandler, DeleteDebtCommand } from './delete-debt.handler';
import { Debt } from '../../../domain/entities/debt.entity';
import type { IDebtRepository } from '../../../domain/repositories/debt.repository.interface';

const makeDebt = (producerId = 'prod-1') =>
  new Debt({
    id: 'debt-1',
    producerId,
    creditor: 'Caixa',
    amount: 800,
    dueDate: new Date('2025-11-30'),
    source: 'MANUAL',
    status: 'PENDING',
    createdAt: new Date(),
  });

const makeRepo = (debt: Debt | null): IDebtRepository => ({
  findById: jest.fn().mockResolvedValue(debt),
  findByContractNumber: jest.fn().mockResolvedValue(null),
  findByProducer: jest.fn(),
  findUpcoming: jest.fn(),
  findPossibleDuplicate: jest.fn(),
  countByProducer: jest.fn(),
  save: jest.fn(),
  update: jest.fn(),
  delete: jest.fn().mockResolvedValue(undefined),
  markOverdue: jest.fn(),
  getDashboard: jest.fn(),
});

describe('DeleteDebtHandler', () => {
  it('deleta dívida com sucesso', async () => {
    const repo = makeRepo(makeDebt());
    const handler = new DeleteDebtHandler(repo);
    await handler.execute(new DeleteDebtCommand('debt-1', 'prod-1'));
    expect(repo.delete).toHaveBeenCalledWith('debt-1');
  });

  it('lança NotFoundException quando dívida não existe', async () => {
    const handler = new DeleteDebtHandler(makeRepo(null));
    await expect(handler.execute(new DeleteDebtCommand('x', 'prod-1'))).rejects.toThrow(NotFoundException);
  });

  it('lança ForbiddenException quando produtor não é dono', async () => {
    const debt = makeDebt('outro-prod');
    const handler = new DeleteDebtHandler(makeRepo(debt));
    await expect(handler.execute(new DeleteDebtCommand('debt-1', 'prod-1'))).rejects.toThrow(ForbiddenException);
  });
});
