import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { v4 as uuid } from 'uuid';

export interface AuditEntry {
  producerId?: string;
  action: string;
  resource: string;
  resourceId?: string;
  metadata?: Record<string, unknown>;
  ip?: string;
}

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  async log(entry: AuditEntry): Promise<void> {
    await this.prisma.auditLog.create({
      data: {
        id: uuid(),
        producerId: entry.producerId,
        action: entry.action,
        resource: entry.resource,
        resourceId: entry.resourceId,
        metadata: entry.metadata as object | undefined,
        ip: entry.ip,
      },
    });
  }

  async findByProducer(producerId: string): Promise<
    { id: string; action: string; resource: string; resourceId: string | null; createdAt: Date }[]
  > {
    return this.prisma.auditLog.findMany({
      where: { producerId },
      orderBy: { createdAt: 'desc' },
      select: { id: true, action: true, resource: true, resourceId: true, createdAt: true },
    });
  }
}
