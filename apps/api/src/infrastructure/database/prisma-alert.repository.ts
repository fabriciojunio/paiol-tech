import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import type { IAlertRepository } from '../../domain/repositories/alert.repository.interface';
import { Alert } from '../../domain/entities/alert.entity';
import type { AlertStatus, AlertType } from '@paiol/types';

@Injectable()
export class PrismaAlertRepository implements IAlertRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<Alert | null> {
    const row = await this.prisma.alert.findUnique({ where: { id } });
    return row ? this.toDomain(row) : null;
  }

  async findByProducer(producerId: string): Promise<Alert[]> {
    const rows = await this.prisma.alert.findMany({
      where: { producerId },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map((r) => this.toDomain(r));
  }

  async findByDebt(debtId: string): Promise<Alert[]> {
    const rows = await this.prisma.alert.findMany({
      where: { debtId },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map((r) => this.toDomain(r));
  }

  async findPendingDue(daysAhead: number): Promise<Alert[]> {
    const now = new Date();
    const future = new Date();
    future.setDate(future.getDate() + daysAhead);

    const rows = await this.prisma.alert.findMany({
      where: {
        status: 'PENDING',
        debt: {
          status: 'PENDING',
          dueDate: { gte: now, lte: future },
        },
      },
      include: { debt: true },
      orderBy: { createdAt: 'asc' },
    });
    return rows.map((r) => this.toDomain(r));
  }

  async save(alert: Alert): Promise<Alert> {
    const row = await this.prisma.alert.upsert({
      where: { id: alert.id },
      create: {
        id: alert.id,
        producerId: alert.producerId,
        debtId: alert.debtId,
        type: alert.type,
        daysBefore: alert.daysBefore,
        status: alert.status,
        createdAt: alert.createdAt,
      },
      update: {
        type: alert.type,
        daysBefore: alert.daysBefore,
        status: alert.status,
        sentAt: alert.sentAt,
      },
    });
    return this.toDomain(row);
  }

  async update(
    id: string,
    data: Partial<Pick<Alert, 'daysBefore' | 'type' | 'status' | 'sentAt'>>,
  ): Promise<Alert> {
    const row = await this.prisma.alert.update({ where: { id }, data });
    return this.toDomain(row);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.alert.delete({ where: { id } });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private toDomain(row: any): Alert {
    return new Alert({
      id: row.id as string,
      producerId: row.producerId as string,
      debtId: row.debtId as string,
      type: row.type as AlertType,
      daysBefore: row.daysBefore as number,
      sentAt: (row.sentAt as Date | null | undefined) ?? undefined,
      status: row.status as AlertStatus,
      createdAt: row.createdAt as Date,
    });
  }
}
