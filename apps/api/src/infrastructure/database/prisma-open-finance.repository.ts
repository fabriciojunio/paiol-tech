import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import type { IOpenFinanceRepository, OpenFinanceConnectionRecord } from '../../domain/repositories/open-finance.repository.interface';

@Injectable()
export class PrismaOpenFinanceRepository implements IOpenFinanceRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByProducer(producerId: string): Promise<OpenFinanceConnectionRecord[]> {
    const rows = await this.prisma.openFinanceConnection.findMany({
      where: { producerId },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map((r) => this.toDomain(r));
  }

  async findByProducerAndBank(producerId: string, bankCode: string): Promise<OpenFinanceConnectionRecord | null> {
    const row = await this.prisma.openFinanceConnection.findUnique({
      where: { producerId_bankCode: { producerId, bankCode } },
    });
    return row ? this.toDomain(row) : null;
  }

  async save(record: Omit<OpenFinanceConnectionRecord, 'createdAt'> & { createdAt?: Date }): Promise<OpenFinanceConnectionRecord> {
    const row = await this.prisma.openFinanceConnection.upsert({
      where: { producerId_bankCode: { producerId: record.producerId, bankCode: record.bankCode } },
      create: {
        id: record.id,
        producerId: record.producerId,
        bankCode: record.bankCode,
        bankName: record.bankName,
        consentId: record.consentId,
        status: record.status,
        lastSyncAt: record.lastSyncAt,
        expiresAt: record.expiresAt,
        createdAt: record.createdAt ?? new Date(),
      },
      update: {
        bankName: record.bankName,
        consentId: record.consentId,
        status: record.status,
        lastSyncAt: record.lastSyncAt,
        expiresAt: record.expiresAt,
      },
    });
    return this.toDomain(row);
  }

  async updateLastSync(id: string): Promise<void> {
    await this.prisma.openFinanceConnection.update({
      where: { id },
      data: { lastSyncAt: new Date() },
    });
  }

  async revoke(id: string): Promise<void> {
    await this.prisma.openFinanceConnection.update({
      where: { id },
      data: { status: 'REVOKED' },
    });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private toDomain(row: any): OpenFinanceConnectionRecord {
    return {
      id: row.id as string,
      producerId: row.producerId as string,
      bankCode: row.bankCode as string,
      bankName: row.bankName as string,
      consentId: (row.consentId as string | null) ?? undefined,
      status: row.status as 'ACTIVE' | 'EXPIRED' | 'REVOKED',
      lastSyncAt: (row.lastSyncAt as Date | null) ?? undefined,
      expiresAt: (row.expiresAt as Date | null) ?? undefined,
      createdAt: row.createdAt as Date,
    };
  }
}
