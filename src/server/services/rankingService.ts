import { rawDb } from '../db/index.js';
import type { RankingQueryInput } from '../lib/validation.js';

type SortKey = 'highest_rated' | 'lowest_rated' | 'most_reviewed' | 'most_recent';

function orderBy(sort: SortKey): string {
  switch (sort) {
    case 'lowest_rated': return 'avg_rating ASC';
    case 'most_reviewed': return 'review_count DESC';
    case 'most_recent': return 'last_review DESC';
    default: return 'avg_rating DESC';
  }
}

function esc(s: string): string {
  return s.replace(/'/g, "''");
}

export const rankingService = {
  tenants(query: RankingQueryInput) {
    const { city, minRating, maxRating, minReviews, sort, page, limit } = query;
    const offset = (page - 1) * limit;

    const cityWhere = city ? `AND u.city LIKE '%${esc(city)}%'` : '';
    const having: string[] = [];
    if (minRating !== undefined) having.push(`AVG(r.rating) >= ${minRating}`);
    if (maxRating !== undefined) having.push(`AVG(r.rating) <= ${maxRating}`);
    if (minReviews !== undefined) having.push(`COUNT(r.id) >= ${minReviews}`);
    const havingClause = having.length ? `HAVING ${having.join(' AND ')}` : '';
    const ob = orderBy(sort);

    const rows = rawDb.prepare(`
      SELECT
        u.id, u.name, u.city,
        ROUND(AVG(r.rating), 1) AS avg_rating,
        COUNT(r.id) AS review_count,
        MAX(r.created_at) AS last_review
      FROM users u
      JOIN reviews r ON r.reviewed_id = u.id
      WHERE r.reviewed_role = 'tenant' ${cityWhere}
      GROUP BY u.id
      ${havingClause}
      ORDER BY ${ob}
      LIMIT ? OFFSET ?
    `).all(limit, offset) as Array<{
      id: string; name: string; city: string | null;
      avg_rating: number; review_count: number; last_review: string;
    }>;

    const total = (rawDb.prepare(`
      SELECT COUNT(*) AS total FROM (
        SELECT u.id
        FROM users u
        JOIN reviews r ON r.reviewed_id = u.id
        WHERE r.reviewed_role = 'tenant' ${cityWhere}
        GROUP BY u.id
        ${havingClause}
      )
    `).get() as { total: number } | undefined)?.total ?? 0;

    return {
      items: rows.map((r) => ({
        id: r.id, name: r.name, city: r.city,
        avgRating: r.avg_rating, reviewCount: r.review_count, lastReview: r.last_review,
      })),
      total, page, limit, pages: Math.ceil(total / limit),
    };
  },

  landlords(query: RankingQueryInput) {
    const { city, type, minRating, maxRating, minReviews, sort, page, limit } = query;
    const offset = (page - 1) * limit;

    const cityWhere = city ? `AND (u.city LIKE '%${esc(city)}%' OR p.city LIKE '%${esc(city)}%')` : '';
    const typeWhere = type ? `AND p.property_type = '${esc(type)}'` : '';
    const having: string[] = [];
    if (minRating !== undefined) having.push(`AVG(r.rating) >= ${minRating}`);
    if (maxRating !== undefined) having.push(`AVG(r.rating) <= ${maxRating}`);
    if (minReviews !== undefined) having.push(`COUNT(r.id) >= ${minReviews}`);
    const havingClause = having.length ? `HAVING ${having.join(' AND ')}` : '';
    const ob = orderBy(sort);

    const rows = rawDb.prepare(`
      SELECT
        u.id, u.name, u.city,
        ROUND(AVG(r.rating), 1) AS avg_rating,
        COUNT(r.id) AS review_count,
        MAX(r.created_at) AS last_review,
        COUNT(DISTINCT p.id) AS property_count
      FROM users u
      JOIN reviews r ON r.reviewed_id = u.id
      JOIN properties p ON r.property_id = p.id
      WHERE r.reviewed_role = 'landlord' ${cityWhere} ${typeWhere}
      GROUP BY u.id
      ${havingClause}
      ORDER BY ${ob}
      LIMIT ? OFFSET ?
    `).all(limit, offset) as Array<{
      id: string; name: string; city: string | null;
      avg_rating: number; review_count: number; last_review: string; property_count: number;
    }>;

    const total = (rawDb.prepare(`
      SELECT COUNT(*) AS total FROM (
        SELECT u.id
        FROM users u
        JOIN reviews r ON r.reviewed_id = u.id
        JOIN properties p ON r.property_id = p.id
        WHERE r.reviewed_role = 'landlord' ${cityWhere} ${typeWhere}
        GROUP BY u.id
        ${havingClause}
      )
    `).get() as { total: number } | undefined)?.total ?? 0;

    return {
      items: rows.map((r) => ({
        id: r.id, name: r.name, city: r.city,
        avgRating: r.avg_rating, reviewCount: r.review_count,
        lastReview: r.last_review, propertyCount: r.property_count,
      })),
      total, page, limit, pages: Math.ceil(total / limit),
    };
  },

  propertiesRanking(query: RankingQueryInput) {
    const { city, type, minRating, maxRating, minReviews, sort, page, limit } = query;
    const offset = (page - 1) * limit;

    const cityWhere = city ? `AND p.city LIKE '%${esc(city)}%'` : '';
    const typeWhere = type ? `AND p.property_type = '${esc(type)}'` : '';
    const having: string[] = [];
    if (minRating !== undefined) having.push(`AVG(r.rating) >= ${minRating}`);
    if (maxRating !== undefined) having.push(`AVG(r.rating) <= ${maxRating}`);
    if (minReviews !== undefined) having.push(`COUNT(r.id) >= ${minReviews}`);
    const havingClause = having.length ? `HAVING ${having.join(' AND ')}` : '';
    const ob = orderBy(sort);

    const rows = rawDb.prepare(`
      SELECT
        p.id, p.address, p.city, p.postcode, p.property_type, p.bedrooms,
        p.latitude, p.longitude, p.landlord_id,
        u.name AS landlord_name,
        ROUND(AVG(r.rating), 1) AS avg_rating,
        COUNT(r.id) AS review_count,
        MAX(r.created_at) AS last_review
      FROM properties p
      JOIN reviews r ON r.property_id = p.id
      JOIN users u ON p.landlord_id = u.id
      WHERE r.reviewed_role = 'landlord' ${cityWhere} ${typeWhere}
      GROUP BY p.id
      ${havingClause}
      ORDER BY ${ob}
      LIMIT ? OFFSET ?
    `).all(limit, offset) as Array<{
      id: string; address: string; city: string; postcode: string | null;
      property_type: string; bedrooms: number | null;
      latitude: number | null; longitude: number | null;
      landlord_id: string; landlord_name: string;
      avg_rating: number; review_count: number; last_review: string;
    }>;

    const total = (rawDb.prepare(`
      SELECT COUNT(*) AS total FROM (
        SELECT p.id
        FROM properties p
        JOIN reviews r ON r.property_id = p.id
        WHERE r.reviewed_role = 'landlord' ${cityWhere} ${typeWhere}
        GROUP BY p.id
        ${havingClause}
      )
    `).get() as { total: number } | undefined)?.total ?? 0;

    return {
      items: rows.map((r) => ({
        id: r.id, address: r.address, city: r.city, postcode: r.postcode,
        propertyType: r.property_type, bedrooms: r.bedrooms,
        latitude: r.latitude, longitude: r.longitude,
        landlordId: r.landlord_id, landlordName: r.landlord_name,
        avgRating: r.avg_rating, reviewCount: r.review_count, lastReview: r.last_review,
      })),
      total, page, limit, pages: Math.ceil(total / limit),
    };
  },
};
