import { ICommand } from '@nestjs/cqrs';

export class VerifyOtpCommand implements ICommand {
  constructor(
    public readonly phone: string,
    public readonly code: string,
  ) {}
}
