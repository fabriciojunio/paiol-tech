import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject, UnauthorizedException } from '@nestjs/common';
import { v4 as uuid } from 'uuid';
import { VerifyOtpCommand } from './verify-otp.command';
import { OtpService } from '../../services/otp.service';
import { TokenService, type TokenPair } from '../../services/token.service';
import { PRODUCER_REPOSITORY, type IProducerRepository } from '../../../domain/repositories/producer.repository.interface';
import { Producer } from '../../../domain/entities/producer.entity';

@CommandHandler(VerifyOtpCommand)
export class VerifyOtpHandler implements ICommandHandler<VerifyOtpCommand> {
  constructor(
    private readonly otpService: OtpService,
    private readonly tokenService: TokenService,
    @Inject(PRODUCER_REPOSITORY) private readonly producerRepo: IProducerRepository,
  ) {}

  async execute(command: VerifyOtpCommand): Promise<TokenPair> {
    const valid = await this.otpService.verify(command.phone, command.code);
    if (!valid) throw new UnauthorizedException({ code: 'OTP_INVALID', message: 'Código incorreto ou expirado.' });

    let producer = await this.producerRepo.findByPhone(command.phone);
    if (!producer) {
      producer = new Producer({ id: uuid(), phone: command.phone, plan: 'basic', createdAt: new Date() });
      await this.producerRepo.save(producer);
    }

    return this.tokenService.generatePair(producer);
  }
}
