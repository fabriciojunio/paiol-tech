import type { ProducerPlan } from './producer';

/**
 * Camadas comerciais do Paiol Tech.
 *
 * FREE: tudo que o produtor precisa para organizar as dívidas da lavoura,
 * de graça e para sempre.
 * PREMIUM: recursos que dependem de fornecedor pago (agregação automática
 * via Open Finance, iniciação de pagamento) ou de operação avançada.
 */
export type PlanTier = 'FREE' | 'PREMIUM';

/**
 * Recursos nomeados do produto. O gating é sempre feito por recurso,
 * nunca por checagem solta de string de plano espalhada pelo código.
 */
export type PlanFeature =
  // Núcleo grátis (para sempre)
  | 'DEBT_MANUAL' // cadastro manual de dívidas (voz, foto de boleto, formulário)
  | 'DASHBOARD' // painel "quanto devo / próximos vencimentos"
  | 'WHATSAPP_ALERTS' // alertas de vencimento no WhatsApp
  | 'HARVEST_CALENDAR' // calendário de safra
  | 'STATEMENT_IMPORT' // import de extrato (OFX/CSV)
  | 'PIX_COPY_PASTE' // Pix copia e cola para pagar parcelas
  | 'OFFLINE_FIRST' // funcionar sem sinal e sincronizar depois
  // Premium (futuro pago; liberado de graça durante o lançamento)
  | 'OPEN_FINANCE_SYNC' // agregação automática das dívidas em vários bancos
  | 'PIX_INITIATION' // iniciação de pagamento Pix via Open Finance (ITP)
  | 'MULTI_PROPERTY' // várias propriedades na mesma conta
  | 'ADVISOR_ACCESS' // acesso do contador ou da cooperativa
  | 'RENEGOTIATION_INSIGHTS'; // sugestões de renegociação

export const FREE_FEATURES: readonly PlanFeature[] = [
  'DEBT_MANUAL',
  'DASHBOARD',
  'WHATSAPP_ALERTS',
  'HARVEST_CALENDAR',
  'STATEMENT_IMPORT',
  'PIX_COPY_PASTE',
  'OFFLINE_FIRST',
] as const;

export const PREMIUM_FEATURES: readonly PlanFeature[] = [
  'OPEN_FINANCE_SYNC',
  'PIX_INITIATION',
  'MULTI_PROPERTY',
  'ADVISOR_ACCESS',
  'RENEGOTIATION_INSIGHTS',
] as const;

/**
 * Mapeia os planos persistidos no banco ('basic' | 'professional' | 'premium')
 * para a camada comercial. Mantém compatibilidade com registros existentes.
 */
export function tierOf(plan: ProducerPlan): PlanTier {
  return plan === 'basic' ? 'FREE' : 'PREMIUM';
}

export function isPremiumFeature(feature: PlanFeature): boolean {
  return PREMIUM_FEATURES.some((f) => f === feature);
}

export function isFreeFeature(feature: PlanFeature): boolean {
  return FREE_FEATURES.some((f) => f === feature);
}
