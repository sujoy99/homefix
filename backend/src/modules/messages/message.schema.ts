import { z } from 'zod';

export const sendMessageSchema = z.object({
  params: z.object({
    id: z.string().uuid('Job ID must be a valid UUID'),
  }),
  body: z.object({
    content: z.string().min(1, 'Message content cannot be empty').max(2000),
    type: z.enum(['text', 'image']).optional().default('text'),
  }),
});

export const listMessagesSchema = z.object({
  params: z.object({
    id: z.string().uuid('Job ID must be a valid UUID'),
  }),
  query: z.object({
    limit: z.coerce.number().int().min(1).max(100).optional().default(50),
    before: z.string().uuid().optional(),
  }),
});
