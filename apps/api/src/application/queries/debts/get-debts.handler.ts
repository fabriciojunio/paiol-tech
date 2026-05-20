import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Inject, NotFoundException, ForbiddenException } from '@nestjs/common';
import { GetDebtsByProducerQuery, GetDebtDashboardQuery, GetDebtByIdQuery } from './get-debts.query';
import { DEBT_REPOSITORY, type IDebtRepository } from '../../../domain/repositories/debt.repository.interface';

@QueryHandler(GetDebtsByProducerQuery)
export class GetDebtsByProducerHandler implements IQueryHandler<GetDebtsByProducerQuery> {
  constructor(@Inject(DEBT_REPOSITORY) private readonly debtRepo: IDebtRepository) {}

  async execute(query: GetDebtsByProducerQuery) {
    return this.debtRepo.findByProducer(query.producerId, query.filters, query.pagination);
  }
}

@QueryHandler(GetDebtDashboardQuery)
export class GetDebtDashboardHandler implements IQueryHandler<GetDebtDashboardQuery> {
  constructor(@Inject(DEBT_REPOSITORY) private readonly debtRepo: IDebtRepository) {}

  async execute(query: GetDebtDashboardQuery) {
    return this.debtRepo.getDashboard(query.producerId);
  }
}

@QueryHandler(GetDebtByIdQuery)
export class GetDebtByIdHandler implements IQueryHandler<GetDebtByIdQuery> {
  constructor(@Inject(DEBT_REPOSITORY) private readonly debtRepo: IDebtRepository) {}

  async execute(query: GetDebtByIdQuery) {
    const debt = await this.debtRepo.findById(query.id);
    if (!debt) throw new NotFoundException('Dívida não encontrada');
    if (debt.producerId !== query.producerId) throw new ForbiddenException();
    return debt;
  }
}
