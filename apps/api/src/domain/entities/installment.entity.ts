import { randomUUID } from 'crypto';

export type InstallmentStatus = 'PENDENTE' | 'PAGO' | 'VENCIDO' | 'RENEGOCIADO';

export interface InstallmentProps {
  id?: string;
  debtId: string;
  numero: number;
  valor: number;
  dataVencimento: Date;
  dataPagamento?: Date;
  status: InstallmentStatus;
  jurosAcumulados?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export class Installment {
  private props: Required<Omit<InstallmentProps, 'dataPagamento' | 'jurosAcumulados'>> &
    Pick<InstallmentProps, 'dataPagamento' | 'jurosAcumulados'>;

  constructor(props: InstallmentProps) {
    this.props = {
      id: props.id ?? randomUUID(),
      debtId: props.debtId,
      numero: props.numero,
      valor: props.valor,
      dataVencimento: props.dataVencimento,
      dataPagamento: props.dataPagamento,
      status: props.status,
      jurosAcumulados: props.jurosAcumulados ?? 0,
      createdAt: props.createdAt ?? new Date(),
      updatedAt: props.updatedAt ?? new Date(),
    };
  }

  get id() { return this.props.id; }
  get debtId() { return this.props.debtId; }
  get numero() { return this.props.numero; }
  get valor() { return this.props.valor; }
  get dataVencimento() { return this.props.dataVencimento; }
  get status() { return this.props.status; }
  get jurosAcumulados() { return this.props.jurosAcumulados; }

  estaVencida(): boolean {
    return this.props.status === 'PENDENTE' && new Date() > this.props.dataVencimento;
  }

  registrarPagamento(dataPagamento: Date): void {
    if (this.props.status === 'PAGO') throw new Error('Parcela já foi paga');
    this.props.dataPagamento = dataPagamento;
    this.props.status = 'PAGO';
    this.props.updatedAt = new Date();
  }

  calcularJuros(taxaMensal: number): number {
    if (!this.estaVencida()) return 0;
    const diasAtraso = Math.floor(
      (Date.now() - this.props.dataVencimento.getTime()) / 86_400_000
    );
    const mesesAtraso = diasAtraso / 30;
    return this.props.valor * Math.pow(1 + taxaMensal, mesesAtraso) - this.props.valor;
  }

  toPlainObject(): InstallmentProps {
    return { ...this.props };
  }
}
