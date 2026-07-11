import { CanActivate, ExecutionContext, ForbiddenException, Inject, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { JwtPayload, PlanFeature } from '@paiol/types';
import { FEATURE_KEY } from '../decorators/requires-feature.decorator';
import { PlanService } from '../../application/services/plan.service';
import { PRODUCER_REPOSITORY, type IProducerRepository } from '../../domain/repositories/producer.repository.interface';

/**
 * Bloqueia rotas premium quando o gating estiver ligado
 * (FREEMIUM_ENFORCEMENT=on). Sem o decorator @RequiresFeature a rota passa
 * direto; a autenticação continua por conta do JwtAuthGuard.
 */
@Injectable()
export class FeatureGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly planService: PlanService,
    @Inject(PRODUCER_REPOSITORY) private readonly producerRepo: IProducerRepository,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const feature = this.reflector.getAllAndOverride<PlanFeature | undefined>(FEATURE_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!feature) return true;

    // Caminho rápido do lançamento: nada de consulta extra quando está tudo liberado.
    if (!this.planService.isEnforcementOn) return true;

    const request = context.switchToHttp().getRequest<{ user?: JwtPayload }>();
    const producerId = request.user?.sub;
    if (!producerId) return false;

    const producer = await this.producerRepo.findById(producerId);
    if (!producer) return false;

    if (!this.planService.canUse(producer.plan, feature)) {
      throw new ForbiddenException({
        code: 'PREMIUM_FEATURE',
        message: 'Esse recurso faz parte do plano pago do Paiol. O básico continua grátis para sempre.',
      });
    }
    return true;
  }
}
