import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { GetConnectionsQuery } from './get-connections.query';
import { OPEN_FINANCE_REPOSITORY, type IOpenFinanceRepository, type OpenFinanceConnectionRecord } from '../../../domain/repositories/open-finance.repository.interface';
import { OPEN_FINANCE_SERVICE, type IOpenFinanceService } from '../../../domain/services/open-finance.service.interface';

export interface ConnectionWithBanks {
  connections: OpenFinanceConnectionRecord[];
  availableBanks: { code: string; name: string; isParticipant: boolean }[];
}

@QueryHandler(GetConnectionsQuery)
export class GetConnectionsHandler implements IQueryHandler<GetConnectionsQuery> {
  constructor(
    @Inject(OPEN_FINANCE_REPOSITORY) private readonly ofRepo: IOpenFinanceRepository,
    @Inject(OPEN_FINANCE_SERVICE) private readonly ofService: IOpenFinanceService,
  ) {}

  async execute(query: GetConnectionsQuery): Promise<ConnectionWithBanks> {
    const [connections, availableBanks] = await Promise.all([
      this.ofRepo.findByProducer(query.producerId),
      this.ofService.getAvailableBanks(),
    ]);
    return { connections, availableBanks };
  }
}
