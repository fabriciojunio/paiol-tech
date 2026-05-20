import { IPaymentService, CreatePixPaymentInput, CreatePixPaymentResult, PaymentStatus } from '../../domain/services/payment.service.interface';

export class PaymentMockAdapter implements IPaymentService {
  private readonly payments = new Map<string, PaymentStatus>();

  async createPixPayment(input: CreatePixPaymentInput): Promise<CreatePixPaymentResult> {
    const paymentId = `mock-pix-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    this.payments.set(paymentId, 'PENDING');

    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1);

    return {
      paymentId,
      qrCode: `00020126580014BR.GOV.BCB.PIX0136${input.externalId}5204000053039865802BR5913${input.customerName.slice(0, 13)}6009SAO PAULO62070503***6304ABCD`,
      qrCodeUrl: `https://mock-pix.paiol.dev/qr/${paymentId}.png`,
      expiresAt,
    };
  }

  async getPaymentStatus(paymentId: string): Promise<PaymentStatus> {
    return this.payments.get(paymentId) ?? 'PENDING';
  }

  verifyWebhookSignature(_payload: string, _signature: string): boolean {
    return true;
  }
}
