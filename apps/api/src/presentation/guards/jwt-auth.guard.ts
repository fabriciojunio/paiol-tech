import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  override handleRequest<TUser>(err: Error | null, user: TUser, _info: unknown): TUser {
    if (err ?? !user) {
      throw new UnauthorizedException({
        code: 'UNAUTHORIZED',
        message: 'Sua sessão encerrou. Entre novamente.',
      });
    }
    return user;
  }
}
