import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { IWhatsAppService } from '../../domain/services/whatsapp.service.interface';

@Injectable()
export class ZApiAdapter implements IWhatsAppService {
  private readonly logger = new Logger(ZApiAdapter.name);
  private readonly instanceId: string;
  private readonly token: string;
  private readonly clientToken: string;
  private readonly baseUrl: string;

  constructor(private readonly config: ConfigService) {
    this.instanceId = config.getOrThrow('ZAPI_INSTANCE_ID');
    this.token = config.getOrThrow('ZAPI_TOKEN');
    this.clientToken = config.getOrThrow('ZAPI_CLIENT_TOKEN');
    this.baseUrl = `https://api.z-api.io/instances/${this.instanceId}/token/${this.token}`;
  }

  async sendOtp(phone: string, code: string): Promise<void> {
    const message = `🌾 Paiol — seu código: *${code}*\n\nNão compartilhe com ninguém. Válido por 5 minutos.`;
    await this.sendMessage(phone, message);
  }

  async sendAlert(phone: string, message: string): Promise<void> {
    await this.sendMessage(phone, message);
  }

  async sendMessage(phone: string, message: string): Promise<void> {
    const digits = phone.replace(/\D/g, '');
    const payload = { phone: digits, message };

    try {
      const res = await fetch(`${this.baseUrl}/send-text`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Client-Token': this.clientToken,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const body = await res.text();
        throw new Error(`Z-API error ${res.status}: ${body}`);
      }
    } catch (err) {
      this.logger.error('Falha ao enviar WhatsApp', err);
      throw err;
    }
  }
}
