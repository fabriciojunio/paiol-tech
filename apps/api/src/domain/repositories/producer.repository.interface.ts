import type { Producer } from '../entities/producer.entity';

export interface IProducerRepository {
  findById(id: string): Promise<Producer | null>;
  findByPhone(phone: string): Promise<Producer | null>;
  save(producer: Producer): Promise<Producer>;
  update(id: string, data: Partial<Pick<Producer, 'name' | 'cpfCnpj' | 'plan'>>): Promise<Producer>;
  delete(id: string): Promise<void>;
}

export const PRODUCER_REPOSITORY = Symbol('IProducerRepository');
