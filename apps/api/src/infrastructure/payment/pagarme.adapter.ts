import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IPaymentService, CreatePixPaymentInput, CreatePixPaymentResult, PaymentStatus } from '../../domain/services/payment.service.interface';

@Injectable()
export class PagarmeAdapter implements IPaymentService {
  private readonly baseUrl: string;
  private readonly secretKey: string;

  constructor(private readonly config: ConfigService) {
    this.baseUrl = config.getOrThrow('PAGARME_BASE_URL');
    this.secretKey = config.getOrThrow('PAGARME_SECRET_KEY');
  }

  private get authHeader(): string {
    return `Basic ${Buffer.from(`${this.secretKey}:`).toString('base64')}`;
  }

  async createPixPayment(input: CreatePixPaymentInput): Promise<CreatePixPaymentResult> {
    const response = await fetch(`${this.baseUrl}/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: this.authHeader,
      },
      body: JSON.stringify({
        items: [{ amount: input.amount, description: input.description, quantity: 1 }],
        customer: {
          name: input.customerName,
          phones: { mobile_phone: { country_code: '55', area_code: input.customerPhone.slice(3, 5), number: input.customerPhone.slice(5) } },
        },
        payments: [{
          payment_method: 'pix',
          pix: { expires_in: 3600 },
        }],
        code: input.externalId,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Pagar.me error: ${response.status} ${err}`);
    }

    const data = await response.json() as {
      id: string;
      charges: Array<{
        last_transaction: {
          qr_code: string;
          qr_code_url: string;
          expires_at: string;
        };
      }>;
    };

    const charge = data.charges[0];
    if (!charge) throw new Error('No charge returned from Pagar.me');

    const tx = charge.last_transaction;

    return {
      paymentId: data.id,
      qrCode: tx.qr_code,
      qrCodeUrl: tx.qr_code_url,
      expiresAt: new Date(tx.expires_at),
    };
  }

  async getPaymentStatus(paymentId: string): Promise<PaymentStatus> {
    const response = await fetch(`${this.baseUrl}/orders/${paymentId}`, {
      headers: { Authorization: this.authHeader },
    });

    if (!response.ok) throw new Error(`Pagar.me status error: ${response.status}`);

    const data = await response.json() as { status: string };

    const map: Record<string, PaymentStatus> = {
      paid: 'PAID',
      pending: 'PENDING',
      canceled: 'FAILED',
      failed: 'FAILED',
      refunded: 'REFUNDED',
    };

    return map[data.status] ?? 'PENDING';
  }

  verifyWebhookSignature(payload: string, signature: string): boolean {
    const crypto = require('crypto') as typeof import('crypto');
    const webhookSecret = this.config.getOrThrow('PAGARME_WEBHOOK_SECRET');
    const expected = crypto.createHmac('sha256', webhookSecret).update(payload).digest('hex');
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
  }
}
