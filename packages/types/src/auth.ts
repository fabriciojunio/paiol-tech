export interface SendOtpRequest {
  phone: string;
}

export interface SendOtpResponse {
  message: string;
  expiresIn: number;
}

export interface VerifyOtpRequest {
  phone: string;
  code: string;
}

export interface AuthTokens {
  accessToken: string;
  expiresIn: number;
}

export interface JwtPayload {
  sub: string;
  phone: string;
  plan: string;
  role: string;
  iat?: number;
  exp?: number;
}

export interface AuthSession {
  id: string;
  producerId: string;
  refreshToken: string;
  expiresAt: Date;
  deviceInfo?: Record<string, unknown>;
}
