import { Injectable, Logger } from '@nestjs/common';
import type { IWhatsAppService } from '../../domain/services/whatsapp.service.interface';

@Injectable()
export class WhatsAppMockAdapter implements IWhatsAppService {
  private readonly logger = new Logger(WhatsAppMockAdapter.name);

  async sendOtp(phone: string, code: string): Promise<void> {
    this.logger.log(`[MOCK] OTP para ${phone}: ${code}`);
  }

  async sendAlert(phone: string, message: string): Promise<void> {
    this.logger.log(`[MOCK] Alerta para ${phone}: ${message}`);
  }

  async sendMessage(phone: string, message: string): Promise<void> {
    this.logger.log(`[MOCK] Mensagem para ${phone}: ${message}`);
  }
}
