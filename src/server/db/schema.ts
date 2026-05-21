import { sql } from 'drizzle-orm';
import { index, integer, real, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';

export const users = sqliteTable(
  'users',
  {
    id: text('id').primaryKey().default(sql`(lower(hex(randomblob(16))))`),
    email: text('email').notNull().unique(),
    passwordHash: text('password_hash').notNull(),
    name: text('name').notNull(),
    city: text('city'),
    bio: text('bio'),
    emailVerified: integer('email_verified').notNull().default(0),
    createdAt: text('created_at').notNull().default(sql`(datetime('now'))`),
    updatedAt: text('updated_at').notNull().default(sql`(datetime('now'))`),
  },
  (t) => ({
    emailIdx: uniqueIndex('idx_users_email').on(t.email),
    nameIdx: index('idx_users_name').on(t.name),
    cityIdx: index('idx_users_city').on(t.city),
  })
);

export const emailVerificationTokens = sqliteTable('email_verification_tokens', {
  id: text('id').primaryKey().default(sql`(lower(hex(randomblob(16))))`),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  token: text('token').notNull().unique(),
  expiresAt: text('expires_at').notNull(),
  createdAt: text('created_at').notNull().default(sql`(datetime('now'))`),
});

export const sessions = sqliteTable('sessions', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  expiresAt: text('expires_at').notNull(),
  createdAt: text('created_at').notNull().default(sql`(datetime('now'))`),
});

export const properties = sqliteTable(
  'properties',
  {
    id: text('id').primaryKey().default(sql`(lower(hex(randomblob(16))))`),
    landlordId: text('landlord_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    address: text('address').notNull(),
    city: text('city').notNull(),
    postcode: text('postcode'),
    latitude: real('latitude'),
    longitude: real('longitude'),
    propertyType: text('property_type', {
      enum: ['apartment', 'house', 'studio', 'room', 'other'],
    })
      .notNull()
      .default('apartment'),
    bedrooms: integer('bedrooms'),
    description: text('description'),
    createdAt: text('created_at').notNull().default(sql`(datetime('now'))`),
    updatedAt: text('updated_at').notNull().default(sql`(datetime('now'))`),
  },
  (t) => ({
    landlordIdx: index('idx_properties_landlord').on(t.landlordId),
    cityIdx: index('idx_properties_city').on(t.city),
    typeIdx: index('idx_properties_type').on(t.propertyType),
    coordsIdx: index('idx_properties_coords').on(t.latitude, t.longitude),
  })
);

export const reviews = sqliteTable(
  'reviews',
  {
    id: text('id').primaryKey().default(sql`(lower(hex(randomblob(16))))`),
    reviewerId: text('reviewer_id')
      .notNull()
      .references(() => users.id),
    reviewedId: text('reviewed_id')
      .notNull()
      .references(() => users.id),
    propertyId: text('property_id').references(() => properties.id, { onDelete: 'set null' }),
    reviewedRole: text('reviewed_role', { enum: ['tenant', 'landlord'] }).notNull(),
    rating: integer('rating').notNull(),
    description: text('description').notNull(),
    ratingDetails: text('rating_details'),
    createdAt: text('created_at').notNull().default(sql`(datetime('now'))`),
  },
  (t) => ({
    reviewerIdx: index('idx_reviews_reviewer').on(t.reviewerId),
    reviewedIdx: index('idx_reviews_reviewed').on(t.reviewedId),
    propertyIdx: index('idx_reviews_property').on(t.propertyId),
    reviewedRoleIdx: index('idx_reviews_reviewed_role').on(t.reviewedId, t.reviewedRole),
    ratingIdx: index('idx_reviews_rating').on(t.rating),
  })
);

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Session = typeof sessions.$inferSelect;
export type EmailVerificationToken = typeof emailVerificationTokens.$inferSelect;
export type Property = typeof properties.$inferSelect;
export type NewProperty = typeof properties.$inferInsert;
export type Review = typeof reviews.$inferSelect;
export type NewReview = typeof reviews.$inferInsert;
