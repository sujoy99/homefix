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
    photo_url: z.string().nullish(),
    latitude: z.number().min(-90).max(90).optional(),
    longitude: z.number().min(-180).max(180).optional(),
  }),
});

export const addSkillSchema = z.object({
  body: z.object({
    category_id: z.uuid(),
    is_primary: z.boolean().optional().default(false),
  }),
});

export const skillIdSchema = z.object({
  params: z.object({ skill_id: z.uuid() }),
});

export const providerUserIdSchema = z.object({
  params: z.object({ user_id: z.uuid() }),
});

export const listAvailableSchema = z.object({
  query: z.object({
    lat: z.coerce.number().min(-90).max(90).optional(),
    lon: z.coerce.number().min(-180).max(180).optional(),
    radius: z.coerce.number().positive().max(100).optional(),
    category: z.uuid().optional(),
  }).refine(
    (q) => (q.lat === undefined) === (q.lon === undefined),
    { message: 'lat and lon must both be provided or both omitted' }
  ),
});
