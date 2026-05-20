import { SendOtpHandler } from './send-otp.handler';
import { SendOtpCommand } from './send-otp.command';

const makeOtpService = () => ({
  generate: jest.fn().mockResolvedValue('4321'),
});
const makeWhatsapp = () => ({
  sendOtp: jest.fn().mockResolvedValue(undefined),
  sendMessage: jest.fn(),
});

describe('SendOtpHandler', () => {
  it('gera OTP e envia via WhatsApp', async () => {
    const otp = makeOtpService();
    const whatsapp = makeWhatsapp();
    const handler = new SendOtpHandler(whatsapp as never, otp as never);
    const result = await handler.execute(new SendOtpCommand('+5511987654321'));
    expect(otp.generate).toHaveBeenCalledWith('+5511987654321');
    expect(whatsapp.sendOtp).toHaveBeenCalledWith('+5511987654321', '4321');
    expect(result.expiresIn).toBe(300);
  });

  it('propaga erro se OTP service lança', async () => {
    const otp = { generate: jest.fn().mockRejectedValue(new Error('max attempts')) };
    const handler = new SendOtpHandler(makeWhatsapp() as never, otp as never);
    await expect(handler.execute(new SendOtpCommand('+5511987654321'))).rejects.toThrow('max attempts');
  });
});
