import { z } from 'zod';

export const createListingSchema = z.object({
  body: z.object({
    title: z.string().min(3).max(120),
    description: z.string().min(10).max(2000),
    produceType: z.string().min(2).max(60),
    unit: z.enum(['kg', 'quintal', 'tonne', 'crate', 'bag']),
    pricePerUnit: z.number().positive(),
    quantityAvailable: z.number().positive(),
    poolId: z.string().min(3).max(32),
    region: z.string().min(2).max(80).optional(),
    images: z.array(z.string().url()).max(6).optional(),
  }),
});

export const updateListingSchema = z.object({
  body: createListingSchema.shape.body.partial().extend({
    status: z.enum(['draft', 'active', 'sold', 'archived']).optional(),
  }),
  params: z.object({ id: z.string().min(1) }),
});

export const listQuerySchema = z.object({
  query: z.object({
    search: z.string().max(120).optional(),
    produceType: z.string().max(60).optional(),
    region: z.string().max(80).optional(),
    minPrice: z.coerce.number().nonnegative().optional(),
    maxPrice: z.coerce.number().positive().optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(50).default(20),
  }),
});
