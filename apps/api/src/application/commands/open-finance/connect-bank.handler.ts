import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject, BadRequestException } from '@nestjs/common';
import { v4 as uuid } from 'uuid';
import { ConnectBankCommand } from './connect-bank.command';
import { OPEN_FINANCE_SERVICE, type IOpenFinanceService } from '../../../domain/services/open-finance.service.interface';
import { OPEN_FINANCE_REPOSITORY, type IOpenFinanceRepository } from '../../../domain/repositories/open-finance.repository.interface';
import { PRODUCER_REPOSITORY, type IProducerRepository } from '../../../domain/repositories/producer.repository.interface';

export interface ConnectBankResult {
  connectionId: string;
  bankCode: string;
  bankName: string;
  status: 'ACTIVE' | 'PENDING_AUTHORIZATION';
  /** Presente quando o produtor precisa autorizar no ambiente do banco. */
  authorizationUrl?: string;
}

@CommandHandler(ConnectBankCommand)
export class ConnectBankHandler implements ICommandHandler<ConnectBankCommand> {
  constructor(
    @Inject(OPEN_FINANCE_SERVICE) private readonly ofService: IOpenFinanceService,
    @Inject(OPEN_FINANCE_REPOSITORY) private readonly ofRepo: IOpenFinanceRepository,
    @Inject(PRODUCER_REPOSITORY) private readonly producerRepo: IProducerRepository,
  ) {}

  async execute(command: ConnectBankCommand): Promise<ConnectBankResult> {
    const producer = await this.producerRepo.findById(command.producerId);
    if (!producer) throw new BadRequestException('Produtor não encontrado');
    if (!producer.cpfCnpj) {
      throw new BadRequestException(
        'Cadastre seu CPF ou CNPJ em "Minha conta" antes de conectar um banco.',
      );
    }

    const banks = await this.ofService.getAvailableBanks();
    const bank = banks.find((b) => b.code === command.bankCode);
    if (!bank) throw new BadRequestException(`Banco ${command.bankCode} não participa do Open Finance`);

    const existing = await this.ofRepo.findByProducerAndBank(command.producerId, command.bankCode);
    if (existing && existing.status === 'ACTIVE') {
      return { connectionId: existing.id, bankCode: existing.bankCode, bankName: existing.bankName, status: 'ACTIVE' };
    }

    const consent = await this.ofService.createConsent({
      producerId: command.producerId,
      cpfCnpj: producer.cpfCnpj,
      bankCode: command.bankCode,
    });

    const fallbackExpiry = new Date();
    fallbackExpiry.setFullYear(fallbackExpiry.getFullYear() + 1);

    const status = consent.status === 'AUTHORIZED' ? 'ACTIVE' : 'PENDING_AUTHORIZATION';
    const record = await this.ofRepo.save({
      id: existing?.id ?? uuid(),
      producerId: command.producerId,
      bankCode: command.bankCode,
      bankName: bank.name,
      consentId: consent.consentId,
      status,
      expiresAt: consent.expiresAt ?? fallbackExpiry,
    });

    return {
      connectionId: record.id,
      bankCode: record.bankCode,
      bankName: record.bankName,
      status,
      authorizationUrl: consent.authorizationUrl,
    };
  }
}
