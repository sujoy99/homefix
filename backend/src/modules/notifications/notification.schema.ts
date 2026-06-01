import { z } from 'zod';

export const registerDeviceTokenSchema = z.object({
  body: z.object({
    token: z.string().min(1).max(512),
    platform: z.enum(['android', 'ios', 'web']),
  }),
});

export const listNotificationsSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(50).default(20),
  }),
});

export const markReadSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
});
