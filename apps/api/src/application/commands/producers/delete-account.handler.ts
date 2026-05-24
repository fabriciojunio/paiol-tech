import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject, NotFoundException, Logger } from '@nestjs/common';
import { DeleteAccountCommand } from './delete-account.command';
import { PRODUCER_REPOSITORY, type IProducerRepository } from '../../../domain/repositories/producer.repository.interface';
import { AuditService } from '../../../infrastructure/audit/audit.service';

@CommandHandler(DeleteAccountCommand)
export class DeleteAccountHandler implements ICommandHandler<DeleteAccountCommand> {
  private readonly logger = new Logger(DeleteAccountHandler.name);

  constructor(
    @Inject(PRODUCER_REPOSITORY) private readonly producerRepo: IProducerRepository,
    private readonly audit: AuditService,
  ) {}

  async execute(command: DeleteAccountCommand): Promise<void> {
    const producer = await this.producerRepo.findById(command.producerId);
    if (!producer) throw new NotFoundException('Produtor não encontrado');

    // Audit antes de deletar (CASCADE no banco remove todos os dados relacionados)
    await this.audit.log({
      producerId: command.producerId,
      action: 'ACCOUNT_DELETED',
      resource: 'producer',
      resourceId: command.producerId,
      metadata: { plan: producer.plan },
    });

    await this.producerRepo.delete(command.producerId);
    this.logger.log(`Conta deletada (LGPD): produtor ${command.producerId}`);
  }
}
