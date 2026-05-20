import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import type { IProducerRepository } from '../../domain/repositories/producer.repository.interface';
import { Producer } from '../../domain/entities/producer.entity';
import type { ProducerPlan } from '@paiol/types';

@Injectable()
export class PrismaProducerRepository implements IProducerRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<Producer | null> {
    const row = await this.prisma.producer.findUnique({ where: { id } });
    return row ? this.toDomain(row) : null;
  }

  async findByPhone(phone: string): Promise<Producer | null> {
    const row = await this.prisma.producer.findUnique({ where: { phone } });
    return row ? this.toDomain(row) : null;
  }

  async save(producer: Producer): Promise<Producer> {
    const row = await this.prisma.producer.upsert({
      where: { id: producer.id },
      create: {
        id: producer.id,
        phone: producer.phone,
        name: producer.name,
        cpfCnpj: producer.cpfCnpj,
        cooperativeId: producer.cooperativeId,
        plan: producer.plan,
        createdAt: producer.createdAt,
      },
      update: {
        name: producer.name,
        cpfCnpj: producer.cpfCnpj,
        plan: producer.plan,
      },
    });
    return this.toDomain(row);
  }

  async update(id: string, data: Partial<Pick<Producer, 'name' | 'cpfCnpj' | 'plan'>>): Promise<Producer> {
    const row = await this.prisma.producer.update({ where: { id }, data });
    return this.toDomain(row);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.producer.delete({ where: { id } });
  }

  private toDomain(row: { id: string; phone: string; name: string | null; cpfCnpj: string | null; cooperativeId: string | null; plan: string; createdAt: Date }): Producer {
    return new Producer({
      id: row.id,
      phone: row.phone,
      name: row.name ?? undefined,
      cpfCnpj: row.cpfCnpj ?? undefined,
      cooperativeId: row.cooperativeId ?? undefined,
      plan: row.plan as ProducerPlan,
      createdAt: row.createdAt,
    });
  }
}
