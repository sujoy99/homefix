import { z } from 'zod';

export const revenueDashboardSchema = z.object({
  query: z.object({
    period: z.enum(['daily', 'monthly']).optional().default('monthly'),
    from: z.string().datetime().optional(),
    to: z.string().datetime().optional(),
  }),
});

export const revenueJobsSchema = z.object({
  query: z.object({
    cursor: z.string().optional(),
    limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  }),
});

export type RevenueDashboardQuery = z.infer<typeof revenueDashboardSchema>['query'];
export type RevenueJobsQuery = z.infer<typeof revenueJobsSchema>['query'];
