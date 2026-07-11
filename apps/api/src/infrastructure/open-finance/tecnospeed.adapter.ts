import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { detectCreditLine } from '@paiol/utils';
import type {
  IOpenFinanceService,
  BankDebt,
  ConsentRequest,
  ConsentSession,
  OpenFinanceBank,
} from '../../domain/services/open-finance.service.interface';

/**
 * Adapter do agregador TecnoSpeed. Mantido por compatibilidade; ativado
 * pela fábrica de provedores quando OPEN_FINANCE_PROVIDER=tecnospeed.
 */
@Injectable()
export class TecnoSpeedAdapter implements IOpenFinanceService {
  readonly providerName = 'tecnospeed';

  private readonly baseUrl: string;
  private readonly apiKey: string;

  constructor(private readonly config: ConfigService) {
    this.baseUrl = config.getOrThrow('TECNOSPEED_BASE_URL');
    this.apiKey = config.getOrThrow('TECNOSPEED_API_KEY');
  }

  async getAvailableBanks(): Promise<OpenFinanceBank[]> {
    const res = await fetch(`${this.baseUrl}/banks`, {
      headers: { Authorization: `Bearer ${this.apiKey}` },
    });
    if (!res.ok) throw new Error(`TecnoSpeed error: ${res.status}`);
    const data = (await res.json()) as { code: string; name: string; participant: boolean }[];
    return data.map((b) => ({ code: b.code, name: b.name, isParticipant: b.participant }));
  }

  async createConsent(request: ConsentRequest): Promise<ConsentSession> {
    const res = await fetch(`${this.baseUrl}/open-finance/consents`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        cpfCnpj: request.cpfCnpj,
        bankCode: request.bankCode,
        redirectUri: request.redirectUri,
      }),
    });
    if (!res.ok) throw new Error(`TecnoSpeed error: ${res.status}`);
    const data = (await res.json()) as {
      consentId: string;
      authorizationUrl?: string;
      expiresAt?: string;
    };
    return {
      consentId: data.consentId,
      status: data.authorizationUrl ? 'PENDING_AUTHORIZATION' : 'AUTHORIZED',
      authorizationUrl: data.authorizationUrl,
      expiresAt: data.expiresAt ? new Date(data.expiresAt) : undefined,
    };
  }

  async fetchDebts(cpfCnpj: string, bankCode: string, consentId?: string): Promise<BankDebt[]> {
    const res = await fetch(`${this.baseUrl}/open-finance/debts`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ cpfCnpj, bankCode, consentId }),
    });
    if (!res.ok) throw new Error(`TecnoSpeed error: ${res.status}`);
    const data = (await res.json()) as {
      contractNumber: string;
      creditor: string;
      amount: number;
      dueDate: string;
      description?: string;
      bankCode: string;
      bankName: string;
    }[];
    return data.map((d) => ({
      ...d,
      dueDate: new Date(d.dueDate),
      creditLine: detectCreditLine(d.description),
    }));
  }
}
