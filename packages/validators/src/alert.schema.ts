import { z } from 'zod';

export const alertDaysBeforeSchema = z.union([
  z.literal(1),
  z.literal(3),
  z.literal(5),
  z.literal(7),
  z.literal(15),
]);

export const updateAlertSchema = z.object({
  daysBefore: alertDaysBeforeSchema.optional(),
  type: z.enum(['WHATSAPP', 'SMS', 'EMAIL']).optional(),
});

export type UpdateAlertInput = z.infer<typeof updateAlertSchema>;
