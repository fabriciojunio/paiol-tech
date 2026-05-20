import { NotFoundException } from '@nestjs/common';
import { SyncOpenFinanceHandler } from './sync-open-finance.handler';
import { SyncOpenFinanceCommand } from './sync-open-finance.command';
import { Producer } from '../../../domain/entities/producer.entity';
import { Debt } from '../../../domain/entities/debt.entity';
import type { IOpenFinanceService, BankDebt } from '../../../domain/services/open-finance.service.interface';
import type { IOpenFinanceRepository } from '../../../domain/repositories/open-finance.repository.interface';
import type { IProducerRepository } from '../../../domain/repositories/producer.repository.interface';
import type { IDebtRepository } from '../../../domain/repositories/debt.repository.interface';

const makeProducer = (cpfCnpj = '123.456.789-09') =>
  new Producer({ id: 'prod-1', phone: '+5511987654321', plan: 'professional', cpfCnpj, createdAt: new Date() });

const makeBankDebt = (contractNumber: string): BankDebt => ({
  contractNumber,
  creditor: 'Banco do Brasil',
  amount: 5000,
  dueDate: new Date('2026-03-15'),
  bankCode: '001',
  bankName: 'Banco do Brasil',
});

const makeAudit = () => ({ log: jest.fn().mockResolvedValue(undefined) });

const makeOfService = (debts: BankDebt[] = []): IOpenFinanceService => ({
  getAvailableBanks: jest.fn().mockResolvedValue([]),
  fetchDebts: jest.fn().mockResolvedValue(debts),
});

const makeOfRepo = (): IOpenFinanceRepository => ({
  findByProducer: jest.fn(),
  findByProducerAndBank: jest.fn(),
  save: jest.fn(),
  updateLastSync: jest.fn().mockResolvedValue(undefined),
  revoke: jest.fn(),
});

const makeProducerRepo = (p: Producer | null = makeProducer()): IProducerRepository => ({
  findById: jest.fn().mockResolvedValue(p),
  findByPhone: jest.fn(),
  save: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
});

const makeDebtRepo = (existingByContract: Debt | null = null): IDebtRepository => ({
  findById: jest.fn(),
  findByContractNumber: jest.fn().mockResolvedValue(existingByContract),
  findByProducer: jest.fn(),
  findUpcoming: jest.fn(),
  findPossibleDuplicate: jest.fn(),
  countByProducer: jest.fn(),
  save: jest.fn().mockImplementation((d: Debt) => Promise.resolve(d)),
  update: jest.fn(),
  delete: jest.fn(),
  markOverdue: jest.fn(),
  getDashboard: jest.fn(),
});

const CMD = new SyncOpenFinanceCommand('prod-1', '001', 'conn-1');

describe('SyncOpenFinanceHandler', () => {
  it('importa dívidas novas do banco', async () => {
    const debtRepo = makeDebtRepo(null);
    const bankDebts = [makeBankDebt('OF-001'), makeBankDebt('OF-002')];
    const handler = new SyncOpenFinanceHandler(makeOfService(bankDebts), makeOfRepo(), makeProducerRepo(), debtRepo, makeAudit() as never);
    const result = await handler.execute(CMD);
    expect(result.imported).toBe(2);
    expect(result.skipped).toBe(0);
    expect(result.total).toBe(2);
    expect(debtRepo.save).toHaveBeenCalledTimes(2);
  });

  it('pula dívidas já existentes pelo contractNumber', async () => {
    const existing = new Debt({ id: 'd1', producerId: 'prod-1', creditor: 'BB', amount: 5000, dueDate: new Date(), source: 'OPEN_FINANCE', status: 'PENDING', createdAt: new Date() });
    const debtRepo = makeDebtRepo(existing);
    const bankDebts = [makeBankDebt('OF-001'), makeBankDebt('OF-002')];
    const handler = new SyncOpenFinanceHandler(makeOfService(bankDebts), makeOfRepo(), makeProducerRepo(), debtRepo, makeAudit() as never);
    const result = await handler.execute(CMD);
    expect(result.imported).toBe(0);
    expect(result.skipped).toBe(2);
  });

  it('lança NotFoundException se produtor não existe', async () => {
    const handler = new SyncOpenFinanceHandler(makeOfService(), makeOfRepo(), makeProducerRepo(null), makeDebtRepo(), makeAudit() as never);
    await expect(handler.execute(CMD)).rejects.toThrow(NotFoundException);
  });

  it('lança NotFoundException se produtor sem CPF/CNPJ', async () => {
    const producer = new Producer({ id: 'prod-1', phone: '+5511987654321', plan: 'professional', createdAt: new Date() });
    const handler = new SyncOpenFinanceHandler(makeOfService(), makeOfRepo(), makeProducerRepo(producer), makeDebtRepo(), makeAudit() as never);
    await expect(handler.execute(CMD)).rejects.toThrow(NotFoundException);
  });

  it('registra audit log após sync', async () => {
    const audit = makeAudit();
    const handler = new SyncOpenFinanceHandler(makeOfService([makeBankDebt('OF-001')]), makeOfRepo(), makeProducerRepo(), makeDebtRepo(), audit as never);
    await handler.execute(CMD);
    expect(audit.log).toHaveBeenCalledWith(expect.objectContaining({ action: 'OPEN_FINANCE_SYNC' }));
  });
});
