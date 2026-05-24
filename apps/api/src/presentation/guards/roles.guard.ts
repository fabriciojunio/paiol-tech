import { Injectable, CanActivate, ExecutionContext, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import type { JwtPayload } from '@paiol/types';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles || requiredRoles.length === 0) return true;

    const request = context.switchToHttp().getRequest<{ user?: JwtPayload }>();
    const user = request.user;

    if (!user) throw new UnauthorizedException({ code: 'UNAUTHORIZED', message: 'Não autenticado.' });

    const validRoles = ['PRODUCER', 'ADMIN'];
    if (!user.role || !validRoles.includes(user.role)) {
      throw new ForbiddenException({ code: 'FORBIDDEN', message: 'Acesso negado.' });
    }

    if (!requiredRoles.includes(user.role)) {
      throw new ForbiddenException({ code: 'FORBIDDEN', message: 'Permissão insuficiente.' });
    }

    return true;
  }
}
