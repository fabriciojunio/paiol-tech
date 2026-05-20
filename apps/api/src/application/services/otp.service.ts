import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/database/prisma.service';

const OTP_TTL_SECONDS = 300;
const MAX_ATTEMPTS_PER_HOUR = 3;

@Injectable()
export class OtpService {
  constructor(private readonly prisma: PrismaService) {}

  async generate(phone: string): Promise<string> {
    const oneHourAgo = new Date(Date.now() - 3600 * 1000);
    const recentCount = await this.prisma.otpSession.count({
      where: { phone, createdAt: { gte: oneHourAgo } },
    });

    if (recentCount >= MAX_ATTEMPTS_PER_HOUR) {
      throw new BadRequestException({
        code: 'OTP_MAX_ATTEMPTS',
        message: 'Muitas tentativas. Aguarde alguns minutos e tente novamente.',
      });
    }

    const code = Math.floor(1000 + Math.random() * 9000).toString();
    const expiresAt = new Date(Date.now() + OTP_TTL_SECONDS * 1000);

    await this.prisma.otpSession.create({
      data: { phone, code, expiresAt },
    });

    return code;
  }

  async verify(phone: string, code: string): Promise<boolean> {
    const session = await this.prisma.otpSession.findFirst({
      where: { phone, code, used: false, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: 'desc' },
    });

    if (!session) return false;

    await this.prisma.otpSession.update({
      where: { id: session.id },
      data: { used: true },
    });

    return true;
  }
}
