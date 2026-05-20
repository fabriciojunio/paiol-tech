import { z } from 'zod';

export const phoneSchema = z
  .string()
  .regex(/^\+55[1-9]{2}[9]?[0-9]{8}$/, 'Número de celular inválido. Use o formato +5511999999999');

export const otpCodeSchema = z
  .string()
  .length(4, 'O código deve ter 4 dígitos')
  .regex(/^\d{4}$/, 'O código deve conter apenas números');

export const sendOtpSchema = z.object({
  phone: phoneSchema,
});

export const verifyOtpSchema = z.object({
  phone: phoneSchema,
  code: otpCodeSchema,
});

export type SendOtpInput = z.infer<typeof sendOtpSchema>;
export type VerifyOtpInput = z.infer<typeof verifyOtpSchema>;
