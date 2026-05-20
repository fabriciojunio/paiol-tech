import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { v4 as uuid } from 'uuid';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import type { Producer } from '../../domain/entities/producer.entity';
import type { JwtPayload } from '@paiol/types';

export interface TokenPair {
  accessToken: string;
  expiresIn: number;
  refreshToken: string;
}

@Injectable()
export class TokenService {
  private readonly refreshSecret: string;

  constructor(
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    this.refreshSecret = config.getOrThrow('REFRESH_TOKEN_SECRET');
  }

  async generatePair(producer: Producer): Promise<TokenPair> {
    const payload: JwtPayload = {
      sub: producer.id,
      phone: producer.phone,
      plan: producer.plan,
      role: 'PRODUCER',
    };

    const accessToken = this.jwt.sign(payload, { expiresIn: '15m' });
    const refreshToken = this.jwt.sign({ sub: producer.id }, { secret: this.refreshSecret, expiresIn: '30d' });

    const expiresAt = new Date(Date.now() + 30 * 24 * 3600 * 1000);
    await this.prisma.authSession.create({
      data: { id: uuid(), producerId: producer.id, refreshToken, expiresAt },
    });

    return { accessToken, expiresIn: 900, refreshToken };
  }

  async refreshAccessToken(refreshToken: string): Promise<{ accessToken: string; expiresIn: number; producerId: string }> {
    let decoded: { sub: string };
    try {
      decoded = this.jwt.verify<{ sub: string }>(refreshToken, { secret: this.refreshSecret });
    } catch {
      throw new Error('Token inválido ou expirado');
    }

    const session = await this.prisma.authSession.findUnique({ where: { refreshToken } });
    if (!session || session.expiresAt < new Date()) throw new Error('Sessão expirada');

    const producer = await this.prisma.producer.findUnique({ where: { id: session.producerId } });

    const jwtPayload: JwtPayload = producer
      ? { sub: producer.id, phone: producer.phone, plan: producer.plan, role: 'PRODUCER' }
      : { sub: decoded.sub, phone: '', plan: 'basic', role: 'PRODUCER' };

    const accessToken = this.jwt.sign(jwtPayload, { expiresIn: '15m' });

    return { accessToken, expiresIn: 900, producerId: session.producerId };
  }

  async invalidateSession(refreshToken: string): Promise<void> {
    await this.prisma.authSession.deleteMany({ where: { refreshToken } });
  }
}
