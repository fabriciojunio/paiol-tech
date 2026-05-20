import { Controller, Post, Get, Delete, Body, Param, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { CurrentUser } from '../decorators/current-user.decorator';
import type { JwtPayload } from '@paiol/types';
import { ConnectBankCommand } from '../../application/commands/open-finance/connect-bank.command';
import { SyncOpenFinanceCommand } from '../../application/commands/open-finance/sync-open-finance.command';
import { GetConnectionsQuery } from '../../application/queries/open-finance/get-connections.query';

@Controller('open-finance')
@UseGuards(JwtAuthGuard)
export class OpenFinanceController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Get('connections')
  getConnections(@CurrentUser() user: JwtPayload) {
    return this.queryBus.execute(new GetConnectionsQuery(user.sub));
  }

  @Post('connect')
  @HttpCode(HttpStatus.CREATED)
  connectBank(
    @CurrentUser() user: JwtPayload,
    @Body() body: { bankCode: string },
  ) {
    return this.commandBus.execute(new ConnectBankCommand(user.sub, body.bankCode));
  }

  @Post('sync/:connectionId')
  @HttpCode(HttpStatus.OK)
  async syncBank(
    @CurrentUser() user: JwtPayload,
    @Param('connectionId') connectionId: string,
    @Body() body: { bankCode: string },
  ) {
    return this.commandBus.execute(
      new SyncOpenFinanceCommand(user.sub, body.bankCode, connectionId),
    );
  }

  @Delete('connections/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async revokeConnection(
    @Param('id') _id: string,
    @CurrentUser() _user: JwtPayload,
  ) {
    // revogar consentimento — implementado via PrismaOpenFinanceRepository.revoke()
  }
}
