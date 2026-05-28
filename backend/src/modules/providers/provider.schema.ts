import { z } from 'zod';

export const createProviderProfileSchema = z.object({
  body: z.object({
    bio: z.string().max(1000).nullish(),
    experience_years: z.number().int().min(0).max(50).optional().default(0),
    hourly_rate: z.number().positive().nullish(),
    is_available: z.boolean().optional().default(true),
  }),
});

export const updateProviderProfileSchema = z.object({
  body: z.object({
    bio: z.string().max(1000).nullish(),
    experience_years: z.number().int().min(0).max(50).optional(),
    hourly_rate: z.number().positive().nullish(),
    is_available: z.boolean().optional(),
  }),
});

export const addSkillSchema = z.object({
  body: z.object({
    category_id: z.string().uuid(),
    is_primary: z.boolean().optional().default(false),
  }),
});

export const skillIdSchema = z.object({
  params: z.object({ skill_id: z.string().uuid() }),
});

export const providerUserIdSchema = z.object({
  params: z.object({ user_id: z.string().uuid() }),
});
