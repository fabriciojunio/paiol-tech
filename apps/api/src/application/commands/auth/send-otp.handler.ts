import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject, Logger } from '@nestjs/common';
import { SendOtpCommand } from './send-otp.command';
import { WHATSAPP_SERVICE, type IWhatsAppService } from '../../../domain/services/whatsapp.service.interface';
import { OtpService } from '../../services/otp.service';

@CommandHandler(SendOtpCommand)
export class SendOtpHandler implements ICommandHandler<SendOtpCommand> {
  private readonly logger = new Logger(SendOtpHandler.name);

  constructor(
    @Inject(WHATSAPP_SERVICE) private readonly whatsapp: IWhatsAppService,
    private readonly otpService: OtpService,
  ) {}

  async execute(command: SendOtpCommand): Promise<{ expiresIn: number }> {
    const { phone } = command;
    const code = await this.otpService.generate(phone);
    await this.whatsapp.sendOtp(phone, code);
    this.logger.log(`OTP enviado para ${phone}`);
    return { expiresIn: 300 };
  }
}
