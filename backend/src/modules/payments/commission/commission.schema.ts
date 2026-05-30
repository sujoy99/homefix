import { z } from 'zod';
import { CommissionRuleScope } from '@homefix/shared';

export const createCommissionRuleSchema = z.object({
  body: z
    .object({
      scope: z.nativeEnum(CommissionRuleScope),
      rate: z.number().min(0).max(1),
      label: z.string().min(1).max(100),
      category_id: z.string().uuid().optional(),
      valid_from: z.string().datetime().optional(),
      valid_until: z.string().datetime().optional(),
    })
    .refine(
      (data) =>
        data.scope === CommissionRuleScope.GLOBAL || !!data.category_id,
      { message: 'category_id is required for category and promotion rules', path: ['category_id'] }
    )
    .refine(
      (data) =>
        data.scope !== CommissionRuleScope.PROMOTION ||
        (!!data.valid_from && !!data.valid_until),
      { message: 'valid_from and valid_until are required for promotion rules', path: ['valid_from'] }
    ),
});

export const patchCommissionRuleSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
  body: z.object({
    label: z.string().min(1).max(100).optional(),
    rate: z.number().min(0).max(1).optional(),
    valid_from: z.string().datetime().nullable().optional(),
    valid_until: z.string().datetime().nullable().optional(),
  }),
});

export const commissionRuleIdSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
});

export const previewCommissionSchema = z.object({
  query: z.object({
    category_id: z.string().uuid().optional(),
    date: z.string().datetime().optional(),
  }),
});

export type CreateCommissionRuleBody = z.infer<typeof createCommissionRuleSchema>['body'];
export type PatchCommissionRuleBody = z.infer<typeof patchCommissionRuleSchema>['body'];
export type PreviewCommissionQuery = z.infer<typeof previewCommissionSchema>['query'];
