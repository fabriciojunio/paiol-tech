import { ConfigService } from '@nestjs/config';
import { PlanService } from './plan.service';
import type { PlanFeature } from '@paiol/types';

const makeService = (enforcement?: string) =>
  new PlanService({ get: () => enforcement } as unknown as ConfigService);

describe('PlanService', () => {
  describe('lançamento (padrão, gating desligado)', () => {
    it('libera o núcleo grátis para todo mundo', () => {
      const service = makeService(undefined);
      expect(service.canUse('basic', 'DEBT_MANUAL')).toBe(true);
      expect(service.canUse('basic', 'WHATSAPP_ALERTS')).toBe(true);
      expect(service.canUse('basic', 'PIX_COPY_PASTE')).toBe(true);
      expect(service.canUse('basic', 'STATEMENT_IMPORT')).toBe(true);
    });

    it('libera até os recursos premium de graça durante o lançamento', () => {
      const service = makeService(undefined);
      expect(service.canUse('basic', 'OPEN_FINANCE_SYNC')).toBe(true);
      expect(service.canUse('basic', 'PIX_INITIATION')).toBe(true);
    });
  });

  describe('gating ligado (FREEMIUM_ENFORCEMENT=on)', () => {
    const service = makeService('on');

    it('mantém o núcleo grátis liberado para o plano básico', () => {
      expect(service.canUse('basic', 'DEBT_MANUAL')).toBe(true);
      expect(service.canUse('basic', 'DASHBOARD')).toBe(true);
      expect(service.canUse('basic', 'WHATSAPP_ALERTS')).toBe(true);
      expect(service.canUse('basic', 'HARVEST_CALENDAR')).toBe(true);
      expect(service.canUse('basic', 'OFFLINE_FIRST')).toBe(true);
    });

    it('bloqueia recursos premium no plano básico', () => {
      expect(service.canUse('basic', 'OPEN_FINANCE_SYNC')).toBe(false);
      expect(service.canUse('basic', 'PIX_INITIATION')).toBe(false);
      expect(service.canUse('basic', 'MULTI_PROPERTY')).toBe(false);
      expect(service.canUse('basic', 'ADVISOR_ACCESS')).toBe(false);
    });

    it('libera recursos premium nos planos pagos', () => {
      expect(service.canUse('professional', 'OPEN_FINANCE_SYNC')).toBe(true);
      expect(service.canUse('premium', 'PIX_INITIATION')).toBe(true);
    });

    it('nega recurso fora do catálogo (deny by default)', () => {
      expect(service.canUse('premium', 'RECURSO_INVENTADO' as PlanFeature)).toBe(false);
    });
  });

  it('só liga o gating com o valor exato "on"', () => {
    expect(makeService('on').isEnforcementOn).toBe(true);
    expect(makeService(' ON ').isEnforcementOn).toBe(true);
    expect(makeService('off').isEnforcementOn).toBe(false);
    expect(makeService('true').isEnforcementOn).toBe(false);
    expect(makeService(undefined).isEnforcementOn).toBe(false);
  });
});
