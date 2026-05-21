import { AppError, ErrorCode } from '../lib/errors.js';
import type { SubmitReviewInput } from '../lib/validation.js';
import { propertyRepository } from '../repositories/propertyRepository.js';
import { reviewRepository } from '../repositories/reviewRepository.js';
import { userRepository } from '../repositories/userRepository.js';

const DELETION_WINDOW_MS = 24 * 60 * 60 * 1000;

export const reviewService = {
  async submit(reviewerId: string, data: SubmitReviewInput) {
    const { reviewedId, propertyId, reviewedRole, rating, description } = data;

    if (reviewerId === reviewedId) {
      throw new AppError(ErrorCode.VALIDATION_ERROR, 'You cannot review yourself', 400);
    }

    const reviewed = userRepository.findById(reviewedId);
    if (!reviewed) throw new AppError(ErrorCode.NOT_FOUND, 'User not found', 404);

    if (reviewedRole === 'landlord') {
      if (!propertyId) {
        throw new AppError(
          ErrorCode.VALIDATION_ERROR,
          'A property must be specified when reviewing a landlord',
          400
        );
      }
      const property = propertyRepository.findById(propertyId);
      if (!property) throw new AppError(ErrorCode.NOT_FOUND, 'Property not found', 404);
      if (property.landlordId !== reviewedId) {
        throw new AppError(
          ErrorCode.VALIDATION_ERROR,
          'The specified property does not belong to this landlord',
          400
        );
      }
    } else {
      if (propertyId) {
        throw new AppError(
          ErrorCode.VALIDATION_ERROR,
          'Property ID must not be provided when reviewing a tenant',
          400
        );
      }
    }

    const existing = reviewRepository.findExisting(reviewerId, reviewedId, propertyId ?? null);
    if (existing) {
      throw new AppError(
        ErrorCode.ALREADY_EXISTS,
        'You have already reviewed this person for this property',
        409
      );
    }

    return reviewRepository.create({
      reviewerId,
      reviewedId,
      propertyId: propertyId ?? null,
      reviewedRole,
      rating,
      description,
    });
  },

  async delete(reviewId: string, userId: string) {
    const review = reviewRepository.findById(reviewId);
    if (!review) throw new AppError(ErrorCode.NOT_FOUND, 'Review not found', 404);
    if (review.reviewerId !== userId) {
      throw new AppError(ErrorCode.FORBIDDEN, 'Not authorised to delete this review', 403);
    }
    const age = Date.now() - new Date(review.createdAt).getTime();
    if (age > DELETION_WINDOW_MS) {
      throw new AppError(
        ErrorCode.VALIDATION_ERROR,
        'Reviews can only be deleted within 24 hours of posting',
        400
      );
    }
    reviewRepository.delete(reviewId);
  },

  getByReviewedId(reviewedId: string) {
    return reviewRepository.findByReviewedId(reviewedId);
  },

  getByPropertyId(propertyId: string) {
    return reviewRepository.findByPropertyId(propertyId);
  },

  getById(id: string) {
    const review = reviewRepository.findById(id);
    if (!review) throw new AppError(ErrorCode.NOT_FOUND, 'Review not found', 404);
    return review;
  },
};
