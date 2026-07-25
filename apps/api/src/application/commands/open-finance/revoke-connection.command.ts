import { ICommand } from '@nestjs/cqrs';

export class RevokeConnectionCommand implements ICommand {
  constructor(
    public readonly producerId: string,
    public readonly connectionId: string,
  ) {}
}
