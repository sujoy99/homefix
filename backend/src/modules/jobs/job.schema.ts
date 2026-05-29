import { z } from 'zod';

const serviceAddressSchema = z.object({
  house: z.string().min(1).max(100),
  flat: z.string().max(50).optional(),
  road: z.string().min(1).max(150),
  area: z.string().min(1).max(150),
});

export const createJobSchema = z.object({
  body: z.object({
    category_id: z.uuid(),
    description: z.string().min(10).max(2000),
    service_address: serviceAddressSchema,
    title: z.string().max(200).optional(),
    media_urls: z.array(z.string()).max(10).optional(),
    service_lat: z.number().min(-90).max(90).optional(),
    service_lon: z.number().min(-180).max(180).optional(),
    estimated_budget: z.number().positive().optional(),
    square_footage: z.number().positive().optional(),
  }),
});

export const jobIdSchema = z.object({
  params: z.object({ id: z.uuid() }),
});

export const jobFeedSchema = z.object({
  query: z.object({
    limit: z.coerce.number().int().min(1).max(50).optional().default(20),
    cursor: z.string().optional(),
    lat: z.coerce.number().min(-90).max(90).optional(),
    lon: z.coerce.number().min(-180).max(180).optional(),
  }),
});
