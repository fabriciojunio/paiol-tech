import { Controller, Post, Body, UseGuards, RawBodyRequest, Req, HttpCode, HttpStatus, BadRequestException, Inject } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import type { Request } from 'express';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { CurrentUser } from '../decorators/current-user.decorator';
import type { JwtPayload } from '@paiol/types';
import { CreatePixPaymentCommand } from '../../application/commands/payments/create-pix-payment.command';
import { PAYMENT_SERVICE, IPaymentService, PaymentWebhookPayload } from '../../domain/services/payment.service.interface';

class CreatePixDto {
  debtId!: string;
  amount!: number;
  description!: string;
}

@Controller('payments')
export class PaymentsController {
  constructor(
    private readonly commandBus: CommandBus,
    @Inject(PAYMENT_SERVICE) private readonly paymentService: IPaymentService,
  ) {}

  @Post('pix')
  @UseGuards(JwtAuthGuard)
  async createPix(@CurrentUser() user: JwtPayload, @Body() dto: CreatePixDto) {
    return this.commandBus.execute(
      new CreatePixPaymentCommand(user.sub, dto.debtId, dto.amount, dto.description),
    );
  }

  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  async handleWebhook(@Req() req: RawBodyRequest<Request>) {
    const signature = req.headers['x-pagarme-signature'];
    if (typeof signature !== 'string') throw new BadRequestException('Missing signature');

    const rawBody = req.rawBody;
    if (!rawBody) throw new BadRequestException('Missing body');

    const isValid = this.paymentService.verifyWebhookSignature(rawBody.toString(), signature);
    if (!isValid) throw new BadRequestException('Invalid signature');

    const payload = JSON.parse(rawBody.toString()) as PaymentWebhookPayload;
    // Webhook received — in a full implementation, update debt status here
    return { received: true, paymentId: payload.paymentId };
  }
}
