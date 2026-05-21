import { and, asc, desc, eq, ilike, like, sql } from 'drizzle-orm';
import { db } from '../db/index.js';
import { properties, reviews } from '../db/schema.js';
import type { CreatePropertyInput } from '../lib/validation.js';

export const propertyRepository = {
  async create(
    landlordId: string,
    data: CreatePropertyInput
  ) {
    const result = db
      .insert(properties)
      .values({
        landlordId,
        address: data.address,
        city: data.city,
        postcode: data.postcode,
        latitude: data.latitude,
        longitude: data.longitude,
        propertyType: data.propertyType,
        bedrooms: data.bedrooms,
        description: data.description,
      })
      .returning()
      .get();
    return result;
  },

  findById(id: string) {
    return db.select().from(properties).where(eq(properties.id, id)).get() ?? null;
  },

  findByLandlordId(landlordId: string) {
    return db.select().from(properties).where(eq(properties.landlordId, landlordId)).all();
  },

  search(filters: { city?: string; type?: string; q?: string }) {
    const conditions = [];
    if (filters.city) {
      conditions.push(like(properties.city, `%${filters.city}%`));
    }
    if (filters.type) {
      conditions.push(eq(properties.propertyType, filters.type as typeof properties.propertyType._.data));
    }
    if (filters.q) {
      conditions.push(like(properties.address, `%${filters.q}%`));
    }
    return db
      .select()
      .from(properties)
      .where(conditions.length ? and(...conditions) : undefined)
      .all();
  },

  update(id: string, data: Partial<CreatePropertyInput>) {
    return db
      .update(properties)
      .set({
        ...data,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(properties.id, id))
      .returning()
      .get();
  },

  delete(id: string) {
    return db.delete(properties).where(eq(properties.id, id)).run();
  },

  getAverageRating(propertyId: string): number | null {
    const row = db
      .select({ avg: sql<number>`AVG(${reviews.rating})`, count: sql<number>`COUNT(*)` })
      .from(reviews)
      .where(eq(reviews.propertyId, propertyId))
      .get();
    if (!row || row.count === 0) return null;
    return Math.round(row.avg * 10) / 10;
  },

  getReviewCount(propertyId: string): number {
    const row = db
      .select({ count: sql<number>`COUNT(*)` })
      .from(reviews)
      .where(eq(reviews.propertyId, propertyId))
      .get();
    return row?.count ?? 0;
  },
};
