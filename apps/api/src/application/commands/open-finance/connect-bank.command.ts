import { ICommand } from '@nestjs/cqrs';

export class ConnectBankCommand implements ICommand {
  constructor(
    public readonly producerId: string,
    public readonly bankCode: string,
  ) {}
}
