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

export const PLAN_LIMITS: Record<ProducerPlan, { maxDebts: number; maxBanks: number; voice: boolean; ocr: boolean }> = {
  basic: { maxDebts: 5, maxBanks: 1, voice: false, ocr: false },
  professional: { maxDebts: Infinity, maxBanks: Infinity, voice: true, ocr: true },
  premium: { maxDebts: Infinity, maxBanks: Infinity, voice: true, ocr: true },
};
