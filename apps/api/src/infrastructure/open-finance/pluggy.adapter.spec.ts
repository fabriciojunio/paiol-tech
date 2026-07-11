import { ConfigService } from '@nestjs/config';
import { PluggyAdapter } from './pluggy.adapter';

const makeConfig = (values: Record<string, string | undefined> = {}) =>
  ({
    get: (key: string) => values[key],
    getOrThrow: (key: string) => {
      const v = values[key];
      if (v === undefined) throw new Error(`Config ${key} ausente`);
      return v;
    },
  }) as unknown as ConfigService;

const BASE_CONFIG = {
  PLUGGY_CLIENT_ID: 'client-id',
  PLUGGY_CLIENT_SECRET: 'client-secret',
};

type FetchMock = jest.Mock<Promise<Response>, [string | URL, RequestInit?]>;

const jsonResponse = (body: unknown, status = 200): Response =>
  ({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(body),
  }) as unknown as Response;

describe('PluggyAdapter', () => {
  let fetchMock: FetchMock;

  beforeEach(() => {
    fetchMock = jest.fn();
    global.fetch = fetchMock as unknown as typeof fetch;
  });

  const mockAuth = () => fetchMock.mockResolvedValueOnce(jsonResponse({ apiKey: 'api-key-1' }));

  it('exige credenciais na construção', () => {
    expect(() => new PluggyAdapter(makeConfig({}))).toThrow('PLUGGY_CLIENT_ID');
  });

  it('autentica e lista bancos participantes', async () => {
    mockAuth();
    fetchMock.mockResolvedValueOnce(
      jsonResponse({ results: [{ id: 201, name: 'Itaú', type: 'PERSONAL_BANK' }] }),
    );

    const adapter = new PluggyAdapter(makeConfig(BASE_CONFIG));
    const banks = await adapter.getAvailableBanks();

    expect(banks).toEqual([{ code: '201', name: 'Itaú', isParticipant: true }]);
    const [authUrl, authInit] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(authUrl).toBe('https://api.pluggy.ai/auth');
    expect(JSON.parse(authInit.body as string)).toEqual({ clientId: 'client-id', clientSecret: 'client-secret' });
  });

  it('reutiliza a apiKey em cache entre chamadas', async () => {
    mockAuth();
    fetchMock.mockResolvedValue(jsonResponse({ results: [] }));

    const adapter = new PluggyAdapter(makeConfig(BASE_CONFIG));
    await adapter.getAvailableBanks();
    await adapter.getAvailableBanks();

    const authCalls = fetchMock.mock.calls.filter(([url]) => String(url).endsWith('/auth'));
    expect(authCalls).toHaveLength(1);
  });

  it('cria consentimento pendente com URL do widget de autorização', async () => {
    mockAuth();
    fetchMock.mockResolvedValueOnce(jsonResponse({ accessToken: 'connect-token-1' }));

    const adapter = new PluggyAdapter(makeConfig(BASE_CONFIG));
    const consent = await adapter.createConsent({
      producerId: 'prod-1',
      cpfCnpj: '123.456.789-09',
      bankCode: '201',
    });

    expect(consent.status).toBe('PENDING_AUTHORIZATION');
    expect(consent.consentId).toBe('connect-token-1');
    expect(consent.authorizationUrl).toContain('connect_token=connect-token-1');
    expect(consent.authorizationUrl).toContain('connector_id=201');
  });

  it('não envia CPF/CNPJ na criação do connect token', async () => {
    mockAuth();
    fetchMock.mockResolvedValueOnce(jsonResponse({ accessToken: 'connect-token-1' }));

    const adapter = new PluggyAdapter(makeConfig(BASE_CONFIG));
    await adapter.createConsent({ producerId: 'prod-1', cpfCnpj: '123.456.789-09', bankCode: '201' });

    const [, init] = fetchMock.mock.calls[1] as [string, RequestInit];
    expect(init.body as string).not.toContain('123.456.789-09');
  });

  it('busca empréstimos e normaliza para dívida rural com linha de crédito', async () => {
    mockAuth();
    fetchMock.mockImplementation((url) => {
      const u = String(url);
      if (u.includes('/loans')) {
        return Promise.resolve(
          jsonResponse({
            results: [
              {
                id: 'loan-1',
                contractNumber: 'CT-123',
                productName: 'Crédito Rural Pronaf Custeio',
                outstandingBalance: 15000.5,
                dueDate: '2026-09-10T00:00:00.000Z',
              },
              {
                id: 'loan-sem-vencimento',
                productName: 'Empréstimo sem data',
                outstandingBalance: 1000,
              },
            ],
          }),
        );
      }
      if (u.includes('/connectors/')) {
        return Promise.resolve(jsonResponse({ id: 201, name: 'Itaú', type: 'PERSONAL_BANK' }));
      }
      return Promise.resolve(jsonResponse({}, 404));
    });

    const adapter = new PluggyAdapter(makeConfig(BASE_CONFIG));
    const debts = await adapter.fetchDebts('123.456.789-09', '201', 'item-1');

    expect(debts).toHaveLength(1);
    expect(debts[0]).toMatchObject({
      contractNumber: 'CT-123',
      creditor: 'Itaú',
      amount: 15000.5,
      bankCode: '201',
      bankName: 'Itaú',
      creditLine: 'PRONAF',
    });
    expect(debts[0]?.dueDate).toBeInstanceOf(Date);
  });

  it('recusa sincronizar sem consentimento concluído', async () => {
    const adapter = new PluggyAdapter(makeConfig(BASE_CONFIG));
    await expect(adapter.fetchDebts('123.456.789-09', '201')).rejects.toThrow('Consentimento pendente');
  });

  it('propaga erro com status, sem vazar corpo da resposta', async () => {
    mockAuth();
    fetchMock.mockResolvedValueOnce(jsonResponse({ detalhes: 'dados sensíveis' }, 500));

    const adapter = new PluggyAdapter(makeConfig(BASE_CONFIG));
    await expect(adapter.getAvailableBanks()).rejects.toThrow('Pluggy error: 500');
  });
});
