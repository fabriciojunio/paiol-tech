import { Controller, Post, Get, Delete, Body, Param, UseGuards, HttpCode, HttpStatus, BadRequestException } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { FeatureGuard } from '../guards/feature.guard';
import { RequiresFeature } from '../decorators/requires-feature.decorator';
import { CurrentUser } from '../decorators/current-user.decorator';
import type { JwtPayload } from '@paiol/types';
import { ConnectBankCommand } from '../../application/commands/open-finance/connect-bank.command';
import { SyncOpenFinanceCommand } from '../../application/commands/open-finance/sync-open-finance.command';
import { RevokeConnectionCommand } from '../../application/commands/open-finance/revoke-connection.command';
import { GetConnectionsQuery } from '../../application/queries/open-finance/get-connections.query';

@Controller('open-finance')
@UseGuards(JwtAuthGuard, FeatureGuard)
export class OpenFinanceController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Get('connections')
  async getConnections(@CurrentUser() user: JwtPayload) {
    const data = await this.queryBus.execute(new GetConnectionsQuery(user.sub));
    return { data };
  }

  @Post('connect')
  @RequiresFeature('OPEN_FINANCE_SYNC')
  @HttpCode(HttpStatus.CREATED)
  async connectBank(
    @CurrentUser() user: JwtPayload,
    @Body() body: { bankCode: string },
  ) {
    const bankCode = body.bankCode?.trim();
    if (!bankCode || !/^\d{1,8}$/.test(bankCode)) {
      throw new BadRequestException('bankCode inválido. Informe o código numérico do banco.');
    }
    const data = await this.commandBus.execute(new ConnectBankCommand(user.sub, bankCode));
    return { data };
  }

  @Post('sync/:connectionId')
  @RequiresFeature('OPEN_FINANCE_SYNC')
  @HttpCode(HttpStatus.OK)
  async syncBank(
    @CurrentUser() user: JwtPayload,
    @Param('connectionId') connectionId: string,
  ) {
    const data = await this.commandBus.execute(new SyncOpenFinanceCommand(user.sub, connectionId));
    return { data };
  }

  @Delete('connections/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async revokeConnection(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    await this.commandBus.execute(new RevokeConnectionCommand(user.sub, id));
  }
}
