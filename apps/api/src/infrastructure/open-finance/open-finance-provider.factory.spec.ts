import { ConfigService } from '@nestjs/config';
import { createOpenFinanceProvider } from './open-finance-provider.factory';
import { OpenFinanceMockAdapter } from './open-finance-mock.adapter';
import { PluggyAdapter } from './pluggy.adapter';
import { TecnoSpeedAdapter } from './tecnospeed.adapter';

const makeConfig = (values: Record<string, string | undefined> = {}) =>
  ({
    get: (key: string) => values[key],
    getOrThrow: (key: string) => {
      const v = values[key];
      if (v === undefined) throw new Error(`Config ${key} ausente`);
      return v;
    },
  }) as unknown as ConfigService;

describe('createOpenFinanceProvider', () => {
  it('usa o mock por padrão (grátis, sem fornecedor)', () => {
    const provider = createOpenFinanceProvider(makeConfig({}));
    expect(provider).toBeInstanceOf(OpenFinanceMockAdapter);
    expect(provider.providerName).toBe('mock');
  });

  it('usa o mock em produção quando nenhum provedor foi contratado', () => {
    const provider = createOpenFinanceProvider(makeConfig({ NODE_ENV: 'production' }));
    expect(provider).toBeInstanceOf(OpenFinanceMockAdapter);
  });

  it('ativa a Pluggy quando selecionada com credenciais', () => {
    const provider = createOpenFinanceProvider(
      makeConfig({
        OPEN_FINANCE_PROVIDER: 'pluggy',
        PLUGGY_CLIENT_ID: 'id',
        PLUGGY_CLIENT_SECRET: 'secret',
      }),
    );
    expect(provider).toBeInstanceOf(PluggyAdapter);
    expect(provider.providerName).toBe('pluggy');
  });

  it('derruba o boot se Pluggy for selecionada sem credenciais', () => {
    expect(() => createOpenFinanceProvider(makeConfig({ OPEN_FINANCE_PROVIDER: 'pluggy' }))).toThrow(
      'PLUGGY_CLIENT_ID',
    );
  });

  it('ativa a TecnoSpeed quando selecionada com credenciais', () => {
    const provider = createOpenFinanceProvider(
      makeConfig({
        OPEN_FINANCE_PROVIDER: 'tecnospeed',
        TECNOSPEED_API_KEY: 'key',
        TECNOSPEED_BASE_URL: 'https://api.tecnospeed.com.br',
      }),
    );
    expect(provider).toBeInstanceOf(TecnoSpeedAdapter);
  });

  it('mantém compatibilidade: produção com chave TecnoSpeed e sem seleção explícita', () => {
    const provider = createOpenFinanceProvider(
      makeConfig({
        NODE_ENV: 'production',
        TECNOSPEED_API_KEY: 'key',
        TECNOSPEED_BASE_URL: 'https://api.tecnospeed.com.br',
      }),
    );
    expect(provider).toBeInstanceOf(TecnoSpeedAdapter);
  });

  it('rejeita provedor desconhecido', () => {
    expect(() => createOpenFinanceProvider(makeConfig({ OPEN_FINANCE_PROVIDER: 'belvo' }))).toThrow(
      'não é suportado',
    );
  });
});
