import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject, NotFoundException } from '@nestjs/common';
import { CreatePixPaymentCommand } from './create-pix-payment.command';
import { PRODUCER_REPOSITORY, IProducerRepository } from '../../../domain/repositories/producer.repository.interface';
import { DEBT_REPOSITORY, IDebtRepository } from '../../../domain/repositories/debt.repository.interface';
import { PAYMENT_SERVICE, IPaymentService, CreatePixPaymentResult } from '../../../domain/services/payment.service.interface';

@CommandHandler(CreatePixPaymentCommand)
export class CreatePixPaymentHandler implements ICommandHandler<CreatePixPaymentCommand, CreatePixPaymentResult> {
  constructor(
    @Inject(PRODUCER_REPOSITORY) private readonly producerRepo: IProducerRepository,
    @Inject(DEBT_REPOSITORY) private readonly debtRepo: IDebtRepository,
    @Inject(PAYMENT_SERVICE) private readonly paymentService: IPaymentService,
  ) {}

  async execute(command: CreatePixPaymentCommand): Promise<CreatePixPaymentResult> {
    const producer = await this.producerRepo.findById(command.producerId);
    if (!producer) throw new NotFoundException('Producer not found');

    const debt = await this.debtRepo.findById(command.debtId);
    if (!debt) throw new NotFoundException('Debt not found');
    if (debt.producerId !== command.producerId) throw new NotFoundException('Debt not found');

    return this.paymentService.createPixPayment({
      amount: command.amount,
      description: command.description,
      externalId: command.debtId,
      customerName: producer.id,
      customerPhone: producer.phone,
    });
  }
}
