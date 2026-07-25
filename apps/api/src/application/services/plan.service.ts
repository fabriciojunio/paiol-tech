import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  isFreeFeature,
  isPremiumFeature,
  tierOf,
  type PlanFeature,
  type ProducerPlan,
} from '@paiol/types';

/**
 * Decide o que cada produtor pode usar, por recurso nomeado.
 *
 * Estratégia de lançamento: tudo liberado de graça. O gating premium só
 * passa a valer quando FREEMIUM_ENFORCEMENT=on, sem precisar de deploy de
 * código novo. Recurso desconhecido é negado (deny by default).
 */
@Injectable()
export class PlanService {
  constructor(private readonly config: ConfigService) {}

  /** Durante o lançamento (padrão) os recursos premium ficam liberados. */
  get isEnforcementOn(): boolean {
    return this.config.get<string>('FREEMIUM_ENFORCEMENT')?.trim().toLowerCase() === 'on';
  }

  canUse(plan: ProducerPlan, feature: PlanFeature): boolean {
    if (isFreeFeature(feature)) return true;

    if (isPremiumFeature(feature)) {
      if (!this.isEnforcementOn) return true;
      return tierOf(plan) === 'PREMIUM';
    }

    // Recurso que não está no catálogo: nega por padrão.
    return false;
  }
}
