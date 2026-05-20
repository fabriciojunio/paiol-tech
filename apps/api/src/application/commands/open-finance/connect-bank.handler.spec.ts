import { BadRequestException } from '@nestjs/common';
import { ConnectBankHandler } from './connect-bank.handler';
import { ConnectBankCommand } from './connect-bank.command';
import type { IOpenFinanceService } from '../../../domain/services/open-finance.service.interface';
import type { IOpenFinanceRepository, OpenFinanceConnectionRecord } from '../../../domain/repositories/open-finance.repository.interface';

const BANKS = [
  { code: '001', name: 'Banco do Brasil', isParticipant: true },
  { code: '748', name: 'Sicredi', isParticipant: true },
];

const makeService = (): IOpenFinanceService => ({
  getAvailableBanks: jest.fn().mockResolvedValue(BANKS),
  fetchDebts: jest.fn().mockResolvedValue([]),
});

const makeRecord = (overrides: Partial<OpenFinanceConnectionRecord> = {}): OpenFinanceConnectionRecord => ({
  id: 'conn-1',
  producerId: 'prod-1',
  bankCode: '001',
  bankName: 'Banco do Brasil',
  status: 'ACTIVE',
  createdAt: new Date(),
  ...overrides,
});

const makeRepo = (existing: OpenFinanceConnectionRecord | null = null): IOpenFinanceRepository => ({
  findByProducer: jest.fn().mockResolvedValue([]),
  findByProducerAndBank: jest.fn().mockResolvedValue(existing),
  save: jest.fn().mockImplementation((r: OpenFinanceConnectionRecord) => Promise.resolve({ ...r, createdAt: new Date() })),
  updateLastSync: jest.fn().mockResolvedValue(undefined),
  revoke: jest.fn().mockResolvedValue(undefined),
});

describe('ConnectBankHandler', () => {
  it('cria nova conexão com banco participante', async () => {
    const repo = makeRepo(null);
    const handler = new ConnectBankHandler(makeService(), repo);
    const result = await handler.execute(new ConnectBankCommand('prod-1', '001'));
    expect(result.bankCode).toBe('001');
    expect(result.bankName).toBe('Banco do Brasil');
    expect(result.status).toBe('ACTIVE');
    expect(repo.save).toHaveBeenCalled();
  });

  it('retorna conexão existente se já ACTIVE', async () => {
    const existing = makeRecord({ status: 'ACTIVE' });
    const repo = makeRepo(existing);
    const handler = new ConnectBankHandler(makeService(), repo);
    const result = await handler.execute(new ConnectBankCommand('prod-1', '001'));
    expect(result.connectionId).toBe('conn-1');
    expect(repo.save).not.toHaveBeenCalled();
  });

  it('lança BadRequest para banco não participante', async () => {
    const handler = new ConnectBankHandler(makeService(), makeRepo());
    await expect(handler.execute(new ConnectBankCommand('prod-1', '999'))).rejects.toThrow(BadRequestException);
  });

  it('recria conexão se anterior estava REVOKED', async () => {
    const revoked = makeRecord({ status: 'REVOKED' });
    const repo = makeRepo(revoked);
    const handler = new ConnectBankHandler(makeService(), repo);
    const result = await handler.execute(new ConnectBankCommand('prod-1', '001'));
    expect(result.status).toBe('ACTIVE');
    expect(repo.save).toHaveBeenCalled();
  });
});
