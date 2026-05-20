import { z } from 'zod';

export const cpfCnpjSchema = z
  .string()
  .regex(/^(\d{11}|\d{14})$/, 'CPF deve ter 11 dígitos ou CNPJ deve ter 14 dígitos')
  .optional();

export const updateProducerSchema = z.object({
  name: z.string().min(2).max(200).optional(),
  cpfCnpj: cpfCnpjSchema,
});

export type UpdateProducerInput = z.infer<typeof updateProducerSchema>;
