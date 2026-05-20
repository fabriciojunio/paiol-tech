import { Controller, Get, Delete, UseGuards, HttpCode, HttpStatus, Res } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import type { Response } from 'express';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { CurrentUser } from '../decorators/current-user.decorator';
import type { JwtPayload } from '@paiol/types';
import { GetMyDataQuery } from '../../application/queries/producers/get-my-data.query';
import { DeleteAccountCommand } from '../../application/commands/producers/delete-account.command';

@Controller('producers')
@UseGuards(JwtAuthGuard)
export class ProducersController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Get('me/data')
  async exportMyData(@CurrentUser() user: JwtPayload, @Res() res: Response) {
    const data = await this.queryBus.execute(new GetMyDataQuery(user.sub));
    const json = JSON.stringify(data, null, 2);
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="paiol-dados-${new Date().toISOString().slice(0, 10)}.json"`);
    res.send(json);
  }

  @Delete('me')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteMyAccount(@CurrentUser() user: JwtPayload) {
    await this.commandBus.execute(new DeleteAccountCommand(user.sub));
  }
}
