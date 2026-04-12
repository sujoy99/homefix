import { z } from 'zod';

/**
 * Resident Registration Schema
 */
export const registerResidentSchema = z.object({
  full_name: z.string().min(3),
  mobile: z.string().min(11),
  nid: z.string().min(10),
  latitude: z.number(),
  longitude: z.number(),
});

/**
 * Provider Registration Schema
 */
export const registerProviderSchema = z.object({
  full_name: z.string().min(3),
  mobile: z.string().min(11),
  nid: z.string().min(10),
  latitude: z.number(),
  longitude: z.number(),
});
