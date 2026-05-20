export type CooperativePlan = 'basic' | 'standard' | 'enterprise';

export interface Cooperative {
  id: string;
  name: string;
  cnpj: string;
  plan?: CooperativePlan;
  maxAssociates?: number;
  monthlyPrice?: number;
  active: boolean;
}

export interface CreateCooperativeDto {
  name: string;
  cnpj: string;
  plan?: CooperativePlan;
  maxAssociates?: number;
  monthlyPrice?: number;
}
