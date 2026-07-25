import { afterEach, describe, expect, it, vi } from 'vitest';
import { apiClient, ApiClientError } from './api-client';

const jsonResponse = (body: unknown, status = 200) =>
  ({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(body),
  }) as Response;

const noContentResponse = () =>
  ({
    ok: true,
    status: 204,
    json: () => Promise.reject(new SyntaxError('Unexpected end of JSON input')),
  }) as Response;

describe('apiClient', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('desembrulha o campo data das respostas de sucesso', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse({ data: { totalOwed: 1500 } })));
    const result = await apiClient.get<{ totalOwed: number }>('/debts/dashboard');
    expect(result.totalOwed).toBe(1500);
  });

  it('não tenta ler JSON em resposta 204 (DELETE)', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(noContentResponse()));
    await expect(apiClient.delete('/open-finance/connections/abc')).resolves.toBeUndefined();
  });

  it('converte erro da API em ApiClientError com código', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        jsonResponse({ error: { code: 'PREMIUM_FEATURE', message: 'Recurso do plano pago' } }, 403),
      ),
    );
    await expect(apiClient.post('/open-finance/connect', { bankCode: '001' })).rejects.toMatchObject({
      name: 'ApiClientError',
      code: 'PREMIUM_FEATURE',
    });
  });

  it('expõe ApiClientError para checagem com instanceof', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(jsonResponse({ error: { code: 'X', message: 'erro' } }, 400)),
    );
    try {
      await apiClient.get('/debts');
      expect.unreachable();
    } catch (err) {
      expect(err).toBeInstanceOf(ApiClientError);
    }
  });
});
