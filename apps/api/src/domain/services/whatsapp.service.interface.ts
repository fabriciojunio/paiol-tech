export interface IWhatsAppService {
  sendOtp(phone: string, code: string): Promise<void>;
  sendAlert(phone: string, message: string): Promise<void>;
  sendMessage(phone: string, message: string): Promise<void>;
}

export const WHATSAPP_SERVICE = Symbol('IWhatsAppService');
