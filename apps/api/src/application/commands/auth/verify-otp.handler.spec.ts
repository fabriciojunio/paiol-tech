import { UnauthorizedException } from '@nestjs/common';
import { VerifyOtpHandler } from './verify-otp.handler';
import { VerifyOtpCommand } from './verify-otp.command';
import { Producer } from '../../../domain/entities/producer.entity';

const makeProducer = () =>
  new Producer({ id: 'prod-1', phone: '+5511987654321', plan: 'basic', createdAt: new Date() });

const makeOtpService = (valid: boolean) => ({
  generate: jest.fn(),
  verify: jest.fn().mockResolvedValue(valid),
});

const makeTokenService = () => ({
  generatePair: jest.fn().mockResolvedValue({ accessToken: 'tok', refreshToken: 'ref', expiresIn: 900 }),
});

const makeProducerRepo = (existing: Producer | null = null) => ({
  findById: jest.fn(),
  findByPhone: jest.fn().mockResolvedValue(existing),
  save: jest.fn().mockImplementation((p: Producer) => Promise.resolve(p)),
  update: jest.fn(),
  delete: jest.fn(),
});

describe('VerifyOtpHandler', () => {
  it('lança UnauthorizedException com OTP inválido', async () => {
    const handler = new VerifyOtpHandler(
      makeOtpService(false) as never,
      makeTokenService() as never,
      makeProducerRepo(),
    );
    await expect(handler.execute(new VerifyOtpCommand('+5511987654321', '0000'))).rejects.toThrow(UnauthorizedException);
  });

  it('retorna token para produtor já existente', async () => {
    const producer = makeProducer();
    const tokenService = makeTokenService();
    const handler = new VerifyOtpHandler(
      makeOtpService(true) as never,
      tokenService as never,
      makeProducerRepo(producer),
    );
    const result = await handler.execute(new VerifyOtpCommand('+5511987654321', '1234'));
    expect(result.accessToken).toBe('tok');
    expect(tokenService.generatePair).toHaveBeenCalledWith(producer);
  });

  it('cria novo produtor quando não existe e retorna token', async () => {
    const repo = makeProducerRepo(null);
    const tokenService = makeTokenService();
    const handler = new VerifyOtpHandler(
      makeOtpService(true) as never,
      tokenService as never,
      repo,
    );
    await handler.execute(new VerifyOtpCommand('+5511987654321', '1234'));
    expect(repo.save).toHaveBeenCalled();
    const savedProducer = (repo.save as jest.Mock).mock.calls[0]?.[0] as Producer;
    expect(savedProducer.phone).toBe('+5511987654321');
    expect(savedProducer.plan).toBe('basic');
  });
});
