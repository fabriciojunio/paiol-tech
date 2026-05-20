export type AlertType = 'WHATSAPP' | 'SMS' | 'EMAIL';
export type AlertStatus = 'PENDING' | 'SENT' | 'FAILED';

export interface Alert {
  id: string;
  producerId: string;
  debtId: string;
  type: AlertType;
  daysBefore: number;
  sentAt?: Date;
  status: AlertStatus;
}

export interface UpdateAlertDto {
  daysBefore?: number;
  type?: AlertType;
}

export const ALERT_DAYS_OPTIONS = [1, 3, 5, 7, 15] as const;
export type AlertDaysBefore = (typeof ALERT_DAYS_OPTIONS)[number];
