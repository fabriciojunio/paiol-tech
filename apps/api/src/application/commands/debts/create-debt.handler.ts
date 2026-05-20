import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject, BadRequestException, ForbiddenException } from '@nestjs/common';
import { v4 as uuid } from 'uuid';
import { CreateDebtCommand } from './create-debt.command';
import { Debt } from '../../../domain/entities/debt.entity';
import { DEBT_REPOSITORY, type IDebtRepository } from '../../../domain/repositories/debt.repository.interface';
import { PRODUCER_REPOSITORY, type IProducerRepository } from '../../../domain/repositories/producer.repository.interface';

@CommandHandler(CreateDebtCommand)
export class CreateDebtHandler implements ICommandHandler<CreateDebtCommand> {
  constructor(
    @Inject(DEBT_REPOSITORY) private readonly debtRepo: IDebtRepository,
    @Inject(PRODUCER_REPOSITORY) private readonly producerRepo: IProducerRepository,
  ) {}

  async execute(command: CreateDebtCommand): Promise<Debt> {
    const producer = await this.producerRepo.findById(command.producerId);
    if (!producer) throw new BadRequestException('Produtor não encontrado');

    const currentCount = await this.debtRepo.countByProducer(command.producerId);
    if (!producer.canAddDebt(currentCount)) {
      throw new ForbiddenException({
        code: 'PLAN_LIMIT_REACHED',
        message: `Limite de dívidas do plano ${producer.plan} atingido. Faça upgrade para adicionar mais.`,
      });
    }

    if (!command.forceDuplicate) {
      const duplicate = await this.debtRepo.findPossibleDuplicate({
        producerId: command.producerId,
        amount: command.amount,
        dueDate: command.dueDate,
      });
      if (duplicate) {
        throw new BadRequestException({
          code: 'DUPLICATE_DEBT',
          message: 'Essa dívida pode ser duplicada.',
          details: {
            id: duplicate.id,
            creditor: duplicate.creditor,
            amount: duplicate.amount,
            dueDate: duplicate.dueDate,
          },
        });
      }
    }

    const debt = new Debt({
      id: uuid(),
      producerId: command.producerId,
      creditor: command.creditor,
      amount: command.amount,
      dueDate: command.dueDate,
      source: command.source,
      status: 'PENDING',
      description: command.description,
      bankCode: command.bankCode,
      contractNumber: command.contractNumber,
      createdAt: new Date(),
    });

    return this.debtRepo.save(debt);
  }
}
