export type DebtStatus = 'PENDING' | 'PAID' | 'OVERDUE' | 'RENEGOTIATED';
export type DebtSource = 'OPEN_FINANCE' | 'MANUAL' | 'VOICE' | 'OCR';

/**
 * Linhas de crédito rural mais comuns no Brasil. Usadas para o produtor
 * reconhecer a dívida de cara ("essa é a do Pronaf") e para relatórios
 * por safra.
 */
export type RuralCreditLine =
  | 'PRONAF'
  | 'PRONAMP'
  | 'CUSTEIO'
  | 'INVESTIMENTO'
  | 'COMERCIALIZACAO'
  | 'CPR'
  | 'OUTRA';

export interface Debt {
  id: string;
  producerId: string;
  creditor: string;
  amount: number;
  dueDate: Date;
  description?: string;
  source: DebtSource;
  status: DebtStatus;
  bankCode?: string;
  contractNumber?: string;
  creditLine?: RuralCreditLine;
  createdAt: Date;
}

export interface CreateDebtDto {
  creditor: string;
  amount: number;
  dueDate: string;
  description?: string;
  source: DebtSource;
  bankCode?: string;
  contractNumber?: string;
  creditLine?: RuralCreditLine;
}

export interface UpdateDebtDto {
  creditor?: string;
  amount?: number;
  dueDate?: string;
  description?: string;
  status?: DebtStatus;
}

export interface DebtFilters {
  status?: DebtStatus;
  creditor?: string;
  dueDateFrom?: string;
  dueDateTo?: string;
}

export interface PossibleDuplicate {
  id: string;
  creditor: string;
  amount: number;
  dueDate: Date;
}
