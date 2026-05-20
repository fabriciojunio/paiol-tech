import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Inject, NotFoundException } from '@nestjs/common';
import { GetMyDataQuery } from './get-my-data.query';
import { PRODUCER_REPOSITORY, type IProducerRepository } from '../../../domain/repositories/producer.repository.interface';
import { DEBT_REPOSITORY, type IDebtRepository } from '../../../domain/repositories/debt.repository.interface';
import { AuditService } from '../../../infrastructure/audit/audit.service';

@QueryHandler(GetMyDataQuery)
export class GetMyDataHandler implements IQueryHandler<GetMyDataQuery> {
  constructor(
    @Inject(PRODUCER_REPOSITORY) private readonly producerRepo: IProducerRepository,
    @Inject(DEBT_REPOSITORY) private readonly debtRepo: IDebtRepository,
    private readonly audit: AuditService,
  ) {}

  async execute(query: GetMyDataQuery) {
    const producer = await this.producerRepo.findById(query.producerId);
    if (!producer) throw new NotFoundException('Produtor não encontrado');

    const { debts } = await this.debtRepo.findByProducer(query.producerId, undefined, { page: 1, limit: 10000 });
    const auditLogs = await this.audit.findByProducer(query.producerId);

    await this.audit.log({
      producerId: query.producerId,
      action: 'DATA_EXPORT',
      resource: 'producer',
      resourceId: query.producerId,
    });

    return {
      exportedAt: new Date().toISOString(),
      producer: {
        id: producer.id,
        phone: producer.phone,
        name: producer.name,
        cpfCnpj: producer.cpfCnpj,
        plan: producer.plan,
        createdAt: producer.createdAt,
      },
      debts: debts.map((d) => ({
        id: d.id,
        creditor: d.creditor,
        amount: d.amount,
        dueDate: d.dueDate,
        status: d.status,
        source: d.source,
        description: d.description,
        bankCode: d.bankCode,
        contractNumber: d.contractNumber,
        createdAt: d.createdAt,
      })),
      auditLogs,
    };
  }
}
