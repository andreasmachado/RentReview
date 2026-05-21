import { and, eq, sql } from 'drizzle-orm';
import { db } from '../db/index.js';
import { reviews } from '../db/schema.js';

export const reviewRepository = {
  create(data: {
    reviewerId: string;
    reviewedId: string;
    propertyId?: string | null;
    reviewedRole: 'tenant' | 'landlord';
    rating: number;
    description: string;
  }) {
    return db
      .insert(reviews)
      .values({
        reviewerId: data.reviewerId,
        reviewedId: data.reviewedId,
        propertyId: data.propertyId ?? null,
        reviewedRole: data.reviewedRole,
        rating: data.rating,
        description: data.description,
      })
      .returning()
      .get();
  },

  findById(id: string) {
    return db.select().from(reviews).where(eq(reviews.id, id)).get() ?? null;
  },

  findByReviewedId(reviewedId: string) {
    return db.select().from(reviews).where(eq(reviews.reviewedId, reviewedId)).all();
  },

  findByPropertyId(propertyId: string) {
    return db.select().from(reviews).where(eq(reviews.propertyId, propertyId)).all();
  },

  findByReviewerId(reviewerId: string) {
    return db.select().from(reviews).where(eq(reviews.reviewerId, reviewerId)).all();
  },

  findExisting(reviewerId: string, reviewedId: string, propertyId: string | null) {
    const conditions = [
      eq(reviews.reviewerId, reviewerId),
      eq(reviews.reviewedId, reviewedId),
    ];
    if (propertyId) {
      conditions.push(eq(reviews.propertyId, propertyId));
    } else {
      conditions.push(sql`${reviews.propertyId} IS NULL`);
    }
    return db.select().from(reviews).where(and(...conditions)).get() ?? null;
  },

  delete(id: string) {
    return db.delete(reviews).where(eq(reviews.id, id)).run();
  },

  getAverageRatingForUser(
    reviewedId: string,
    role: 'tenant' | 'landlord'
  ): number | null {
    const row = db
      .select({ avg: sql<number>`AVG(${reviews.rating})`, count: sql<number>`COUNT(*)` })
      .from(reviews)
      .where(and(eq(reviews.reviewedId, reviewedId), eq(reviews.reviewedRole, role)))
      .get();
    if (!row || row.count === 0) return null;
    return Math.round(row.avg * 10) / 10;
  },

  getReviewCountForUser(reviewedId: string, role?: 'tenant' | 'landlord'): number {
    const conditions = [eq(reviews.reviewedId, reviewedId)];
    if (role) conditions.push(eq(reviews.reviewedRole, role));
    const row = db
      .select({ count: sql<number>`COUNT(*)` })
      .from(reviews)
      .where(and(...conditions))
      .get();
    return row?.count ?? 0;
  },
};
