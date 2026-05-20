import { IQuery } from '@nestjs/cqrs';

export class GetConnectionsQuery implements IQuery {
  constructor(public readonly producerId: string) {}
}
