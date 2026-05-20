export interface BankDebt {
  contractNumber: string;
  creditor: string;
  amount: number;
  dueDate: Date;
  description?: string;
  bankCode: string;
  bankName: string;
}

export interface IOpenFinanceService {
  getAvailableBanks(): Promise<{ code: string; name: string; isParticipant: boolean }[]>;
  fetchDebts(cpfCnpj: string, bankCode: string): Promise<BankDebt[]>;
}

export const OPEN_FINANCE_SERVICE = Symbol('IOpenFinanceService');
