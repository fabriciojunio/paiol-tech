import { IQuery } from '@nestjs/cqrs';

export class GetMyDataQuery implements IQuery {
  constructor(public readonly producerId: string) {}
}
