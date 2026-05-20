import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { INSTALLMENT_REPOSITORY, IInstallmentRepository } from '../../../domain/repositories/installment.repository.interface';

export interface RegisterPaymentInput {
  installmentId: string;
  dataPagamento: Date;
}

@Injectable()
export class RegisterPaymentUseCase {
  constructor(
    @Inject(INSTALLMENT_REPOSITORY)
    private readonly installmentRepo: IInstallmentRepository,
  ) {}

  async execute(input: RegisterPaymentInput): Promise<void> {
    const installment = await this.installmentRepo.findById(input.installmentId);

    if (!installment) {
      throw new NotFoundException(`Parcela ${input.installmentId} não encontrada`);
    }

    installment.registrarPagamento(input.dataPagamento);
    await this.installmentRepo.update(installment);
  }
}
