import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { IOpenFinanceService, BankDebt } from '../../domain/services/open-finance.service.interface';

@Injectable()
export class TecnoSpeedAdapter implements IOpenFinanceService {
  private readonly baseUrl: string;
  private readonly apiKey: string;

  constructor(private readonly config: ConfigService) {
    this.baseUrl = config.getOrThrow('TECNOSPEED_BASE_URL');
    this.apiKey = config.getOrThrow('TECNOSPEED_API_KEY');
  }

  async getAvailableBanks(): Promise<{ code: string; name: string; isParticipant: boolean }[]> {
    const res = await fetch(`${this.baseUrl}/banks`, {
      headers: { Authorization: `Bearer ${this.apiKey}` },
    });
    if (!res.ok) throw new Error(`TecnoSpeed error: ${res.status}`);
    const data = (await res.json()) as { code: string; name: string; participant: boolean }[];
    return data.map((b) => ({ code: b.code, name: b.name, isParticipant: b.participant }));
  }

  async fetchDebts(cpfCnpj: string, bankCode: string): Promise<BankDebt[]> {
    const res = await fetch(`${this.baseUrl}/open-finance/debts`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ cpfCnpj, bankCode }),
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
    return data.map((d) => ({ ...d, dueDate: new Date(d.dueDate) }));
  }
}
