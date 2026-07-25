export type OpenFinanceConnectionStatus =
  | 'ACTIVE'
  | 'PENDING_AUTHORIZATION'
  | 'EXPIRED'
  | 'REVOKED';

export interface OpenFinanceConnectionRecord {
  id: string;
  producerId: string;
  bankCode: string;
  bankName: string;
  consentId?: string;
  status: OpenFinanceConnectionStatus;
  lastSyncAt?: Date;
  expiresAt?: Date;
  createdAt: Date;
}

export interface IOpenFinanceRepository {
  findById(id: string): Promise<OpenFinanceConnectionRecord | null>;
  findByProducer(producerId: string): Promise<OpenFinanceConnectionRecord[]>;
  findByProducerAndBank(producerId: string, bankCode: string): Promise<OpenFinanceConnectionRecord | null>;
  save(record: Omit<OpenFinanceConnectionRecord, 'createdAt'> & { createdAt?: Date }): Promise<OpenFinanceConnectionRecord>;
  updateLastSync(id: string): Promise<void>;
  revoke(id: string): Promise<void>;
}

export const OPEN_FINANCE_REPOSITORY = Symbol('IOpenFinanceRepository');
