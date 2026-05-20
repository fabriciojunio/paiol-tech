import { z } from 'zod';

export const debtSourceSchema = z.enum(['OPEN_FINANCE', 'MANUAL', 'VOICE', 'OCR']);
export const debtStatusSchema = z.enum(['PENDING', 'PAID', 'OVERDUE', 'RENEGOTIATED']);

export const createDebtSchema = z.object({
  creditor: z.string().min(1, 'Nome do credor é obrigatório').max(200),
  amount: z.number().positive('O valor deve ser maior que zero'),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data inválida. Use o formato AAAA-MM-DD'),
  description: z.string().max(500).optional(),
  source: debtSourceSchema,
  bankCode: z.string().optional(),
  contractNumber: z.string().optional(),
});

export const updateDebtSchema = z.object({
  creditor: z.string().min(1).max(200).optional(),
  amount: z.number().positive().optional(),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  description: z.string().max(500).optional(),
  status: debtStatusSchema.optional(),
});

export const voiceInputSchema = z.object({
  transcript: z.string().min(5, 'Transcrição muito curta').max(1000),
});

export type CreateDebtInput = z.infer<typeof createDebtSchema>;
export type UpdateDebtInput = z.infer<typeof updateDebtSchema>;
export type VoiceInput = z.infer<typeof voiceInputSchema>;
