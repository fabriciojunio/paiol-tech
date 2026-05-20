import { Inject, Injectable } from '@nestjs/common';
import { INSTALLMENT_REPOSITORY, IInstallmentRepository } from '../../../domain/repositories/installment.repository.interface';
import { Installment } from '../../../domain/entities/installment.entity';

export interface ListOverdueInput {
  producerId: string;
  taxaMensalPadrao?: number;
}

export interface OverdueInstallmentDTO {
  id: string;
  debtId: string;
  numero: number;
  valor: number;
  dataVencimento: Date;
  jurosEstimados: number;
  totalDevido: number;
}

@Injectable()
export class ListOverdueUseCase {
  constructor(
    @Inject(INSTALLMENT_REPOSITORY)
    private readonly installmentRepo: IInstallmentRepository,
  ) {}

  async execute({ producerId, taxaMensalPadrao = 0.02 }: ListOverdueInput): Promise<OverdueInstallmentDTO[]> {
    const parcelas = await this.installmentRepo.findVencidasByProducerId(producerId);

    return parcelas
      .filter((p) => p.estaVencida())
      .map((p) => this.toDTO(p, taxaMensalPadrao));
  }

  private toDTO(p: Installment, taxa: number): OverdueInstallmentDTO {
    const juros = p.calcularJuros(taxa);
    return {
      id: p.id,
      debtId: p.debtId,
      numero: p.numero,
      valor: p.valor,
      dataVencimento: p.dataVencimento,
      jurosEstimados: Math.round(juros * 100) / 100,
      totalDevido: Math.round((p.valor + juros) * 100) / 100,
    };
  }
}
