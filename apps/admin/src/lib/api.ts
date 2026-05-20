import type { DataProvider } from '@refinedev/core';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api';

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('admin_token');
}

function authHeaders(): Record<string, string> {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export const dataProvider: DataProvider = {
  getList: async ({ resource, pagination, filters, sorters }) => {
    const page = pagination?.current ?? 1;
    const limit = pagination?.pageSize ?? 20;
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });

    if (filters) {
      for (const f of filters) {
        if ('field' in f) params.set(f.field, String(f.value));
      }
    }
    if (sorters?.[0]) {
      params.set('sortBy', sorters[0].field);
      params.set('order', sorters[0].order);
    }

    const res = await fetch(`${API_URL}/${resource}?${params}`, { headers: authHeaders() });
    const json = await res.json() as { data: unknown[]; total: number };
    return { data: json.data as never[], total: json.total };
  },

  getOne: async ({ resource, id }) => {
    const res = await fetch(`${API_URL}/${resource}/${id}`, { headers: authHeaders() });
    const json = await res.json() as { data: unknown };
    return { data: json.data as never };
  },

  create: async ({ resource, variables }) => {
    const res = await fetch(`${API_URL}/${resource}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(variables),
    });
    const json = await res.json() as { data: unknown };
    return { data: json.data as never };
  },

  update: async ({ resource, id, variables }) => {
    const res = await fetch(`${API_URL}/${resource}/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(variables),
    });
    const json = await res.json() as { data: unknown };
    return { data: json.data as never };
  },

  deleteOne: async ({ resource, id }) => {
    await fetch(`${API_URL}/${resource}/${id}`, { method: 'DELETE', headers: authHeaders() });
    return { data: { id } as never };
  },

  getApiUrl: () => API_URL,
};

export const authProvider = {
  login: async ({ username, password }: { username: string; password: string }) => {
    const res = await fetch(`${API_URL}/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    if (!res.ok) return { success: false, error: { message: 'Credenciais inválidas' } };
    const { token } = await res.json() as { token: string };
    localStorage.setItem('admin_token', token);
    return { success: true, redirectTo: '/' };
  },

  logout: async () => {
    localStorage.removeItem('admin_token');
    return { success: true, redirectTo: '/login' };
  },

  check: async () => {
    const token = getToken();
    return token ? { authenticated: true } : { authenticated: false, redirectTo: '/login' };
  },

  getPermissions: async () => ({ role: 'admin' }),
  getIdentity: async () => ({ id: 'admin', name: 'Administrador Paiol' }),
  onError: async (error: unknown) => ({ error }),
};
