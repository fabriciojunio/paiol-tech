import { Injectable, UnauthorizedException, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  override handleRequest<TUser>(err: Error | null, user: TUser, info: unknown): TUser {
    if (err ?? !user) {
      throw new UnauthorizedException({
        code: 'UNAUTHORIZED',
        message: 'Sua sessão encerrou — entre novamente.',
      });
    }
    return user;
  }
}
