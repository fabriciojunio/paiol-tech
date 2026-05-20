import { NotFoundException } from '@nestjs/common';
import { DeleteAccountHandler } from './delete-account.handler';
import { DeleteAccountCommand } from './delete-account.command';
import { Producer } from '../../../domain/entities/producer.entity';
import type { IProducerRepository } from '../../../domain/repositories/producer.repository.interface';

const makeProducer = () =>
  new Producer({ id: 'prod-1', phone: '+5511987654321', plan: 'professional', createdAt: new Date() });

const makeRepo = (producer: Producer | null): IProducerRepository => ({
  findById: jest.fn().mockResolvedValue(producer),
  findByPhone: jest.fn(),
  save: jest.fn(),
  update: jest.fn(),
  delete: jest.fn().mockResolvedValue(undefined),
});

const makeAudit = () => ({ log: jest.fn().mockResolvedValue(undefined), findByProducer: jest.fn() });

describe('DeleteAccountHandler', () => {
  it('deleta conta do produtor e registra audit', async () => {
    const repo = makeRepo(makeProducer());
    const audit = makeAudit();
    const handler = new DeleteAccountHandler(repo, audit as never);
    await handler.execute(new DeleteAccountCommand('prod-1'));
    expect(repo.delete).toHaveBeenCalledWith('prod-1');
    expect(audit.log).toHaveBeenCalledWith(expect.objectContaining({ action: 'ACCOUNT_DELETED', producerId: 'prod-1' }));
  });

  it('lança NotFoundException se produtor não existe', async () => {
    const handler = new DeleteAccountHandler(makeRepo(null), makeAudit() as never);
    await expect(handler.execute(new DeleteAccountCommand('x'))).rejects.toThrow(NotFoundException);
  });
});
