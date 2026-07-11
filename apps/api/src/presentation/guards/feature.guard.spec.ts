import { ForbiddenException, type ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { FeatureGuard } from './feature.guard';
import { PlanService } from '../../application/services/plan.service';
import { Producer } from '../../domain/entities/producer.entity';
import type { IProducerRepository } from '../../domain/repositories/producer.repository.interface';
import type { PlanFeature } from '@paiol/types';

const makePlanService = (enforcement?: string) =>
  new PlanService({ get: () => enforcement } as unknown as ConfigService);

const makeReflector = (feature?: PlanFeature) =>
  ({ getAllAndOverride: jest.fn().mockReturnValue(feature) }) as unknown as Reflector;

const makeProducer = (plan: 'basic' | 'premium' = 'basic') =>
  new Producer({ id: 'prod-1', phone: '+5511987654321', plan, createdAt: new Date() });

const makeProducerRepo = (producer: Producer | null = makeProducer()): IProducerRepository => ({
  findById: jest.fn().mockResolvedValue(producer),
  findByPhone: jest.fn(),
  save: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
});

const makeContext = (userSub?: string): ExecutionContext =>
  ({
    getHandler: () => ({}),
    getClass: () => ({}),
    switchToHttp: () => ({
      getRequest: () => ({ user: userSub ? { sub: userSub } : undefined }),
    }),
  }) as unknown as ExecutionContext;

describe('FeatureGuard', () => {
  it('deixa passar rota sem @RequiresFeature', async () => {
    const guard = new FeatureGuard(makeReflector(undefined), makePlanService('on'), makeProducerRepo());
    await expect(guard.canActivate(makeContext('prod-1'))).resolves.toBe(true);
  });

  it('libera tudo durante o lançamento sem consultar o produtor', async () => {
    const repo = makeProducerRepo();
    const guard = new FeatureGuard(makeReflector('OPEN_FINANCE_SYNC'), makePlanService(undefined), repo);
    await expect(guard.canActivate(makeContext('prod-1'))).resolves.toBe(true);
    expect(repo.findById).not.toHaveBeenCalled();
  });

  describe('com gating ligado', () => {
    it('bloqueia recurso premium para plano básico com código PREMIUM_FEATURE', async () => {
      const guard = new FeatureGuard(makeReflector('OPEN_FINANCE_SYNC'), makePlanService('on'), makeProducerRepo(makeProducer('basic')));
      await expect(guard.canActivate(makeContext('prod-1'))).rejects.toThrow(ForbiddenException);
    });

    it('libera recurso premium para plano pago', async () => {
      const guard = new FeatureGuard(makeReflector('OPEN_FINANCE_SYNC'), makePlanService('on'), makeProducerRepo(makeProducer('premium')));
      await expect(guard.canActivate(makeContext('prod-1'))).resolves.toBe(true);
    });

    it('nega sem usuário autenticado (deny by default)', async () => {
      const guard = new FeatureGuard(makeReflector('OPEN_FINANCE_SYNC'), makePlanService('on'), makeProducerRepo());
      await expect(guard.canActivate(makeContext(undefined))).resolves.toBe(false);
    });

    it('nega quando o produtor não existe mais', async () => {
      const guard = new FeatureGuard(makeReflector('OPEN_FINANCE_SYNC'), makePlanService('on'), makeProducerRepo(null));
      await expect(guard.canActivate(makeContext('prod-1'))).resolves.toBe(false);
    });
  });
});
