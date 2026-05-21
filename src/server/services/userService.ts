import { AppError, ErrorCode } from '../lib/errors.js';
import type { UpdateProfileInput } from '../lib/validation.js';
import { propertyRepository } from '../repositories/propertyRepository.js';
import { reviewRepository } from '../repositories/reviewRepository.js';
import { userRepository } from '../repositories/userRepository.js';
import type { User } from '../db/schema.js';

type SafeUser = Omit<User, 'passwordHash'>;

function stripSensitive(user: User): SafeUser {
  const { passwordHash: _, ...safe } = user;
  return safe;
}

export const userService = {
  getPublicProfile(id: string) {
    const user = userRepository.findById(id);
    if (!user) throw new AppError(ErrorCode.NOT_FOUND, 'User not found', 404);

    const allReviews = reviewRepository.findByReviewedId(id);
    const tenantReviews = allReviews.filter((r) => r.reviewedRole === 'tenant');
    const landlordReviews = allReviews.filter((r) => r.reviewedRole === 'landlord');

    const avgTenantRating = reviewRepository.getAverageRatingForUser(id, 'tenant');
    const avgLandlordRating = reviewRepository.getAverageRatingForUser(id, 'landlord');

    const propertiesWithRatings = propertyRepository
      .findByLandlordId(id)
      .map((p) => ({
        ...p,
        avgRating: propertyRepository.getAverageRating(p.id),
        reviewCount: propertyRepository.getReviewCount(p.id),
      }));

    return {
      user: stripSensitive(user),
      reviews: { tenant: tenantReviews, landlord: landlordReviews },
      avgRatings: { tenant: avgTenantRating, landlord: avgLandlordRating },
      properties: propertiesWithRatings,
    };
  },

  updateProfile(userId: string, input: UpdateProfileInput): SafeUser {
    const updated = userRepository.update(userId, input);
    return stripSensitive(updated);
  },

  searchUsers(q?: string, city?: string, role?: 'tenant' | 'landlord') {
    const usersFound = userRepository.search(q, city);
    return usersFound
      .map((user) => {
        const avgTenant = reviewRepository.getAverageRatingForUser(user.id, 'tenant');
        const avgLandlord = reviewRepository.getAverageRatingForUser(user.id, 'landlord');
        const tenantReviewCount = reviewRepository.getReviewCountForUser(user.id, 'tenant');
        const landlordReviewCount = reviewRepository.getReviewCountForUser(user.id, 'landlord');

        if (role === 'tenant' && tenantReviewCount === 0) return null;
        if (role === 'landlord' && landlordReviewCount === 0) return null;

        return {
          ...stripSensitive(user),
          avgRatings: { tenant: avgTenant, landlord: avgLandlord },
          reviewCounts: { tenant: tenantReviewCount, landlord: landlordReviewCount },
        };
      })
      .filter(Boolean);
  },
};
