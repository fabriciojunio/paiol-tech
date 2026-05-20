import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject, BadRequestException } from '@nestjs/common';
import { v4 as uuid } from 'uuid';
import { ConnectBankCommand } from './connect-bank.command';
import { OPEN_FINANCE_SERVICE, type IOpenFinanceService } from '../../../domain/services/open-finance.service.interface';
import { OPEN_FINANCE_REPOSITORY, type IOpenFinanceRepository } from '../../../domain/repositories/open-finance.repository.interface';

export interface ConnectBankResult {
  connectionId: string;
  bankCode: string;
  bankName: string;
  status: 'ACTIVE';
}

@CommandHandler(ConnectBankCommand)
export class ConnectBankHandler implements ICommandHandler<ConnectBankCommand> {
  constructor(
    @Inject(OPEN_FINANCE_SERVICE) private readonly ofService: IOpenFinanceService,
    @Inject(OPEN_FINANCE_REPOSITORY) private readonly ofRepo: IOpenFinanceRepository,
  ) {}

  async execute(command: ConnectBankCommand): Promise<ConnectBankResult> {
    const banks = await this.ofService.getAvailableBanks();
    const bank = banks.find((b) => b.code === command.bankCode);
    if (!bank) throw new BadRequestException(`Banco ${command.bankCode} não participa do Open Finance`);

    const existing = await this.ofRepo.findByProducerAndBank(command.producerId, command.bankCode);
    if (existing && existing.status === 'ACTIVE') {
      return { connectionId: existing.id, bankCode: existing.bankCode, bankName: existing.bankName, status: 'ACTIVE' };
    }

    const expiresAt = new Date();
    expiresAt.setFullYear(expiresAt.getFullYear() + 1);

    const record = await this.ofRepo.save({
      id: existing?.id ?? uuid(),
      producerId: command.producerId,
      bankCode: command.bankCode,
      bankName: bank.name,
      status: 'ACTIVE',
      expiresAt,
    });

    return { connectionId: record.id, bankCode: record.bankCode, bankName: record.bankName, status: 'ACTIVE' };
  }
}
