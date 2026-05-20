import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CqrsModule } from '@nestjs/cqrs';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerModule } from '@nestjs/throttler';

import { PrismaService } from './infrastructure/database/prisma.service';
import { PrismaProducerRepository } from './infrastructure/database/prisma-producer.repository';
import { PrismaDebtRepository } from './infrastructure/database/prisma-debt.repository';
import { PrismaAlertRepository } from './infrastructure/database/prisma-alert.repository';
import { PrismaOpenFinanceRepository } from './infrastructure/database/prisma-open-finance.repository';
import { ZApiAdapter } from './infrastructure/whatsapp/zapi.adapter';
import { WhatsAppMockAdapter } from './infrastructure/whatsapp/whatsapp-mock.adapter';
import { TecnoSpeedAdapter } from './infrastructure/open-finance/tecnospeed.adapter';
import { OpenFinanceMockAdapter } from './infrastructure/open-finance/open-finance-mock.adapter';
import { PaymentMockAdapter } from './infrastructure/payment/payment-mock.adapter';
import { PagarmeAdapter } from './infrastructure/payment/pagarme.adapter';
import { AuditService } from './infrastructure/audit/audit.service';
import { JwtStrategy } from './infrastructure/auth/jwt.strategy';

import { OtpService } from './application/services/otp.service';
import { TokenService } from './application/services/token.service';
import { SendOtpHandler } from './application/commands/auth/send-otp.handler';
import { VerifyOtpHandler } from './application/commands/auth/verify-otp.handler';
import { CreateDebtHandler } from './application/commands/debts/create-debt.handler';
import { MarkDebtAsPaidHandler } from './application/commands/debts/mark-debt-paid.handler';
import { DeleteDebtHandler } from './application/commands/debts/delete-debt.handler';
import { CreatePixPaymentHandler } from './application/commands/payments/create-pix-payment.handler';
import { GetDebtsByProducerHandler, GetDebtDashboardHandler, GetDebtByIdHandler } from './application/queries/debts/get-debts.handler';
import { ConnectBankHandler } from './application/commands/open-finance/connect-bank.handler';
import { SyncOpenFinanceHandler } from './application/commands/open-finance/sync-open-finance.handler';
import { GetConnectionsHandler } from './application/queries/open-finance/get-connections.handler';
import { AlertsJob } from './application/jobs/alerts.job';

import { AuthController } from './presentation/controllers/auth.controller';
import { DebtsController } from './presentation/controllers/debts.controller';
import { OpenFinanceController } from './presentation/controllers/open-finance.controller';
import { AdminController } from './presentation/controllers/admin.controller';
import { ProducersController } from './presentation/controllers/producers.controller';
import { PaymentsController } from './presentation/controllers/payments.controller';
import { DeleteAccountHandler } from './application/commands/producers/delete-account.handler';
import { GetMyDataHandler } from './application/queries/producers/get-my-data.handler';

import { PRODUCER_REPOSITORY } from './domain/repositories/producer.repository.interface';
import { DEBT_REPOSITORY } from './domain/repositories/debt.repository.interface';
import { ALERT_REPOSITORY } from './domain/repositories/alert.repository.interface';
import { OPEN_FINANCE_REPOSITORY } from './domain/repositories/open-finance.repository.interface';
import { WHATSAPP_SERVICE } from './domain/services/whatsapp.service.interface';
import { OPEN_FINANCE_SERVICE } from './domain/services/open-finance.service.interface';
import { PAYMENT_SERVICE } from './domain/services/payment.service.interface';

const COMMAND_HANDLERS = [
  SendOtpHandler, VerifyOtpHandler,
  CreateDebtHandler, MarkDebtAsPaidHandler, DeleteDebtHandler,
  ConnectBankHandler, SyncOpenFinanceHandler,
  DeleteAccountHandler,
  CreatePixPaymentHandler,
];
const QUERY_HANDLERS = [GetDebtsByProducerHandler, GetDebtDashboardHandler, GetDebtByIdHandler, GetConnectionsHandler, GetMyDataHandler];

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    CqrsModule,
    PassportModule,
    ScheduleModule.forRoot(),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 30 }]),
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.getOrThrow('JWT_SECRET'),
        signOptions: { expiresIn: '15m' },
      }),
    }),
  ],
  controllers: [AuthController, DebtsController, OpenFinanceController, AdminController, ProducersController, PaymentsController],
  providers: [
    PrismaService,
    AuditService,
    OtpService,
    TokenService,
    JwtStrategy,
    AlertsJob,
    ...COMMAND_HANDLERS,
    ...QUERY_HANDLERS,
    { provide: PRODUCER_REPOSITORY, useClass: PrismaProducerRepository },
    { provide: DEBT_REPOSITORY, useClass: PrismaDebtRepository },
    { provide: ALERT_REPOSITORY, useClass: PrismaAlertRepository },
    { provide: OPEN_FINANCE_REPOSITORY, useClass: PrismaOpenFinanceRepository },
    {
      provide: WHATSAPP_SERVICE,
      useFactory: (config: ConfigService) => {
        if (config.get('NODE_ENV') !== 'production' || !config.get('ZAPI_INSTANCE_ID')) {
          return new WhatsAppMockAdapter();
        }
        return new ZApiAdapter(config);
      },
      inject: [ConfigService],
    },
    {
      provide: OPEN_FINANCE_SERVICE,
      useFactory: (config: ConfigService) => {
        if (config.get('NODE_ENV') !== 'production' || !config.get('TECNOSPEED_API_KEY')) {
          return new OpenFinanceMockAdapter();
        }
        return new TecnoSpeedAdapter(config);
      },
      inject: [ConfigService],
    },
    {
      provide: PAYMENT_SERVICE,
      useFactory: (config: ConfigService) => {
        if (config.get('NODE_ENV') !== 'production' || !config.get('PAGARME_SECRET_KEY')) {
          return new PaymentMockAdapter();
        }
        return new PagarmeAdapter(config);
      },
      inject: [ConfigService],
    },
  ],
})
export class AppModule {}
