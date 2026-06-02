import { z } from 'zod';

export const createReviewSchema = z.object({
  params: z.object({
    jobId: z.string().uuid(),
  }),
  body: z.object({
    rating: z.number().int().min(1).max(5),
    comment: z.string().max(1000).optional(),
  }),
});

export const listProviderReviewsSchema = z.object({
  params: z.object({
    providerId: z.string().uuid(),
  }),
  query: z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(50).default(10),
  }),
});
