import { z } from 'zod';

export const createReviewSchema = z.object({
  body: z.object({
    product: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid Product ID'),
    order: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid Order ID'),
    rating: z.preprocess((val) => Number(val), z.number().int().min(1, 'Rating must be at least 1').max(5, 'Rating cannot exceed 5')),
    comment: z.string().min(5, 'Comment must be at least 5 characters'),
  }),
});
