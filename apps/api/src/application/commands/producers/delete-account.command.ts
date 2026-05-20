import { ICommand } from '@nestjs/cqrs';

export class DeleteAccountCommand implements ICommand {
  constructor(public readonly producerId: string) {}
}
