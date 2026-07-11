import { SetMetadata } from '@nestjs/common';
import type { PlanFeature } from '@paiol/types';

export const FEATURE_KEY = 'required_feature';

/**
 * Marca uma rota como dependente de um recurso do catálogo de planos.
 * Use junto com o FeatureGuard.
 */
export const RequiresFeature = (feature: PlanFeature) => SetMetadata(FEATURE_KEY, feature);
