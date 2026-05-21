import 'dotenv/config';
import { faker } from '@faker-js/faker/locale/pt_PT';
import bcrypt from 'bcryptjs';
import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = process.env.DATABASE_URL ?? path.resolve(__dirname, '../../../dev.db');

const PORTUGUESE_CITIES: { city: string; lat: number; lng: number }[] = [
  { city: 'Lisbon', lat: 38.7169, lng: -9.1399 },
  { city: 'Porto', lat: 41.1579, lng: -8.6291 },
  { city: 'Coimbra', lat: 40.2033, lng: -8.4103 },
  { city: 'Braga', lat: 41.5454, lng: -8.4265 },
  { city: 'Faro', lat: 37.0193, lng: -7.9304 },
  { city: 'Aveiro', lat: 40.6405, lng: -8.6538 },
  { city: 'Setúbal', lat: 38.5244, lng: -8.8882 },
  { city: 'Funchal', lat: 32.6669, lng: -16.9241 },
  { city: 'Évora', lat: 38.5714, lng: -7.9130 },
  { city: 'Viseu', lat: 40.6566, lng: -7.9122 },
  { city: 'Leiria', lat: 39.7436, lng: -8.8071 },
  { city: 'Guimarães', lat: 41.4425, lng: -8.2965 },
];

const PROPERTY_TYPES = ['apartment', 'house', 'studio', 'room', 'other'] as const;

function gaussianRating(): number {
  // Box-Muller transform: mean ~7, std ~1.8, clamped to 1–10
  let u = 0;
  let v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  const val = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
  return Math.min(10, Math.max(1, Math.round(val * 1.8 + 7)));
}

function weightedPropertyCount(): number {
  const rand = Math.random();
  if (rand < 0.5) return 1;
  if (rand < 0.8) return 2;
  if (rand < 0.95) return 3;
  return 4;
}

function randomCity() {
  return PORTUGUESE_CITIES[Math.floor(Math.random() * PORTUGUESE_CITIES.length)];
}

function jitter(coord: number, range = 0.05): number {
  return coord + (Math.random() - 0.5) * range;
}

function randomId(): string {
  return [...Array(16)]
    .map(() => Math.floor(Math.random() * 16).toString(16))
    .join('');
}

async function main() {
  const db = new Database(DB_PATH);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  console.log('Clearing existing data...');
  db.exec(`
    DELETE FROM reviews;
    DELETE FROM properties;
    DELETE FROM sessions;
    DELETE FROM email_verification_tokens;
    DELETE FROM users;
  `);

  const passwordHash = await bcrypt.hash('password123', 12);
  const now = new Date().toISOString();

  const insertUser = db.prepare(`
    INSERT INTO users (id, email, password_hash, name, city, bio, email_verified, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?)
  `);

  console.log('Creating 100 tenants...');
  const tenants: string[] = [];
  for (let i = 0; i < 100; i++) {
    const id = randomId();
    tenants.push(id);
    const cityData = randomCity();
    const firstName = faker.person.firstName();
    const lastName = faker.person.lastName();
    insertUser.run(
      id,
      `tenant${i + 1}.${firstName.toLowerCase()}.${lastName.toLowerCase()}@${faker.internet.domainName()}`,
      passwordHash,
      `${firstName} ${lastName}`,
      cityData.city,
      faker.lorem.sentence({ min: 10, max: 20 }),
      now,
      now
    );
  }

  console.log('Creating 100 landlords...');
  const landlords: string[] = [];
  for (let i = 0; i < 100; i++) {
    const id = randomId();
    landlords.push(id);
    const cityData = randomCity();
    const firstName = faker.person.firstName();
    const lastName = faker.person.lastName();
    insertUser.run(
      id,
      `landlord${i + 1}.${firstName.toLowerCase()}.${lastName.toLowerCase()}@${faker.internet.domainName()}`,
      passwordHash,
      `${firstName} ${lastName}`,
      cityData.city,
      faker.lorem.sentence({ min: 10, max: 20 }),
      now,
      now
    );
  }

  console.log('Creating properties...');
  const insertProperty = db.prepare(`
    INSERT INTO properties (id, landlord_id, address, city, postcode, latitude, longitude, property_type, bedrooms, description, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const propertiesByLandlord: Record<string, string[]> = {};

  for (const landlordId of landlords) {
    const count = weightedPropertyCount();
    propertiesByLandlord[landlordId] = [];
    for (let j = 0; j < count; j++) {
      const propId = randomId();
      propertiesByLandlord[landlordId].push(propId);
      const cityData = randomCity();
      const propType = PROPERTY_TYPES[Math.floor(Math.random() * PROPERTY_TYPES.length)];
      insertProperty.run(
        propId,
        landlordId,
        faker.location.streetAddress(),
        cityData.city,
        `${Math.floor(Math.random() * 9000) + 1000}-${Math.floor(Math.random() * 900) + 100}`,
        jitter(cityData.lat),
        jitter(cityData.lng),
        propType,
        Math.floor(Math.random() * 5) + 1,
        faker.lorem.sentences(2),
        now,
        now
      );
    }
  }

  const totalProperties = Object.values(propertiesByLandlord).flat().length;
  console.log(`Created ${totalProperties} properties.`);

  console.log('Creating 200 reviews...');
  const insertReview = db.prepare(`
    INSERT INTO reviews (id, reviewer_id, reviewed_id, property_id, reviewed_role, rating, description, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  let reviewCount = 0;
  const reviewedCombinations = new Set<string>();

  function safeInsertReview(
    reviewerId: string,
    reviewedId: string,
    propertyId: string | null,
    role: 'tenant' | 'landlord'
  ): boolean {
    const key = `${reviewerId}:${reviewedId}:${propertyId ?? 'null'}`;
    if (reviewedCombinations.has(key) || reviewerId === reviewedId) return false;
    reviewedCombinations.add(key);
    insertReview.run(
      randomId(),
      reviewerId,
      reviewedId,
      propertyId,
      role,
      gaussianRating(),
      faker.lorem.paragraph({ min: 2, max: 4 }),
      now
    );
    reviewCount++;
    return true;
  }

  let attempts = 0;
  while (reviewCount < 200 && attempts < 10000) {
    attempts++;
    if (Math.random() < 0.6) {
      // Tenant reviews a landlord + property
      const tenant = tenants[Math.floor(Math.random() * tenants.length)];
      const landlord = landlords[Math.floor(Math.random() * landlords.length)];
      const props = propertiesByLandlord[landlord];
      if (!props || props.length === 0) continue;
      const property = props[Math.floor(Math.random() * props.length)];
      safeInsertReview(tenant, landlord, property, 'landlord');
    } else {
      // Landlord reviews a tenant
      const landlord = landlords[Math.floor(Math.random() * landlords.length)];
      const tenant = tenants[Math.floor(Math.random() * tenants.length)];
      safeInsertReview(landlord, tenant, null, 'tenant');
    }
  }

  console.log(`
Seed complete:
  - 100 tenants
  - 100 landlords
  - ${totalProperties} properties
  - ${reviewCount} reviews

All passwords: password123
  `);

  db.close();
}

main().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
