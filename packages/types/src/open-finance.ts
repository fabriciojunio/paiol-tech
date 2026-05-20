export type OpenFinanceStatus = 'ACTIVE' | 'EXPIRED' | 'REVOKED';

export interface OpenFinanceConnection {
  id: string;
  producerId: string;
  bankCode: string;
  bankName: string;
  consentId?: string;
  status: OpenFinanceStatus;
  lastSyncAt?: Date;
  expiresAt?: Date;
}

export interface Bank {
  code: string;
  name: string;
  logoUrl?: string;
  isParticipant: boolean;
}

export interface ConnectBankRequest {
  bankCode: string;
}

export interface ConnectBankResponse {
  authorizationUrl: string;
  consentId: string;
}
