export interface ApiSuccess<T> {
  data: T;
  meta?: ApiMeta;
}

export interface ApiMeta {
  page: number;
  total: number;
  limit: number;
  totalPages: number;
}

export interface ApiError {
  error: {
    code: ApiErrorCode;
    message: string;
    details?: unknown;
  };
}

export type ApiErrorCode =
  | 'DUPLICATE_DEBT'
  | 'PLAN_LIMIT_REACHED'
  | 'OPEN_FINANCE_CONSENT_EXPIRED'
  | 'OTP_INVALID'
  | 'OTP_MAX_ATTEMPTS'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'VALIDATION_ERROR'
  | 'INTERNAL_ERROR';

export interface PaginationQuery {
  page?: number;
  limit?: number;
}
