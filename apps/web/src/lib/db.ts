import Dexie, { type EntityTable } from 'dexie';

export interface OfflineDebt {
  id: string;
  creditor: string;
  amount: number;
  dueDate: string;
  description?: string;
  source: 'MANUAL' | 'VOICE' | 'OCR';
  createdAt: string;
  synced: boolean;
}

export interface OfflineAction {
  id: string;
  type: 'CREATE_DEBT' | 'MARK_PAID' | 'DELETE_DEBT';
  payload: Record<string, unknown>;
  createdAt: string;
  retries: number;
}

class PaiolDB extends Dexie {
  debts!: EntityTable<OfflineDebt, 'id'>;
  actions!: EntityTable<OfflineAction, 'id'>;

  constructor() {
    super('paiol-db');
    this.version(1).stores({
      debts: 'id, creditor, dueDate, synced',
      actions: 'id, type, createdAt',
    });
  }
}

export const db = typeof window !== 'undefined' ? new PaiolDB() : null;
