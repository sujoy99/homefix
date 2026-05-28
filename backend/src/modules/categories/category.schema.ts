import { z } from 'zod';

const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const createCategorySchema = z.object({
  body: z.object({
    name: z.string().min(2).max(100),
    name_bn: z.string().max(150).nullish(),
    slug: z.string().min(2).max(120).regex(slugRegex, 'Slug must be lowercase alphanumeric with hyphens'),
    description: z.string().max(500).nullish(),
    icon_url: z.url().nullish(),
    requires_area: z.boolean().optional().default(false),
    sort_order: z.number().int().min(0).optional().default(0),
  }),
});

export const updateCategorySchema = z.object({
  params: z.object({ id: z.uuid() }),
  body: z.object({
    name: z.string().min(2).max(100).optional(),
    name_bn: z.string().max(150).nullish(),
    slug: z.string().min(2).max(120).regex(slugRegex, 'Slug must be lowercase alphanumeric with hyphens').optional(),
    description: z.string().max(500).nullish(),
    icon_url: z.url().nullish(),
    requires_area: z.boolean().optional(),
    is_active: z.boolean().optional(),
    sort_order: z.number().int().min(0).optional(),
  }),
});

export const categoryIdSchema = z.object({
  params: z.object({ id: z.uuid() }),
});
