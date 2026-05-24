import { Controller, Post, Delete, Body, Req, Res, HttpCode, HttpStatus, ForbiddenException, Inject, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { CommandBus } from '@nestjs/cqrs';
import type { Request, Response } from 'express';
import { v4 as uuid } from 'uuid';
import { SendOtpCommand } from '../../application/commands/auth/send-otp.command';
import { VerifyOtpCommand } from '../../application/commands/auth/verify-otp.command';
import { TokenService } from '../../application/services/token.service';
import { sendOtpSchema, verifyOtpSchema } from '@paiol/validators';
import type { TokenPair } from '../../application/services/token.service';
import { PRODUCER_REPOSITORY, type IProducerRepository } from '../../domain/repositories/producer.repository.interface';
import { Producer } from '../../domain/entities/producer.entity';

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env['NODE_ENV'] === 'production',
  sameSite: 'strict' as const,
  path: '/',
  maxAge: 30 * 24 * 3600 * 1000,
};

@Controller('auth')
export class AuthController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly tokenService: TokenService,
    @Inject(PRODUCER_REPOSITORY) private readonly producerRepo: IProducerRepository,
  ) {}

  @Post('otp/send')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 3, ttl: 3600000 } })
  async sendOtp(@Body() body: unknown) {
    const { phone } = sendOtpSchema.parse(body);
    const result = await this.commandBus.execute<SendOtpCommand, { expiresIn: number }>(
      new SendOtpCommand(phone),
    );
    return { data: { message: 'Código enviado no WhatsApp', expiresIn: result.expiresIn } };
  }

  @Post('otp/verify')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 5, ttl: 300000 } })
  async verifyOtp(@Body() body: unknown, @Res({ passthrough: true }) res: Response) {
    const { phone, code } = verifyOtpSchema.parse(body);
    const tokens = await this.commandBus.execute<VerifyOtpCommand, TokenPair>(
      new VerifyOtpCommand(phone, code),
    );
    res.cookie('paiol_refresh', tokens.refreshToken, COOKIE_OPTIONS);
    return { data: { accessToken: tokens.accessToken, expiresIn: tokens.expiresIn } };
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const refreshToken = req.cookies?.['paiol_refresh'];
    if (!refreshToken) {
      res.status(HttpStatus.UNAUTHORIZED).json({ error: { code: 'UNAUTHORIZED', message: 'Sua sessão encerrou — entre novamente.' } });
      return;
    }
    const { accessToken, expiresIn, producerId } = await this.tokenService.refreshAccessToken(refreshToken as string);
    const producer = await this.producerRepo.findById(producerId);
    const user = producer
      ? { sub: producer.id, phone: producer.phone, plan: producer.plan, role: 'PRODUCER' }
      : null;
    return { data: { accessToken, expiresIn, user } };
  }

  @Delete('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const refreshToken = req.cookies?.['paiol_refresh'] as string | undefined;
    if (refreshToken) await this.tokenService.invalidateSession(refreshToken);
    res.clearCookie('paiol_refresh', { path: '/' });
  }

  /** Only available in non-production — used by Playwright E2E global-setup */
  @Post('e2e-token')
  @HttpCode(HttpStatus.OK)
  async e2eToken(@Res({ passthrough: true }) res: Response) {
    if (process.env['NODE_ENV'] === 'production') throw new ForbiddenException();
    const phone = '+5511900000001';
    let producer = await this.producerRepo.findByPhone(phone);
    if (!producer) {
      producer = new Producer({ id: uuid(), phone, plan: 'professional', createdAt: new Date() });
      await this.producerRepo.save(producer);
    }
    const tokens = await this.tokenService.generatePair(producer);
    res.cookie('paiol_refresh', tokens.refreshToken, COOKIE_OPTIONS);
    return { data: { accessToken: tokens.accessToken } };
  }
}
