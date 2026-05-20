import { IQuery } from '@nestjs/cqrs';
import type { DebtFilters, PaginationQuery } from '@paiol/types';

export class GetDebtsByProducerQuery implements IQuery {
  constructor(
    public readonly producerId: string,
    public readonly filters?: DebtFilters,
    public readonly pagination?: PaginationQuery,
  ) {}
}

export class GetDebtDashboardQuery implements IQuery {
  constructor(public readonly producerId: string) {}
}

export class GetDebtByIdQuery implements IQuery {
  constructor(
    public readonly id: string,
    public readonly producerId: string,
  ) {}
}
