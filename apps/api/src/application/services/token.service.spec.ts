import { TokenService } from './token.service';
import { Producer } from '../../domain/entities/producer.entity';

const makeProducer = () =>
  new Producer({ id: 'prod-1', phone: '+5511987654321', plan: 'professional', createdAt: new Date() });

const makeJwt = () => ({
  sign: jest.fn().mockReturnValue('signed-token'),
  verify: jest.fn().mockReturnValue({ sub: 'prod-1' }),
});

const makeConfig = (secret = 'refresh-secret') => ({
  getOrThrow: jest.fn().mockReturnValue(secret),
});

const makePrisma = (session: { id: string; producerId: string; refreshToken: string; expiresAt: Date } | null = null) => ({
  authSession: {
    create: jest.fn().mockResolvedValue({}),
    findUnique: jest.fn().mockResolvedValue(session),
    deleteMany: jest.fn().mockResolvedValue({ count: 1 }),
  },
  producer: {
    findUnique: jest.fn().mockResolvedValue({ id: 'prod-1', phone: '+5511987654321', plan: 'professional' }),
  },
});

describe('TokenService', () => {
  describe('generatePair()', () => {
    it('retorna par de tokens e persiste sessão', async () => {
      const prisma = makePrisma();
      const jwt = makeJwt();
      const service = new TokenService(jwt as never, makeConfig() as never, prisma as never);
      const result = await service.generatePair(makeProducer());
      expect(result.accessToken).toBe('signed-token');
      expect(result.refreshToken).toBe('signed-token');
      expect(result.expiresIn).toBe(900);
      expect(prisma.authSession.create).toHaveBeenCalled();
    });

    it('chama jwt.sign duas vezes (access + refresh)', async () => {
      const jwt = makeJwt();
      const service = new TokenService(jwt as never, makeConfig() as never, makePrisma() as never);
      await service.generatePair(makeProducer());
      expect(jwt.sign).toHaveBeenCalledTimes(2);
    });
  });

  describe('refreshAccessToken()', () => {
    it('retorna novo access token com sessão válida', async () => {
      const futureDate = new Date(Date.now() + 3600 * 1000);
      const session = { id: 'sess-1', producerId: 'prod-1', refreshToken: 'refresh-tok', expiresAt: futureDate };
      const jwt = makeJwt();
      const service = new TokenService(jwt as never, makeConfig() as never, makePrisma(session) as never);
      const result = await service.refreshAccessToken('refresh-tok');
      expect(result.accessToken).toBe('signed-token');
      expect(result.expiresIn).toBe(900);
    });

    it('lança erro quando token JWT é inválido', async () => {
      const jwt = { sign: jest.fn(), verify: jest.fn().mockImplementation(() => { throw new Error('invalid'); }) };
      const service = new TokenService(jwt as never, makeConfig() as never, makePrisma() as never);
      await expect(service.refreshAccessToken('bad-token')).rejects.toThrow('Token inválido ou expirado');
    });

    it('lança erro quando sessão não existe no banco', async () => {
      const jwt = makeJwt();
      const service = new TokenService(jwt as never, makeConfig() as never, makePrisma(null) as never);
      await expect(service.refreshAccessToken('some-token')).rejects.toThrow('Sessão expirada');
    });

    it('lança erro quando sessão está expirada', async () => {
      const pastDate = new Date(Date.now() - 1000);
      const session = { id: 'sess-1', producerId: 'prod-1', refreshToken: 'tok', expiresAt: pastDate };
      const jwt = makeJwt();
      const service = new TokenService(jwt as never, makeConfig() as never, makePrisma(session) as never);
      await expect(service.refreshAccessToken('tok')).rejects.toThrow('Sessão expirada');
    });
  });

  describe('invalidateSession()', () => {
    it('deleta sessão do banco', async () => {
      const prisma = makePrisma();
      const service = new TokenService(makeJwt() as never, makeConfig() as never, prisma as never);
      await service.invalidateSession('refresh-tok');
      expect(prisma.authSession.deleteMany).toHaveBeenCalledWith({ where: { refreshToken: 'refresh-tok' } });
    });
  });
});
