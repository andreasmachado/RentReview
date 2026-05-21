import { AppError, ErrorCode } from '../lib/errors.js';
import type { CreatePropertyInput, UpdatePropertyInput } from '../lib/validation.js';
import { propertyRepository } from '../repositories/propertyRepository.js';

export const propertyService = {
  async create(landlordId: string, data: CreatePropertyInput) {
    return propertyRepository.create(landlordId, data);
  },

  async getById(id: string) {
    const property = propertyRepository.findById(id);
    if (!property) throw new AppError(ErrorCode.NOT_FOUND, 'Property not found', 404);
    const avgRating = propertyRepository.getAverageRating(id);
    const reviewCount = propertyRepository.getReviewCount(id);
    return { ...property, avgRating, reviewCount };
  },

  async getByLandlordId(landlordId: string) {
    const props = propertyRepository.findByLandlordId(landlordId);
    return props.map((p) => ({
      ...p,
      avgRating: propertyRepository.getAverageRating(p.id),
      reviewCount: propertyRepository.getReviewCount(p.id),
    }));
  },

  async update(id: string, userId: string, data: UpdatePropertyInput) {
    const property = propertyRepository.findById(id);
    if (!property) throw new AppError(ErrorCode.NOT_FOUND, 'Property not found', 404);
    if (property.landlordId !== userId)
      throw new AppError(ErrorCode.FORBIDDEN, 'Not authorised to update this property', 403);
    return propertyRepository.update(id, data);
  },

  async delete(id: string, userId: string) {
    const property = propertyRepository.findById(id);
    if (!property) throw new AppError(ErrorCode.NOT_FOUND, 'Property not found', 404);
    if (property.landlordId !== userId)
      throw new AppError(ErrorCode.FORBIDDEN, 'Not authorised to delete this property', 403);
    propertyRepository.delete(id);
  },

  search(filters: { city?: string; type?: string; q?: string }) {
    const props = propertyRepository.search(filters);
    return props.map((p) => ({
      ...p,
      avgRating: propertyRepository.getAverageRating(p.id),
      reviewCount: propertyRepository.getReviewCount(p.id),
    }));
  },
};
