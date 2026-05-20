import { PLAN_LIMITS, type ProducerPlan } from '@paiol/types';

interface ProducerProps {
  id: string;
  phone: string;
  name?: string;
  cpfCnpj?: string;
  cooperativeId?: string;
  plan: ProducerPlan;
  createdAt: Date;
}

export class Producer {
  readonly id: string;
  readonly phone: string;
  readonly name?: string;
  readonly cpfCnpj?: string;
  readonly cooperativeId?: string;
  readonly plan: ProducerPlan;
  readonly createdAt: Date;

  constructor(props: ProducerProps) {
    if (!props.phone.match(/^\+55[1-9]{2}[9]?[0-9]{8}$/)) {
      throw new Error(`Número de celular inválido: ${props.phone}`);
    }
    if (!['basic', 'professional', 'premium'].includes(props.plan)) {
      throw new Error(`Plano inválido: ${props.plan}`);
    }
    Object.assign(this, props);
    this.id = props.id;
    this.phone = props.phone;
    this.name = props.name;
    this.cpfCnpj = props.cpfCnpj;
    this.cooperativeId = props.cooperativeId;
    this.plan = props.plan;
    this.createdAt = props.createdAt;
  }

  get maxDebts(): number {
    return PLAN_LIMITS[this.plan].maxDebts;
  }

  get hasVoiceAccess(): boolean {
    return PLAN_LIMITS[this.plan].voice;
  }

  get hasOcrAccess(): boolean {
    return PLAN_LIMITS[this.plan].ocr;
  }

  get maxBanks(): number {
    return PLAN_LIMITS[this.plan].maxBanks;
  }

  canAddDebt(currentCount: number): boolean {
    return currentCount < this.maxDebts;
  }
}
