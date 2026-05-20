import { BadRequestException } from '@nestjs/common';
import { OtpService } from './otp.service';

const makePrisma = (recentCount = 0) => ({
  otpSession: {
    count: jest.fn().mockResolvedValue(recentCount),
    create: jest.fn().mockResolvedValue({ id: 'sess-1', code: '1234' }),
    findFirst: jest.fn().mockResolvedValue(null),
    update: jest.fn(),
  },
});

describe('OtpService', () => {
  describe('generate()', () => {
    it('gera um código OTP de 4 dígitos', async () => {
      const prisma = makePrisma(0);
      const service = new OtpService(prisma as never);
      const code = await service.generate('+5511987654321');
      expect(code).toMatch(/^\d{4}$/);
      expect(prisma.otpSession.create).toHaveBeenCalled();
    });

    it('lança OTP_MAX_ATTEMPTS quando há 3+ tentativas na última hora', async () => {
      const prisma = makePrisma(3);
      const service = new OtpService(prisma as never);
      await expect(service.generate('+5511987654321')).rejects.toThrow(BadRequestException);
      expect(prisma.otpSession.create).not.toHaveBeenCalled();
    });

    it('permite gerar OTP com exatamente 2 tentativas anteriores', async () => {
      const prisma = makePrisma(2);
      const service = new OtpService(prisma as never);
      const code = await service.generate('+5511987654321');
      expect(code).toMatch(/^\d{4}$/);
    });
  });

  describe('verify()', () => {
    it('retorna false quando não há sessão válida', async () => {
      const prisma = makePrisma();
      const service = new OtpService(prisma as never);
      const result = await service.verify('+5511987654321', '1234');
      expect(result).toBe(false);
    });

    it('retorna true e marca sessão como usada', async () => {
      const session = { id: 'sess-1', phone: '+5511987654321', code: '1234', used: false };
      const prisma = {
        otpSession: {
          count: jest.fn().mockResolvedValue(0),
          create: jest.fn(),
          findFirst: jest.fn().mockResolvedValue(session),
          update: jest.fn().mockResolvedValue({ ...session, used: true }),
        },
      };
      const service = new OtpService(prisma as never);
      const result = await service.verify('+5511987654321', '1234');
      expect(result).toBe(true);
      expect(prisma.otpSession.update).toHaveBeenCalledWith({
        where: { id: 'sess-1' },
        data: { used: true },
      });
    });
  });
});
