import { Controller, Get, Post, Body, Query, UseGuards, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Throttle } from '@nestjs/throttler';
import { IsString, MaxLength } from 'class-validator';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from '../decorators/roles.decorator';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import * as crypto from 'crypto';

class AdminLoginDto {
  @IsString()
  @MaxLength(128)
  username!: string;

  @IsString()
  @MaxLength(128)
  password!: string;
}

@Controller('admin')
export class AdminController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  @Post('login')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  async login(@Body() body: AdminLoginDto) {
    const adminUser = process.env['ADMIN_USERNAME'];
    const adminPass = process.env['ADMIN_PASSWORD'];

    if (!adminUser || !adminPass) {
      throw new UnauthorizedException('Credenciais de admin não configuradas.');
    }

    // Comparação segura contra timing attacks. O hash normaliza o tamanho
    // dos buffers: timingSafeEqual lança exceção com tamanhos diferentes,
    // o que derrubava a request com 500 e revelava o tamanho da credencial.
    const digest = (value: string) => crypto.createHash('sha256').update(value).digest();
    const userMatch = crypto.timingSafeEqual(digest(body.username ?? ''), digest(adminUser));
    const passMatch = crypto.timingSafeEqual(digest(body.password ?? ''), digest(adminPass));

    if (!userMatch || !passMatch) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    const token = this.jwtService.sign({ sub: 'admin', role: 'ADMIN' }, { expiresIn: '8h' });
    return { token };
  }

  @Get('stats')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async getStats() {
    const [totalProducers, totalDebts, debtAgg, planGroups] = await Promise.all([
      this.prisma.producer.count(),
      this.prisma.debt.count({ where: { status: { in: ['PENDING', 'OVERDUE'] } } }),
      this.prisma.debt.aggregate({
        where: { status: { in: ['PENDING', 'OVERDUE'] } },
        _sum: { amount: true },
      }),
      this.prisma.producer.groupBy({ by: ['plan'], _count: { id: true } }),
    ]);

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const activeProducers = await this.prisma.producer.count({
      where: { debts: { some: { createdAt: { gte: thirtyDaysAgo } } } },
    });

    const plansBreakdown: Record<string, number> = {};
    planGroups.forEach((g) => { plansBreakdown[g.plan] = g._count.id; });

    return {
      totalProducers,
      activeProducers,
      totalDebts,
      totalOwed: Number(debtAgg._sum.amount ?? 0),
      plansBreakdown,
    };
  }

  @Get('producers')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async listProducers(
    @Query('page') page = '1',
    @Query('limit') limit = '20',
    @Query('plan') plan?: string,
  ) {
    const take = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100);
    const skip = (Math.max(parseInt(page, 10) || 1, 1) - 1) * take;
    const where = plan ? { plan } : {};

    const [producers, total] = await Promise.all([
      this.prisma.producer.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        select: { id: true, phone: true, plan: true, createdAt: true },
      }),
      this.prisma.producer.count({ where }),
    ]);

    return { data: producers, total, page: Math.max(parseInt(page, 10) || 1, 1), limit: take };
  }

  @Get('cooperatives')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async listCooperatives(
    @Query('page') page = '1',
    @Query('limit') limit = '20',
  ) {
    const take = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100);
    const skip = (Math.max(parseInt(page, 10) || 1, 1) - 1) * take;

    const [cooperatives, total] = await Promise.all([
      this.prisma.cooperative.findMany({ skip, take, orderBy: { createdAt: 'desc' } }),
      this.prisma.cooperative.count(),
    ]);

    return { data: cooperatives, total };
  }

  @Get('debts')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async listAllDebts(
    @Query('page') page = '1',
    @Query('limit') limit = '20',
    @Query('status') status?: string,
  ) {
    const take = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100);
    const skip = (Math.max(parseInt(page, 10) || 1, 1) - 1) * take;
    const where = status ? { status } : {};

    const [debts, total] = await Promise.all([
      this.prisma.debt.findMany({ where, skip, take, orderBy: { createdAt: 'desc' } }),
      this.prisma.debt.count({ where }),
    ]);

    return { data: debts, total };
  }

  @Get('audit')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async getAuditLogs(
    @Query('page') page = '1',
    @Query('limit') limit = '50',
  ) {
    const take = Math.min(Math.max(parseInt(limit, 10) || 50, 1), 200);
    const skip = (Math.max(parseInt(page, 10) || 1, 1) - 1) * take;

    const [logs, total] = await Promise.all([
      this.prisma.auditLog.findMany({ skip, take, orderBy: { createdAt: 'desc' } }),
      this.prisma.auditLog.count(),
    ]);

    return { data: logs, total };
  }
}
