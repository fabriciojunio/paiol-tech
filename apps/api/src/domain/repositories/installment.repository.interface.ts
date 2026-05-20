import { Installment } from '../entities/installment.entity';

export interface IInstallmentRepository {
  findById(id: string): Promise<Installment | null>;
  findByDebtId(debtId: string): Promise<Installment[]>;
  findVencidasByProducerId(producerId: string): Promise<Installment[]>;
  save(installment: Installment): Promise<void>;
  saveMany(installments: Installment[]): Promise<void>;
  update(installment: Installment): Promise<void>;
}

export const INSTALLMENT_REPOSITORY = Symbol('IInstallmentRepository');
