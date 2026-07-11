import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject, NotFoundException } from '@nestjs/common';
import { RevokeConnectionCommand } from './revoke-connection.command';
import { OPEN_FINANCE_REPOSITORY, type IOpenFinanceRepository } from '../../../domain/repositories/open-finance.repository.interface';
import { AuditService } from '../../../infrastructure/audit/audit.service';

/**
 * Revoga o consentimento de uma conexão Open Finance. Direito básico do
 * produtor (LGPD): desconectar o banco a qualquer momento. As dívidas já
 * importadas continuam no app; só a sincronização para.
 */
@CommandHandler(RevokeConnectionCommand)
export class RevokeConnectionHandler implements ICommandHandler<RevokeConnectionCommand> {
  constructor(
    @Inject(OPEN_FINANCE_REPOSITORY) private readonly ofRepo: IOpenFinanceRepository,
    private readonly audit: AuditService,
  ) {}

  async execute(command: RevokeConnectionCommand): Promise<void> {
    const connection = await this.ofRepo.findById(command.connectionId);
    if (!connection || connection.producerId !== command.producerId) {
      throw new NotFoundException('Conexão não encontrada');
    }
    if (connection.status === 'REVOKED') return;

    await this.ofRepo.revoke(command.connectionId);

    await this.audit.log({
      producerId: command.producerId,
      action: 'OPEN_FINANCE_REVOKE',
      resource: 'open_finance_connection',
      resourceId: command.connectionId,
      metadata: { bankCode: connection.bankCode },
    });
  }
}
