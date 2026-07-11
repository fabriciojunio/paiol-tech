import { NotFoundException } from '@nestjs/common';
import { RevokeConnectionHandler } from './revoke-connection.handler';
import { RevokeConnectionCommand } from './revoke-connection.command';
import type { IOpenFinanceRepository, OpenFinanceConnectionRecord } from '../../../domain/repositories/open-finance.repository.interface';

const makeConnection = (overrides: Partial<OpenFinanceConnectionRecord> = {}): OpenFinanceConnectionRecord => ({
  id: 'conn-1',
  producerId: 'prod-1',
  bankCode: '001',
  bankName: 'Banco do Brasil',
  status: 'ACTIVE',
  createdAt: new Date(),
  ...overrides,
});

const makeRepo = (connection: OpenFinanceConnectionRecord | null = makeConnection()): IOpenFinanceRepository => ({
  findById: jest.fn().mockResolvedValue(connection),
  findByProducer: jest.fn(),
  findByProducerAndBank: jest.fn(),
  save: jest.fn(),
  updateLastSync: jest.fn(),
  revoke: jest.fn().mockResolvedValue(undefined),
});

const makeAudit = () => ({ log: jest.fn().mockResolvedValue(undefined) });

const CMD = new RevokeConnectionCommand('prod-1', 'conn-1');

describe('RevokeConnectionHandler', () => {
  it('revoga a conexão do próprio produtor e registra auditoria', async () => {
    const repo = makeRepo();
    const audit = makeAudit();
    const handler = new RevokeConnectionHandler(repo, audit as never);
    await handler.execute(CMD);
    expect(repo.revoke).toHaveBeenCalledWith('conn-1');
    expect(audit.log).toHaveBeenCalledWith(expect.objectContaining({ action: 'OPEN_FINANCE_REVOKE' }));
  });

  it('lança NotFoundException se a conexão não existe', async () => {
    const handler = new RevokeConnectionHandler(makeRepo(null), makeAudit() as never);
    await expect(handler.execute(CMD)).rejects.toThrow(NotFoundException);
  });

  it('lança NotFoundException se a conexão é de outro produtor', async () => {
    const alheia = makeConnection({ producerId: 'prod-2' });
    const repo = makeRepo(alheia);
    const handler = new RevokeConnectionHandler(repo, makeAudit() as never);
    await expect(handler.execute(CMD)).rejects.toThrow(NotFoundException);
    expect(repo.revoke).not.toHaveBeenCalled();
  });

  it('é idempotente para conexão já revogada', async () => {
    const revogada = makeConnection({ status: 'REVOKED' });
    const repo = makeRepo(revogada);
    const handler = new RevokeConnectionHandler(repo, makeAudit() as never);
    await handler.execute(CMD);
    expect(repo.revoke).not.toHaveBeenCalled();
  });
});
