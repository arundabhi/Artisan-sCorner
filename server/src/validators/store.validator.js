import { z } from 'zod';

export const createStoreSchema = z.object({
  body: z.object({
    name: z.string().min(3, 'Store name must be at least 3 characters'),
    description: z.string().min(10, 'Description must be at least 10 characters'),
    phone: z.string().min(5, 'Please enter a valid phone number'),
    address: z.object({
      street: z.string().min(1, 'Street is required'),
      city: z.string().min(1, 'City is required'),
      state: z.string().min(1, 'State is required'),
      postalCode: z.string().min(1, 'Postal code is required'),
      country: z.string().min(1, 'Country is required'),
    }),
  }),
});

export const updateStoreSchema = z.object({
  body: z.object({
    name: z.string().min(3, 'Store name must be at least 3 characters').optional(),
    description: z.string().min(10, 'Description must be at least 10 characters').optional(),
    phone: z.string().min(5, 'Please enter a valid phone number').optional(),
    address: z.object({
      street: z.string().optional(),
      city: z.string().optional(),
      state: z.string().optional(),
      postalCode: z.string().optional(),
      country: z.string().optional(),
    }).optional(),
    status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
  }),
});
