import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { detectCreditLine } from '@paiol/utils';
import type {
  IOpenFinanceService,
  BankDebt,
  ConsentRequest,
  ConsentSession,
  OpenFinanceBank,
} from '../../domain/services/open-finance.service.interface';

const MOCK_BANKS: OpenFinanceBank[] = [
  { code: '001', name: 'Banco do Brasil', isParticipant: true },
  { code: '033', name: 'Banco Santander', isParticipant: true },
  { code: '104', name: 'Caixa Econômica Federal', isParticipant: true },
  { code: '237', name: 'Bradesco', isParticipant: true },
  { code: '341', name: 'Itaú Unibanco', isParticipant: true },
  { code: '748', name: 'Sicredi', isParticipant: true },
  { code: '756', name: 'Sicoob', isParticipant: true },
  { code: '422', name: 'Banco Safra', isParticipant: true },
];

/**
 * Provedor de desenvolvimento e do plano grátis: sem custo, sem rede,
 * autoriza consentimento na hora e devolve dívidas rurais de exemplo.
 */
@Injectable()
export class OpenFinanceMockAdapter implements IOpenFinanceService {
  readonly providerName = 'mock';

  async getAvailableBanks(): Promise<OpenFinanceBank[]> {
    return MOCK_BANKS;
  }

  async createConsent(request: ConsentRequest): Promise<ConsentSession> {
    const expiresAt = new Date();
    expiresAt.setFullYear(expiresAt.getFullYear() + 1);
    return {
      consentId: `mock-consent-${request.bankCode}-${randomUUID()}`,
      status: 'AUTHORIZED',
      expiresAt,
    };
  }

  async fetchDebts(_cpfCnpj: string, bankCode: string, _consentId?: string): Promise<BankDebt[]> {
    const bank = MOCK_BANKS.find((b) => b.code === bankCode);
    const bankName = bank?.name ?? 'Banco Desconhecido';

    const now = new Date();
    const samples = [
      {
        contractNumber: `OF-${bankCode}-001`,
        creditor: bankName,
        amount: 5400.0,
        dueDate: new Date(now.getFullYear(), now.getMonth() + 1, 15),
        description: 'Financiamento rural Pronaf, parcela 6/24',
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

    return samples.map((s) => ({ ...s, creditLine: detectCreditLine(s.description) }));
  }
}
