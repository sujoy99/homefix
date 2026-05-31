import { z } from 'zod';
import { PaymentMethod, REQUIRES_TRANSACTION_ID } from '@homefix/shared';

const TXID_REGEX = /^[a-zA-Z0-9]{8,20}$/;

export const createPaymentSchema = z.object({
  body: z
    .object({
      job_id: z.string().uuid(),
      method: z.nativeEnum(PaymentMethod),
      transaction_id: z
        .string()
        .regex(TXID_REGEX, 'Transaction ID must be alphanumeric, 8–20 characters')
        .optional(),
      amount_paisa: z.number().int().positive(),
    })
    .refine(
      (data) => !REQUIRES_TRANSACTION_ID.has(data.method) || !!data.transaction_id,
      {
        message: 'transaction_id is required for bKash, Nagad, and bank_transfer payments',
        path: ['transaction_id'],
      }
    ),
});

export const paymentIdSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
});
