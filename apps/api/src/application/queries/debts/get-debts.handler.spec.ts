import { GetDebtsByProducerHandler, GetDebtDashboardHandler } from './get-debts.handler';
import { GetDebtsByProducerQuery, GetDebtDashboardQuery } from './get-debts.query';
import type { IDebtRepository, DebtPage } from '../../../domain/repositories/debt.repository.interface';
import { Debt } from '../../../domain/entities/debt.entity';

const makeDebt = (id: string) =>
  new Debt({
    id,
    producerId: 'prod-1',
    creditor: 'Banco',
    amount: 1000,
    dueDate: new Date('2025-12-31'),
    source: 'MANUAL',
    status: 'PENDING',
    createdAt: new Date(),
  });

const makePage = (ids: string[]): DebtPage => ({
  debts: ids.map((id) => makeDebt(id)),
  total: ids.length,
});

const makeRepo = (overrides: Partial<IDebtRepository> = {}): IDebtRepository => ({
  findById: jest.fn(),
  findByContractNumber: jest.fn().mockResolvedValue(null),
  findByProducer: jest.fn().mockResolvedValue(makePage([])),
  findUpcoming: jest.fn(),
  findPossibleDuplicate: jest.fn(),
  countByProducer: jest.fn(),
  save: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  markOverdue: jest.fn(),
  getDashboard: jest.fn().mockResolvedValue({ totalOwed: 0, overdueCount: 0, overdueAmount: 0, nextDue: null, upcomingDebts: [], countByStatus: {} }),
  ...overrides,
});

describe('GetDebtsByProducerHandler', () => {
  it('retorna lista de dívidas do produtor', async () => {
    const page = makePage(['d1', 'd2', 'd3']);
    const repo = makeRepo({ findByProducer: jest.fn().mockResolvedValue(page) });
    const handler = new GetDebtsByProducerHandler(repo);
    const result = await handler.execute(new GetDebtsByProducerQuery('prod-1'));
    expect(result.total).toBe(3);
    expect(result.debts).toHaveLength(3);
  });

  it('passa filtros e paginação para o repositório', async () => {
    const repo = makeRepo();
    const handler = new GetDebtsByProducerHandler(repo);
    const filters = { status: 'PENDING' as const };
    const pagination = { page: 2, limit: 10 };
    await handler.execute(new GetDebtsByProducerQuery('prod-1', filters, pagination));
    expect(repo.findByProducer).toHaveBeenCalledWith('prod-1', filters, pagination);
  });
});

describe('GetDebtDashboardHandler', () => {
  it('retorna dados do dashboard', async () => {
    const dashboard = {
      totalOwed: 15000,
      overdueCount: 2,
      overdueAmount: 5000,
      nextDue: makeDebt('d1'),
      upcomingDebts: [makeDebt('d2')],
      countByStatus: { PENDING: 3, OVERDUE: 2, PAID: 1 },
    };
    const repo = makeRepo({ getDashboard: jest.fn().mockResolvedValue(dashboard) });
    const handler = new GetDebtDashboardHandler(repo);
    const result = await handler.execute(new GetDebtDashboardQuery('prod-1'));
    expect(result.totalOwed).toBe(15000);
    expect(result.overdueCount).toBe(2);
  });
});
