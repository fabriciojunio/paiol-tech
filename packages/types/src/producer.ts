export type ProducerPlan = 'basic' | 'professional' | 'premium';
export type ProducerRole = 'PRODUCER' | 'COOPERATIVE_ADMIN' | 'SUPER_ADMIN';

export interface Producer {
  id: string;
  phone: string;
  name?: string;
  cpfCnpj?: string;
  cooperativeId?: string;
  plan: ProducerPlan;
  createdAt: Date;
}

export interface CreateProducerDto {
  phone: string;
  name?: string;
  cpfCnpj?: string;
  cooperativeId?: string;
}

export interface UpdateProducerDto {
  name?: string;
  cpfCnpj?: string;
}

/**
 * Limites operacionais por plano.
 *
 * Estratégia comercial: o núcleo de gestão de dívidas é grátis para sempre,
 * sem limite de cadastro. O que diferencia o plano pago são recursos que
 * dependem de fornecedor externo (Open Finance automático, iniciação de
 * pagamento), controlados por recurso em `plan.ts`, não por contagem aqui.
 */
export const PLAN_LIMITS: Record<ProducerPlan, { maxDebts: number; maxBanks: number; voice: boolean; ocr: boolean }> = {
  basic: { maxDebts: Infinity, maxBanks: Infinity, voice: true, ocr: true },
  professional: { maxDebts: Infinity, maxBanks: Infinity, voice: true, ocr: true },
  premium: { maxDebts: Infinity, maxBanks: Infinity, voice: true, ocr: true },
};
