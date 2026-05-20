import { ICommand } from '@nestjs/cqrs';
import type { DebtSource } from '@paiol/types';

export class CreateDebtCommand implements ICommand {
  constructor(
    public readonly producerId: string,
    public readonly creditor: string,
    public readonly amount: number,
    public readonly dueDate: Date,
    public readonly source: DebtSource,
    public readonly description?: string,
    public readonly bankCode?: string,
    public readonly contractNumber?: string,
    public readonly forceDuplicate?: boolean,
  ) {}
}
