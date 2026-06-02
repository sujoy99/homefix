import { z } from 'zod';

export const createRoomSchema = z.object({
  params: z.object({
    id: z.string().uuid('Job ID must be a valid UUID'),
  }),
});
