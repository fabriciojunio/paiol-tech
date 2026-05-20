import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject, Logger, NotFoundException } from '@nestjs/common';
import { v4 as uuid } from 'uuid';
import { SyncOpenFinanceCommand } from './sync-open-finance.command';
import { OPEN_FINANCE_SERVICE, type IOpenFinanceService } from '../../../domain/services/open-finance.service.interface';
import { OPEN_FINANCE_REPOSITORY, type IOpenFinanceRepository } from '../../../domain/repositories/open-finance.repository.interface';
import { PRODUCER_REPOSITORY, type IProducerRepository } from '../../../domain/repositories/producer.repository.interface';
import { DEBT_REPOSITORY, type IDebtRepository } from '../../../domain/repositories/debt.repository.interface';
import { Debt } from '../../../domain/entities/debt.entity';
import { AuditService } from '../../../infrastructure/audit/audit.service';

export interface SyncResult {
  imported: number;
  skipped: number;
  total: number;
}

@CommandHandler(SyncOpenFinanceCommand)
export class SyncOpenFinanceHandler implements ICommandHandler<SyncOpenFinanceCommand> {
  private readonly logger = new Logger(SyncOpenFinanceHandler.name);

  constructor(
    @Inject(OPEN_FINANCE_SERVICE) private readonly ofService: IOpenFinanceService,
    @Inject(OPEN_FINANCE_REPOSITORY) private readonly ofRepo: IOpenFinanceRepository,
    @Inject(PRODUCER_REPOSITORY) private readonly producerRepo: IProducerRepository,
    @Inject(DEBT_REPOSITORY) private readonly debtRepo: IDebtRepository,
    private readonly audit: AuditService,
  ) {}

  async execute(command: SyncOpenFinanceCommand): Promise<SyncResult> {
    const producer = await this.producerRepo.findById(command.producerId);
    if (!producer) throw new NotFoundException('Produtor não encontrado');
    if (!producer.cpfCnpj) throw new NotFoundException('CPF/CNPJ do produtor não cadastrado');

    const bankDebts = await this.ofService.fetchDebts(producer.cpfCnpj, command.bankCode);

    let imported = 0;
    let skipped = 0;

    for (const bd of bankDebts) {
      const existing = await this.debtRepo.findByContractNumber(command.producerId, bd.contractNumber);
      if (existing) { skipped++; continue; }

      const debt = new Debt({
        id: uuid(),
        producerId: command.producerId,
        creditor: bd.creditor,
        amount: bd.amount,
        dueDate: bd.dueDate,
        source: 'OPEN_FINANCE',
        status: 'PENDING',
        description: bd.description,
        bankCode: bd.bankCode,
        contractNumber: bd.contractNumber,
        createdAt: new Date(),
      });

      await this.debtRepo.save(debt);
      imported++;
    }

    await this.ofRepo.updateLastSync(command.connectionId);

    await this.audit.log({
      producerId: command.producerId,
      action: 'OPEN_FINANCE_SYNC',
      resource: 'open_finance_connection',
      resourceId: command.connectionId,
      metadata: { bankCode: command.bankCode, imported, skipped, total: bankDebts.length },
    });

    this.logger.log(`Sync ${command.bankCode} → produtor ${command.producerId}: ${imported} importadas, ${skipped} já existentes`);
    return { imported, skipped, total: bankDebts.length };
  }
}
