import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { IOpenFinanceService } from '../../domain/services/open-finance.service.interface';
import { OpenFinanceMockAdapter } from './open-finance-mock.adapter';
import { PluggyAdapter } from './pluggy.adapter';
import { TecnoSpeedAdapter } from './tecnospeed.adapter';

const logger = new Logger('OpenFinanceProviderFactory');

/**
 * Escolhe o provedor de Open Finance por variável de ambiente.
 *
 * OPEN_FINANCE_PROVIDER:
 * - "mock" (padrão): grátis, sem rede, para desenvolvimento e para o plano
 *   grátis enquanto a agregação automática não é contratada.
 * - "pluggy": agregador real, exige PLUGGY_CLIENT_ID e PLUGGY_CLIENT_SECRET.
 * - "tecnospeed": agregador real, exige TECNOSPEED_API_KEY.
 *
 * Provedor real sem credencial derruba o boot de propósito: melhor falhar
 * cedo do que subir achando que sincroniza banco de verdade.
 *
 * Para plugar Belvo, Klavi ou outro fornecedor: criar um adapter que
 * implemente IOpenFinanceService e registrar um case novo aqui. O domínio
 * não muda. Ver docs/open-finance.md.
 */
export function createOpenFinanceProvider(config: ConfigService): IOpenFinanceService {
  const explicit = config.get<string>('OPEN_FINANCE_PROVIDER')?.trim().toLowerCase();

  // Compatibilidade com a configuração anterior: produção com chave da
  // TecnoSpeed e sem provedor explícito continua usando a TecnoSpeed.
  const provider =
    explicit ||
    (config.get('NODE_ENV') === 'production' && config.get('TECNOSPEED_API_KEY')
      ? 'tecnospeed'
      : 'mock');

  switch (provider) {
    case 'pluggy': {
      if (!config.get('PLUGGY_CLIENT_ID') || !config.get('PLUGGY_CLIENT_SECRET')) {
        throw new Error(
          'OPEN_FINANCE_PROVIDER=pluggy exige PLUGGY_CLIENT_ID e PLUGGY_CLIENT_SECRET.',
        );
      }
      logger.log('Open Finance: provedor Pluggy ativo');
      return new PluggyAdapter(config);
    }
    case 'tecnospeed': {
      if (!config.get('TECNOSPEED_API_KEY')) {
        throw new Error('OPEN_FINANCE_PROVIDER=tecnospeed exige TECNOSPEED_API_KEY.');
      }
      logger.log('Open Finance: provedor TecnoSpeed ativo');
      return new TecnoSpeedAdapter(config);
    }
    case 'mock': {
      if (config.get('NODE_ENV') === 'production') {
        logger.warn('Open Finance: provedor mock ativo em produção (modo grátis/lançamento)');
      }
      return new OpenFinanceMockAdapter();
    }
    default:
      throw new Error(
        `OPEN_FINANCE_PROVIDER="${provider}" não é suportado. Use mock, pluggy ou tecnospeed.`,
      );
  }
}
