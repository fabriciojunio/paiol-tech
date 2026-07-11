import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { detectCreditLine } from '@paiol/utils';
import type {
  IOpenFinanceService,
  BankDebt,
  ConsentRequest,
  ConsentSession,
  OpenFinanceBank,
} from '../../domain/services/open-finance.service.interface';

interface PluggyConnector {
  id: number;
  name: string;
  type: string;
}

interface PluggyLoan {
  id: string;
  contractNumber?: string;
  productName?: string;
  description?: string;
  outstandingBalance?: number;
  principalAmount?: number;
  contractAmount?: number;
  dueDate?: string;
  maturityDate?: string;
}

/** Margem de segurança: a apiKey da Pluggy vale 2h; renovamos antes. */
const API_KEY_TTL_MS = 100 * 60 * 1000;

/**
 * Adapter do agregador Pluggy (https://docs.pluggy.ai). Desligado por
 * padrão; a fábrica de provedores só o instancia quando
 * OPEN_FINANCE_PROVIDER=pluggy e as credenciais estão presentes.
 *
 * Fluxo real de consentimento: o produtor autoriza no Pluggy Connect
 * (widget) apontado por `authorizationUrl`; o item criado lá vira o
 * `consentId` usado nas buscas seguintes. Detalhes em docs/open-finance.md.
 *
 * Nunca logar CPF/CNPJ nem dados de contrato: este adapter só registra
 * códigos de status.
 */
@Injectable()
export class PluggyAdapter implements IOpenFinanceService {
  readonly providerName = 'pluggy';

  private readonly logger = new Logger(PluggyAdapter.name);
  private readonly baseUrl: string;
  private readonly connectUrl: string;
  private readonly clientId: string;
  private readonly clientSecret: string;

  private cachedApiKey: { value: string; expiresAt: number } | null = null;
  private apiKeyInFlight: Promise<string> | null = null;

  constructor(config: ConfigService) {
    this.clientId = config.getOrThrow('PLUGGY_CLIENT_ID');
    this.clientSecret = config.getOrThrow('PLUGGY_CLIENT_SECRET');
    this.baseUrl = config.get('PLUGGY_BASE_URL') ?? 'https://api.pluggy.ai';
    this.connectUrl = config.get('PLUGGY_CONNECT_URL') ?? 'https://connect.pluggy.ai';
  }

  async getAvailableBanks(): Promise<OpenFinanceBank[]> {
    const data = await this.request<{ results: PluggyConnector[] }>(
      'GET',
      '/connectors?countries=BR&types=PERSONAL_BANK,BUSINESS_BANK',
    );
    return data.results.map((c) => ({
      code: String(c.id),
      name: c.name,
      isParticipant: true,
    }));
  }

  async createConsent(request: ConsentRequest): Promise<ConsentSession> {
    const data = await this.request<{ accessToken: string }>('POST', '/connect_token', {
      options: { clientUserId: request.producerId },
    });

    // O token do Pluggy Connect vale 30 minutos.
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000);
    const url = new URL(this.connectUrl);
    url.searchParams.set('connect_token', data.accessToken);
    url.searchParams.set('connector_id', request.bankCode);

    return {
      consentId: data.accessToken,
      status: 'PENDING_AUTHORIZATION',
      authorizationUrl: url.toString(),
      expiresAt,
    };
  }

  async fetchDebts(_cpfCnpj: string, bankCode: string, consentId?: string): Promise<BankDebt[]> {
    if (!consentId) {
      throw new Error(
        'Consentimento pendente: conclua a autorização no banco antes de sincronizar.',
      );
    }

    const [loans, bankName] = await Promise.all([
      this.request<{ results: PluggyLoan[] }>(
        'GET',
        `/loans?itemId=${encodeURIComponent(consentId)}`,
      ),
      this.resolveBankName(bankCode),
    ]);

    const debts: BankDebt[] = [];
    for (const loan of loans.results) {
      const dueDateRaw = loan.dueDate ?? loan.maturityDate;
      const amount = loan.outstandingBalance ?? loan.principalAmount ?? loan.contractAmount;
      if (!dueDateRaw || !amount || amount <= 0) continue;

      const description = loan.productName ?? loan.description;
      debts.push({
        contractNumber: loan.contractNumber ?? loan.id,
        creditor: bankName,
        amount,
        dueDate: new Date(dueDateRaw),
        description,
        bankCode,
        bankName,
        creditLine: detectCreditLine(`${loan.productName ?? ''} ${loan.description ?? ''}`),
      });
    }
    return debts;
  }

  private async resolveBankName(bankCode: string): Promise<string> {
    try {
      const connector = await this.request<PluggyConnector>(
        'GET',
        `/connectors/${encodeURIComponent(bankCode)}`,
      );
      return connector.name;
    } catch {
      return 'Banco conectado';
    }
  }

  private getApiKey(): Promise<string> {
    if (this.cachedApiKey && this.cachedApiKey.expiresAt > Date.now()) {
      return Promise.resolve(this.cachedApiKey.value);
    }
    // Deduplica chamadas concorrentes: uma única autenticação em voo.
    if (!this.apiKeyInFlight) {
      this.apiKeyInFlight = this.authenticate().finally(() => {
        this.apiKeyInFlight = null;
      });
    }
    return this.apiKeyInFlight;
  }

  private async authenticate(): Promise<string> {
    const res = await fetch(`${this.baseUrl}/auth`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clientId: this.clientId, clientSecret: this.clientSecret }),
    });
    if (!res.ok) {
      this.logger.error(`Falha na autenticação com o provedor Pluggy (status ${res.status})`);
      throw new Error(`Pluggy auth error: ${res.status}`);
    }
    const data = (await res.json()) as { apiKey: string };
    this.cachedApiKey = { value: data.apiKey, expiresAt: Date.now() + API_KEY_TTL_MS };
    return data.apiKey;
  }

  private async request<T>(method: 'GET' | 'POST', path: string, body?: unknown): Promise<T> {
    const apiKey = await this.getApiKey();
    const res = await fetch(`${this.baseUrl}${path}`, {
      method,
      headers: {
        'X-API-KEY': apiKey,
        'Content-Type': 'application/json',
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    if (!res.ok) {
      // Nunca incluir corpo da resposta no log: pode conter dados financeiros.
      this.logger.error(`Pluggy respondeu ${res.status} em ${method} ${path.split('?')[0]}`);
      throw new Error(`Pluggy error: ${res.status}`);
    }
    return (await res.json()) as T;
  }
}
