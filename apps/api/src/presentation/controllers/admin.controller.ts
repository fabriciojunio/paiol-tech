import { Controller, Get, Post, Body, Query, UseGuards, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { PrismaService } from '../../infrastructure/database/prisma.service';

@Controller('admin')
export class AdminController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  @Post('login')
  async login(@Body() body: { username: string; password: string }) {
    const adminUser = process.env['ADMIN_USERNAME'] ?? 'admin';
    const adminPass = process.env['ADMIN_PASSWORD'] ?? 'paiol@admin2025';
    if (body.username !== adminUser || body.password !== adminPass) {
      throw new UnauthorizedException('Credenciais inválidas');
    }
    const token = this.jwtService.sign({ sub: 'admin', role: 'admin' }, { expiresIn: '8h' });
    return { token };
  }

  @Get('stats')
  @UseGuards(JwtAuthGuard)
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
  @UseGuards(JwtAuthGuard)
  async listProducers(
    @Query('page') page = '1',
    @Query('limit') limit = '20',
    @Query('plan') plan?: string,
  ) {
    const take = Math.min(parseInt(limit, 10), 100);
    const skip = (parseInt(page, 10) - 1) * take;
    const where = plan ? { plan } : {};

    const [producers, total] = await Promise.all([
      this.prisma.producer.findMany({ where, skip, take, orderBy: { createdAt: 'desc' } }),
      this.prisma.producer.count({ where }),
    ]);

    return { data: producers, total, page: parseInt(page, 10), limit: take };
  }

  @Get('cooperatives')
  @UseGuards(JwtAuthGuard)
  async listCooperatives(
    @Query('page') page = '1',
    @Query('limit') limit = '20',
  ) {
    const take = Math.min(parseInt(limit, 10), 100);
    const skip = (parseInt(page, 10) - 1) * take;

    const [cooperatives, total] = await Promise.all([
      this.prisma.cooperative.findMany({ skip, take, orderBy: { createdAt: 'desc' } }),
      this.prisma.cooperative.count(),
    ]);

    return { data: cooperatives, total };
  }

  @Get('debts')
  @UseGuards(JwtAuthGuard)
  async listAllDebts(
    @Query('page') page = '1',
    @Query('limit') limit = '20',
    @Query('status') status?: string,
  ) {
    const take = Math.min(parseInt(limit, 10), 100);
    const skip = (parseInt(page, 10) - 1) * take;
    const where = status ? { status } : {};

    const [debts, total] = await Promise.all([
      this.prisma.debt.findMany({ where, skip, take, orderBy: { createdAt: 'desc' } }),
      this.prisma.debt.count({ where }),
    ]);

    return { data: debts, total };
  }

  @Get('audit')
  @UseGuards(JwtAuthGuard)
  async getAuditLogs(
    @Query('page') page = '1',
    @Query('limit') limit = '50',
  ) {
    const take = Math.min(parseInt(limit, 10), 200);
    const skip = (parseInt(page, 10) - 1) * take;

    const [logs, total] = await Promise.all([
      this.prisma.auditLog.findMany({ skip, take, orderBy: { createdAt: 'desc' } }),
      this.prisma.auditLog.count(),
    ]);

    return { data: logs, total };
  }
}
