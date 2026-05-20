import { CommandHandler, ICommandHandler, ICommand } from '@nestjs/cqrs';
import { Inject, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { DEBT_REPOSITORY, type IDebtRepository } from '../../../domain/repositories/debt.repository.interface';

export class MarkDebtAsPaidCommand implements ICommand {
  constructor(public readonly debtId: string, public readonly producerId: string) {}
}

@CommandHandler(MarkDebtAsPaidCommand)
export class MarkDebtAsPaidHandler implements ICommandHandler<MarkDebtAsPaidCommand> {
  constructor(@Inject(DEBT_REPOSITORY) private readonly debtRepo: IDebtRepository) {}

  async execute(command: MarkDebtAsPaidCommand) {
    const debt = await this.debtRepo.findById(command.debtId);
    if (!debt) throw new NotFoundException('Dívida não encontrada');
    if (debt.producerId !== command.producerId) throw new ForbiddenException();
    if (!debt.canTransitionTo('PAID')) {
      throw new BadRequestException(`Não é possível marcar dívida com status ${debt.status} como paga`);
    }
    return this.debtRepo.update(command.debtId, { status: 'PAID' });
  }
}
