import { BadRequestException } from '@nestjs/common';
import { ConnectBankHandler } from './connect-bank.handler';
import { ConnectBankCommand } from './connect-bank.command';
import { Producer } from '../../../domain/entities/producer.entity';
import type { ConsentSession, IOpenFinanceService } from '../../../domain/services/open-finance.service.interface';
import type { IOpenFinanceRepository, OpenFinanceConnectionRecord } from '../../../domain/repositories/open-finance.repository.interface';
import type { IProducerRepository } from '../../../domain/repositories/producer.repository.interface';

const BANKS = [
  { code: '001', name: 'Banco do Brasil', isParticipant: true },
  { code: '748', name: 'Sicredi', isParticipant: true },
];

const AUTHORIZED_CONSENT: ConsentSession = {
  consentId: 'consent-1',
  status: 'AUTHORIZED',
};

const makeService = (consent: ConsentSession = AUTHORIZED_CONSENT): IOpenFinanceService => ({
  providerName: 'mock',
  getAvailableBanks: jest.fn().mockResolvedValue(BANKS),
  createConsent: jest.fn().mockResolvedValue(consent),
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
  findById: jest.fn().mockResolvedValue(null),
  findByProducer: jest.fn().mockResolvedValue([]),
  findByProducerAndBank: jest.fn().mockResolvedValue(existing),
  save: jest.fn().mockImplementation((r: OpenFinanceConnectionRecord) => Promise.resolve({ ...r, createdAt: new Date() })),
  updateLastSync: jest.fn().mockResolvedValue(undefined),
  revoke: jest.fn().mockResolvedValue(undefined),
});

const makeProducer = (cpfCnpj: string | null = '123.456.789-09') =>
  new Producer({ id: 'prod-1', phone: '+5511987654321', plan: 'basic', cpfCnpj: cpfCnpj ?? undefined, createdAt: new Date() });

const makeProducerRepo = (producer: Producer | null = makeProducer()): IProducerRepository => ({
  findById: jest.fn().mockResolvedValue(producer),
  findByPhone: jest.fn(),
  save: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
});

describe('ConnectBankHandler', () => {
  it('cria nova conexão ativa quando o consentimento sai autorizado (mock)', async () => {
    const repo = makeRepo(null);
    const handler = new ConnectBankHandler(makeService(), repo, makeProducerRepo());
    const result = await handler.execute(new ConnectBankCommand('prod-1', '001'));
    expect(result.bankCode).toBe('001');
    expect(result.bankName).toBe('Banco do Brasil');
    expect(result.status).toBe('ACTIVE');
    expect(repo.save).toHaveBeenCalledWith(expect.objectContaining({ consentId: 'consent-1', status: 'ACTIVE' }));
  });

  it('devolve authorizationUrl quando o provedor exige autorização no banco', async () => {
    const consent: ConsentSession = {
      consentId: 'consent-2',
      status: 'PENDING_AUTHORIZATION',
      authorizationUrl: 'https://connect.exemplo.com/?token=abc',
    };
    const repo = makeRepo(null);
    const handler = new ConnectBankHandler(makeService(consent), repo, makeProducerRepo());
    const result = await handler.execute(new ConnectBankCommand('prod-1', '001'));
    expect(result.status).toBe('PENDING_AUTHORIZATION');
    expect(result.authorizationUrl).toBe('https://connect.exemplo.com/?token=abc');
    expect(repo.save).toHaveBeenCalledWith(expect.objectContaining({ status: 'PENDING_AUTHORIZATION' }));
  });

  it('retorna conexão existente se já ACTIVE, sem pedir consentimento novo', async () => {
    const existing = makeRecord({ status: 'ACTIVE' });
    const repo = makeRepo(existing);
    const service = makeService();
    const handler = new ConnectBankHandler(service, repo, makeProducerRepo());
    const result = await handler.execute(new ConnectBankCommand('prod-1', '001'));
    expect(result.connectionId).toBe('conn-1');
    expect(service.createConsent).not.toHaveBeenCalled();
    expect(repo.save).not.toHaveBeenCalled();
  });

  it('lança BadRequest para banco não participante', async () => {
    const handler = new ConnectBankHandler(makeService(), makeRepo(), makeProducerRepo());
    await expect(handler.execute(new ConnectBankCommand('prod-1', '999'))).rejects.toThrow(BadRequestException);
  });

  it('lança BadRequest quando o produtor não tem CPF/CNPJ cadastrado', async () => {
    const handler = new ConnectBankHandler(makeService(), makeRepo(), makeProducerRepo(makeProducer(null)));
    await expect(handler.execute(new ConnectBankCommand('prod-1', '001'))).rejects.toThrow(BadRequestException);
  });

  it('recria conexão se anterior estava REVOKED', async () => {
    const revoked = makeRecord({ status: 'REVOKED' });
    const repo = makeRepo(revoked);
    const handler = new ConnectBankHandler(makeService(), repo, makeProducerRepo());
    const result = await handler.execute(new ConnectBankCommand('prod-1', '001'));
    expect(result.status).toBe('ACTIVE');
    expect(repo.save).toHaveBeenCalled();
  });
});
