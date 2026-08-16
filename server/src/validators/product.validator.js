import { z } from 'zod';

export const createProductSchema = z.object({
  body: z.object({
    name: z.string().min(3, 'Product name must be at least 3 characters'),
    description: z.string().min(10, 'Description must be at least 10 characters'),
    category: z.string().min(1, 'Category is required'),
    price: z.preprocess((val) => Number(val), z.number().min(0, 'Price must be positive')),
    compareAtPrice: z.preprocess((val) => Number(val || 0), z.number().min(0).optional()),
    stock: z.preprocess((val) => Number(val), z.number().int().min(0, 'Stock must be positive integer')),
    sku: z.string().min(3, 'SKU must be at least 3 characters'),
    isFeatured: z.preprocess((val) => val === 'true' || val === true, z.boolean()).optional(),
  }),
});

export const updateProductSchema = z.object({
  body: z.object({
    name: z.string().min(3, 'Product name must be at least 3 characters').optional(),
    description: z.string().min(10, 'Description must be at least 10 characters').optional(),
    category: z.string().optional(),
    price: z.preprocess((val) => (val !== undefined ? Number(val) : undefined), z.number().min(0).optional()),
    compareAtPrice: z.preprocess((val) => (val !== undefined ? Number(val) : undefined), z.number().min(0).optional()),
    stock: z.preprocess((val) => (val !== undefined ? Number(val) : undefined), z.number().int().min(0).optional()),
    sku: z.string().optional(),
    isFeatured: z.preprocess((val) => val === 'true' || val === true, z.boolean()).optional(),
    isActive: z.preprocess((val) => val === 'true' || val === true, z.boolean()).optional(),
  }),
});
