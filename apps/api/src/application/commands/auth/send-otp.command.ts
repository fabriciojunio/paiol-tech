import { ICommand } from '@nestjs/cqrs';

export class SendOtpCommand implements ICommand {
  constructor(public readonly phone: string) {}
}
