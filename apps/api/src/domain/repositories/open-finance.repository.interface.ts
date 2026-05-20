export interface OpenFinanceConnectionRecord {
  id: string;
  producerId: string;
  bankCode: string;
  bankName: string;
  consentId?: string;
  status: 'ACTIVE' | 'EXPIRED' | 'REVOKED';
  lastSyncAt?: Date;
  expiresAt?: Date;
  createdAt: Date;
}

export interface IOpenFinanceRepository {
  findByProducer(producerId: string): Promise<OpenFinanceConnectionRecord[]>;
  findByProducerAndBank(producerId: string, bankCode: string): Promise<OpenFinanceConnectionRecord | null>;
  save(record: Omit<OpenFinanceConnectionRecord, 'createdAt'> & { createdAt?: Date }): Promise<OpenFinanceConnectionRecord>;
  updateLastSync(id: string): Promise<void>;
  revoke(id: string): Promise<void>;
}

export const OPEN_FINANCE_REPOSITORY = Symbol('IOpenFinanceRepository');
