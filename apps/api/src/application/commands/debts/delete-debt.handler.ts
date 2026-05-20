import { CommandHandler, ICommandHandler, ICommand } from '@nestjs/cqrs';
import { Inject, NotFoundException, ForbiddenException } from '@nestjs/common';
import { DEBT_REPOSITORY, type IDebtRepository } from '../../../domain/repositories/debt.repository.interface';

export class DeleteDebtCommand implements ICommand {
  constructor(public readonly debtId: string, public readonly producerId: string) {}
}

@CommandHandler(DeleteDebtCommand)
export class DeleteDebtHandler implements ICommandHandler<DeleteDebtCommand> {
  constructor(@Inject(DEBT_REPOSITORY) private readonly debtRepo: IDebtRepository) {}

  async execute(command: DeleteDebtCommand): Promise<void> {
    const debt = await this.debtRepo.findById(command.debtId);
    if (!debt) throw new NotFoundException('Dívida não encontrada');
    if (debt.producerId !== command.producerId) throw new ForbiddenException();
    await this.debtRepo.delete(command.debtId);
  }
}
