export type PaymentMethod = 'PIX' | 'CREDIT_CARD';
export type PaymentStatus = 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';

export interface CreatePixPaymentInput {
  amount: number;
  description: string;
  externalId: string;
  customerName: string;
  customerPhone: string;
}

export interface CreatePixPaymentResult {
  paymentId: string;
  qrCode: string;
  qrCodeUrl: string;
  expiresAt: Date;
}

export interface PaymentWebhookPayload {
  paymentId: string;
  status: PaymentStatus;
  paidAt?: Date;
  amount: number;
}

export interface IPaymentService {
  createPixPayment(input: CreatePixPaymentInput): Promise<CreatePixPaymentResult>;
  getPaymentStatus(paymentId: string): Promise<PaymentStatus>;
  verifyWebhookSignature(payload: string, signature: string): boolean;
}

export const PAYMENT_SERVICE = Symbol('IPaymentService');
