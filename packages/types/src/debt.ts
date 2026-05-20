export type DebtStatus = 'PENDING' | 'PAID' | 'OVERDUE' | 'RENEGOTIATED';
export type DebtSource = 'OPEN_FINANCE' | 'MANUAL' | 'VOICE' | 'OCR';

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
