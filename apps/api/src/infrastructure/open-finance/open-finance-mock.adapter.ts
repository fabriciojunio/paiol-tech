import { Injectable } from '@nestjs/common';
import type { IOpenFinanceService, BankDebt } from '../../domain/services/open-finance.service.interface';

const MOCK_BANKS = [
  { code: '001', name: 'Banco do Brasil', isParticipant: true },
  { code: '033', name: 'Banco Santander', isParticipant: true },
  { code: '104', name: 'Caixa Econômica Federal', isParticipant: true },
  { code: '237', name: 'Bradesco', isParticipant: true },
  { code: '341', name: 'Itaú Unibanco', isParticipant: true },
  { code: '748', name: 'Sicredi', isParticipant: true },
  { code: '756', name: 'Sicoob', isParticipant: true },
  { code: '422', name: 'Banco Safra', isParticipant: true },
];

@Injectable()
export class OpenFinanceMockAdapter implements IOpenFinanceService {
  async getAvailableBanks() {
    return MOCK_BANKS;
  }

  async fetchDebts(_cpfCnpj: string, bankCode: string): Promise<BankDebt[]> {
    const bank = MOCK_BANKS.find((b) => b.code === bankCode);
    const bankName = bank?.name ?? 'Banco Desconhecido';

    const now = new Date();
    return [
      {
        contractNumber: `OF-${bankCode}-001`,
        creditor: bankName,
        amount: 5400.0,
        dueDate: new Date(now.getFullYear(), now.getMonth() + 1, 15),
        description: 'Financiamento rural — parcela 6/24',
        bankCode,
        bankName,
      },
      {
        contractNumber: `OF-${bankCode}-002`,
        creditor: bankName,
        amount: 12800.0,
        dueDate: new Date(now.getFullYear(), now.getMonth() + 2, 10),
        description: 'Custeio safra 2024/2025',
        bankCode,
        bankName,
      },
    ];
  }
}
