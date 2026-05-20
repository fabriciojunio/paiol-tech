import { Controller, Get, Post, Delete, Body, Param, Query, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { CurrentUser } from '../decorators/current-user.decorator';
import { CreateDebtCommand } from '../../application/commands/debts/create-debt.command';
import { MarkDebtAsPaidCommand } from '../../application/commands/debts/mark-debt-paid.handler';
import { DeleteDebtCommand } from '../../application/commands/debts/delete-debt.handler';
import { GetDebtsByProducerQuery, GetDebtDashboardQuery, GetDebtByIdQuery } from '../../application/queries/debts/get-debts.query';
import { createDebtSchema, paginationSchema } from '@paiol/validators';
import type { JwtPayload } from '@paiol/types';

@Controller('debts')
@UseGuards(JwtAuthGuard)
export class DebtsController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Get()
  async getDebts(
    @CurrentUser() user: JwtPayload,
    @Query() query: Record<string, string>,
  ) {
    const { page, limit } = paginationSchema.parse(query);
    const result = await this.queryBus.execute(
      new GetDebtsByProducerQuery(user.sub, { status: query['status'] as any, creditor: query['creditor'] }, { page, limit }),
    );
    return { data: result.debts, meta: { page, limit, total: result.total, totalPages: Math.ceil(result.total / limit) } };
  }

  @Get('dashboard')
  async getDashboard(@CurrentUser() user: JwtPayload) {
    const data = await this.queryBus.execute(new GetDebtDashboardQuery(user.sub));
    return { data };
  }

  @Get(':id')
  async getDebtById(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    const debt = await this.queryBus.execute(new GetDebtByIdQuery(id, user.sub));
    return { data: debt };
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createDebt(@CurrentUser() user: JwtPayload, @Body() body: unknown) {
    const dto = createDebtSchema.parse(body);
    const debt = await this.commandBus.execute(
      new CreateDebtCommand(
        user.sub,
        dto.creditor,
        dto.amount,
        new Date(dto.dueDate),
        dto.source,
        dto.description,
        dto.bankCode,
        dto.contractNumber,
        (body as Record<string, unknown>)['forceDuplicate'] === true,
      ),
    );
    return { data: debt };
  }

  @Post(':id/pay')
  @HttpCode(HttpStatus.OK)
  async markAsPaid(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    const debt = await this.commandBus.execute(new MarkDebtAsPaidCommand(id, user.sub));
    return { data: debt };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteDebt(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    await this.commandBus.execute(new DeleteDebtCommand(id, user.sub));
  }
}
