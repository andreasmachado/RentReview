import { z } from 'zod';

export const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1, 'Password is required'),
});

export const updateProfileSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  city: z.string().max(100).optional(),
  bio: z.string().max(500).optional(),
});

export const createPropertySchema = z.object({
  address: z.string().min(5, 'Address must be at least 5 characters').max(200),
  city: z.string().min(2).max(100),
  postcode: z.string().max(20).optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  propertyType: z.enum(['apartment', 'house', 'studio', 'room', 'other']).default('apartment'),
  bedrooms: z.number().int().min(0).max(20).optional(),
  description: z.string().max(1000).optional(),
});

export const updatePropertySchema = createPropertySchema.partial();

export const submitReviewSchema = z.object({
  reviewedId: z.string().min(1, 'Reviewed user ID is required'),
  propertyId: z.string().optional(),
  reviewedRole: z.enum(['tenant', 'landlord']),
  rating: z.number().int().min(1).max(10, 'Rating must be between 1 and 10'),
  description: z
    .string()
    .min(50, 'Review description must be at least 50 characters')
    .max(2000),
});

export const rankingQuerySchema = z.object({
  city: z.string().optional(),
  type: z.enum(['apartment', 'house', 'studio', 'room', 'other']).optional(),
  minRating: z.coerce.number().min(1).max(10).optional(),
  maxRating: z.coerce.number().min(1).max(10).optional(),
  minReviews: z.coerce.number().int().min(1).optional(),
  sort: z
    .enum(['highest_rated', 'lowest_rated', 'most_reviewed', 'most_recent'])
    .default('highest_rated'),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const searchQuerySchema = z.object({
  q: z.string().min(1).optional(),
  city: z.string().optional(),
  role: z.enum(['tenant', 'landlord']).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type CreatePropertyInput = z.infer<typeof createPropertySchema>;
export type UpdatePropertyInput = z.infer<typeof updatePropertySchema>;
export type SubmitReviewInput = z.infer<typeof submitReviewSchema>;
export type RankingQueryInput = z.infer<typeof rankingQuerySchema>;
export type SearchQueryInput = z.infer<typeof searchQuerySchema>;
