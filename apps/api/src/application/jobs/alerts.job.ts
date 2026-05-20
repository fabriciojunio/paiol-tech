import { Injectable, Inject, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { DEBT_REPOSITORY, type IDebtRepository } from '../../domain/repositories/debt.repository.interface';
import { ALERT_REPOSITORY, type IAlertRepository } from '../../domain/repositories/alert.repository.interface';
import { WHATSAPP_SERVICE, type IWhatsAppService } from '../../domain/services/whatsapp.service.interface';
import { PRODUCER_REPOSITORY, type IProducerRepository } from '../../domain/repositories/producer.repository.interface';
import { formatCurrency, dueDateLabel } from '@paiol/utils';

@Injectable()
export class AlertsJob {
  private readonly logger = new Logger(AlertsJob.name);

  constructor(
    @Inject(DEBT_REPOSITORY) private readonly debtRepo: IDebtRepository,
    @Inject(ALERT_REPOSITORY) private readonly alertRepo: IAlertRepository,
    @Inject(WHATSAPP_SERVICE) private readonly whatsapp: IWhatsAppService,
    @Inject(PRODUCER_REPOSITORY) private readonly producerRepo: IProducerRepository,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_8AM)
  async markOverdueDebts(): Promise<void> {
    const count = await this.debtRepo.markOverdue();
    if (count > 0) this.logger.log(`${count} dívidas marcadas como vencidas`);
  }

  @Cron(CronExpression.EVERY_DAY_AT_9AM)
  async sendDueAlerts(): Promise<void> {
    this.logger.log('Iniciando envio de alertas de vencimento');
    const pendingAlerts = await this.alertRepo.findPendingDue(15);

    let sent = 0;
    let failed = 0;

    for (const alert of pendingAlerts) {
      try {
        const [debt, producer] = await Promise.all([
          this.debtRepo.findById(alert.debtId),
          this.producerRepo.findById(alert.producerId),
        ]);

        if (!debt || !producer) continue;
        if (debt.status === 'PAID' || debt.status === 'RENEGOTIATED') {
          await this.alertRepo.update(alert.id, { status: 'SENT' });
          continue;
        }

        const label = dueDateLabel(debt.dueDate);
        const message = `🌾 Paiol: sua dívida com *${debt.creditor}* de *${formatCurrency(debt.amount)}* ${label}.`;

        await this.whatsapp.sendAlert(producer.phone, message);
        await this.alertRepo.update(alert.id, { status: 'SENT', sentAt: new Date() });
        sent++;
      } catch (err) {
        this.logger.error(`Falha ao enviar alerta ${alert.id}`, err);
        await this.alertRepo.update(alert.id, { status: 'FAILED' }).catch(() => null);
        failed++;
      }
    }

    this.logger.log(`Alertas enviados: ${sent}, falhas: ${failed}`);
  }
}
