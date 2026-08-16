import { z } from 'zod';

export const checkoutSchema = z.object({
  body: z.object({
    shippingAddress: z.object({
      street: z.string().min(1, 'Street address is required'),
      city: z.string().min(1, 'City is required'),
      state: z.string().min(1, 'State/Province is required'),
      postalCode: z.string().min(1, 'Postal code is required'),
      country: z.string().min(1, 'Country is required'),
      phone: z.string().min(5, 'Contact phone number is required'),
    }),
  }),
});
