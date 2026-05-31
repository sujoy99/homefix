import { z } from 'zod';
import { MfsType } from '@homefix/shared';

export const requestWithdrawalSchema = z.object({
  body: z.object({
    amount_paisa: z.number().int().positive(),
  }),
});

export const walletTransactionsCursorSchema = z.object({
  query: z.object({
    cursor: z.string().datetime().optional(),
  }),
});

export const createMfsAccountSchema = z.object({
  body: z.object({
    mfs_type: z.nativeEnum(MfsType),
    account_number: z.string().min(1).max(30),
    account_name: z.string().min(1).max(100),
    is_primary: z.boolean().optional(),
  }),
});

export const mfsAccountIdSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
});

export const completeWithdrawalSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
  body: z.object({
    amount_sent_paisa: z.number().int().positive(),
    sent_at: z.string().datetime(),
    admin_txid: z.string().min(1).max(100),
    admin_note: z.string().max(500).optional(),
  }),
});

export const rejectWithdrawalSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
  body: z.object({
    admin_note: z.string().min(1).max(500),
  }),
});

export type RequestWithdrawalBody = z.infer<typeof requestWithdrawalSchema>['body'];
export type CreateMfsAccountBody = z.infer<typeof createMfsAccountSchema>['body'];
export type CompleteWithdrawalBody = z.infer<typeof completeWithdrawalSchema>['body'];
export type RejectWithdrawalBody = z.infer<typeof rejectWithdrawalSchema>['body'];
