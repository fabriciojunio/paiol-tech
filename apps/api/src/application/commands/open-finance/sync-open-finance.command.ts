import { ICommand } from '@nestjs/cqrs';

export class SyncOpenFinanceCommand implements ICommand {
  constructor(
    public readonly producerId: string,
    public readonly connectionId: string,
  ) {}
}
