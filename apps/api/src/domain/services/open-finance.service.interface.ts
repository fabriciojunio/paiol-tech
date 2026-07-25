import type { RuralCreditLine } from '@paiol/types';

/**
 * Dívida normalizada vinda do banco via Open Finance, já traduzida para o
 * vocabulário do domínio (dívida rural). Todo provedor precisa devolver
 * esse formato, independente do fornecedor por trás.
 */
export interface BankDebt {
  contractNumber: string;
  creditor: string;
  amount: number;
  dueDate: Date;
  description?: string;
  bankCode: string;
  bankName: string;
  creditLine?: RuralCreditLine;
}

export interface OpenFinanceBank {
  code: string;
  name: string;
  isParticipant: boolean;
}

/**
 * Pedido de consentimento para conectar a conta de um banco.
 * O CPF/CNPJ nunca deve ser logado pelos adapters.
 */
export interface ConsentRequest {
  producerId: string;
  cpfCnpj: string;
  bankCode: string;
  /** Para onde o banco devolve o produtor depois de autorizar (fluxo real). */
  redirectUri?: string;
}

/**
 * Resultado do pedido de consentimento.
 *
 * - AUTHORIZED: consentimento já válido (mock/sandbox autoriza na hora).
 * - PENDING_AUTHORIZATION: o produtor precisa autorizar no ambiente do
 *   provedor/banco; `authorizationUrl` aponta para lá.
 */
export interface ConsentSession {
  consentId: string;
  status: 'AUTHORIZED' | 'PENDING_AUTHORIZATION';
  authorizationUrl?: string;
  expiresAt?: Date;
}

/**
 * Porta de Open Finance (Clean Architecture). O domínio só conhece esta
 * interface; Mock, Pluggy, TecnoSpeed ou qualquer outro fornecedor entram
 * como adapters em `infrastructure/open-finance`, escolhidos por variável
 * de ambiente na fábrica de provedores.
 */
export interface IOpenFinanceService {
  /** Nome do provedor ativo, para diagnóstico e auditoria. */
  readonly providerName: string;

  getAvailableBanks(): Promise<OpenFinanceBank[]>;

  /** Abre (ou renova) o consentimento do produtor com um banco. */
  createConsent(request: ConsentRequest): Promise<ConsentSession>;

  /**
   * Busca as dívidas/empréstimos do produtor no banco. `consentId` é
   * obrigatório nos provedores reais; o mock ignora.
   */
  fetchDebts(cpfCnpj: string, bankCode: string, consentId?: string): Promise<BankDebt[]>;
}

export const OPEN_FINANCE_SERVICE = Symbol('IOpenFinanceService');
