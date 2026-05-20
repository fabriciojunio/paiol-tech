import type { ApiError, ApiSuccess } from '@paiol/types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api';

let _accessToken: string | null = null;

export function setAccessToken(token: string | null): void {
  _accessToken = token;
}

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  body?: unknown;
  headers?: Record<string, string>;
};

class ApiClientError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = 'ApiClientError';
  }
}

function buildHeaders(extra?: Record<string, string>): Record<string, string> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json', ...extra };
  if (_accessToken) headers['Authorization'] = `Bearer ${_accessToken}`;
  return headers;
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const fetchOptions: RequestInit = {
    method: options.method ?? 'GET',
    headers: buildHeaders(options.headers),
    credentials: 'include',
  };
  if (options.body !== undefined) {
    fetchOptions.body = JSON.stringify(options.body);
  }
  const res = await fetch(`${API_BASE}${path}`, fetchOptions);

  const json = (await res.json()) as ApiSuccess<T> | ApiError;

  if (!res.ok) {
    const err = json as ApiError;
    throw new ApiClientError(
      err.error.code,
      err.error.message,
      err.error.details,
    );
  }

  return (json as ApiSuccess<T>).data;
}

async function requestRaw<T>(path: string, options: RequestOptions = {}): Promise<ApiSuccess<T>> {
  const fetchOptions: RequestInit = {
    method: options.method ?? 'GET',
    headers: buildHeaders(options.headers),
    credentials: 'include',
  };
  if (options.body !== undefined) {
    fetchOptions.body = JSON.stringify(options.body);
  }
  const res = await fetch(`${API_BASE}${path}`, fetchOptions);
  const json = (await res.json()) as ApiSuccess<T> | ApiError;

  if (!res.ok) {
    const err = json as ApiError;
    throw new ApiClientError(err.error.code, err.error.message, err.error.details);
  }

  return json as ApiSuccess<T>;
}

export const apiClient = {
  get: <T>(path: string) => request<T>(path),
  getRaw: <T>(path: string) => requestRaw<T>(path),
  post: <T>(path: string, body: unknown) => request<T>(path, { method: 'POST', body }),
  put: <T>(path: string, body: unknown) => request<T>(path, { method: 'PUT', body }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
};

export { ApiClientError };
