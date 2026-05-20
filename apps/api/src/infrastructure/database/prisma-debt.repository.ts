import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import type { IDebtRepository, DebtPage, DuplicateCheckParams } from '../../domain/repositories/debt.repository.interface';
import { Debt } from '../../domain/entities/debt.entity';
import type { DebtFilters, DebtSource, DebtStatus, PaginationQuery } from '@paiol/types';

@Injectable()
export class PrismaDebtRepository implements IDebtRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<Debt | null> {
    const row = await this.prisma.debt.findUnique({ where: { id } });
    return row ? this.toDomain(row) : null;
  }

  async findByContractNumber(producerId: string, contractNumber: string): Promise<Debt | null> {
    const row = await this.prisma.debt.findFirst({ where: { producerId, contractNumber } });
    return row ? this.toDomain(row) : null;
  }

  async findByProducer(producerId: string, filters?: DebtFilters, pagination?: PaginationQuery): Promise<DebtPage> {
    const page = pagination?.page ?? 1;
    const limit = pagination?.limit ?? 20;
    const skip = (page - 1) * limit;

    const where = {
      producerId,
      ...(filters?.status ? { status: filters.status } : {}),
      ...(filters?.creditor ? { creditor: { contains: filters.creditor, mode: 'insensitive' as const } } : {}),
    };

    const [rows, total] = await Promise.all([
      this.prisma.debt.findMany({ where, skip, take: limit, orderBy: { dueDate: 'asc' } }),
      this.prisma.debt.count({ where }),
    ]);

    return { debts: rows.map((r) => this.toDomain(r)), total };
  }

  async findUpcoming(producerId: string, daysAhead: number): Promise<Debt[]> {
    const now = new Date();
    const future = new Date();
    future.setDate(future.getDate() + daysAhead);
    const rows = await this.prisma.debt.findMany({
      where: { producerId, status: 'PENDING', dueDate: { gte: now, lte: future } },
      orderBy: { dueDate: 'asc' },
    });
    return rows.map((r) => this.toDomain(r));
  }

  async findPossibleDuplicate(params: DuplicateCheckParams): Promise<Debt | null> {
    const { producerId, amount, dueDate, excludeId } = params;
    const tolerance = amount * 0.05;
    const dateTolerance = 15;
    const dateFrom = new Date(dueDate);
    dateFrom.setDate(dateFrom.getDate() - dateTolerance);
    const dateTo = new Date(dueDate);
    dateTo.setDate(dateTo.getDate() + dateTolerance);

    const row = await this.prisma.debt.findFirst({
      where: {
        producerId,
        status: { in: ['PENDING', 'OVERDUE'] },
        amount: { gte: amount - tolerance, lte: amount + tolerance },
        dueDate: { gte: dateFrom, lte: dateTo },
        ...(excludeId ? { NOT: { id: excludeId } } : {}),
      },
    });
    return row ? this.toDomain(row) : null;
  }

  async countByProducer(producerId: string): Promise<number> {
    return this.prisma.debt.count({ where: { producerId, status: { in: ['PENDING', 'OVERDUE'] } } });
  }

  async save(debt: Debt): Promise<Debt> {
    const row = await this.prisma.debt.upsert({
      where: { id: debt.id },
      create: {
        id: debt.id,
        producerId: debt.producerId,
        creditor: debt.creditor,
        amount: debt.amount,
        dueDate: debt.dueDate,
        description: debt.description,
        source: debt.source,
        status: debt.status,
        bankCode: debt.bankCode,
        contractNumber: debt.contractNumber,
        createdAt: debt.createdAt,
      },
      update: {
        creditor: debt.creditor,
        amount: debt.amount,
        dueDate: debt.dueDate,
        description: debt.description,
        status: debt.status,
      },
    });
    return this.toDomain(row);
  }

  async update(id: string, data: Partial<Pick<Debt, 'creditor' | 'amount' | 'dueDate' | 'description' | 'status'>>): Promise<Debt> {
    const row = await this.prisma.debt.update({ where: { id }, data });
    return this.toDomain(row);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.debt.delete({ where: { id } });
  }

  async markOverdue(): Promise<number> {
    const now = new Date();
    const { count } = await this.prisma.debt.updateMany({
      where: { status: 'PENDING', dueDate: { lt: now } },
      data: { status: 'OVERDUE' },
    });
    return count;
  }

  async getDashboard(producerId: string) {
    const now = new Date();
    const next7 = new Date();
    next7.setDate(next7.getDate() + 7);

    const [allDebts, upcoming, countByStatus] = await Promise.all([
      this.prisma.debt.findMany({ where: { producerId, status: { in: ['PENDING', 'OVERDUE'] } }, orderBy: { dueDate: 'asc' } }),
      this.prisma.debt.findMany({ where: { producerId, status: 'PENDING', dueDate: { gte: now, lte: next7 } }, orderBy: { dueDate: 'asc' }, take: 5 }),
      this.prisma.debt.groupBy({ by: ['status'], where: { producerId }, _count: { status: true } }),
    ]);

    const statusMap: Record<string, number> = {};
    countByStatus.forEach((r) => { statusMap[r.status] = r._count.status; });

    const overdueDebts = allDebts.filter((d) => d.status === 'OVERDUE');
    const pendingDebts = allDebts.filter((d) => d.status === 'PENDING');
    const totalOwed = allDebts.reduce((s, d) => s + Number(d.amount), 0);
    const overdueAmount = overdueDebts.reduce((s, d) => s + Number(d.amount), 0);
    const nextDue = pendingDebts[0] != null ? this.toDomain(pendingDebts[0]) : null;

    return {
      totalOwed,
      overdueCount: overdueDebts.length,
      overdueAmount,
      nextDue,
      upcomingDebts: upcoming.map((r) => this.toDomain(r)),
      countByStatus: statusMap,
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private toDomain(row: any): Debt {
    return new Debt({
      id: row.id as string,
      producerId: row.producerId as string,
      creditor: row.creditor as string,
      amount: Number(row.amount),
      dueDate: row.dueDate as Date,
      description: (row.description as string | null | undefined) ?? undefined,
      source: row.source as DebtSource,
      status: row.status as DebtStatus,
      bankCode: (row.bankCode as string | null | undefined) ?? undefined,
      contractNumber: (row.contractNumber as string | null | undefined) ?? undefined,
      createdAt: row.createdAt as Date,
    });
  }
}
