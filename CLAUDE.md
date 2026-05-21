# RentReview

## Project Overview

RentReview is a public web platform where tenants and landlords independently review each other based on rental experiences. Reviews are one-directional and standalone — no mutual consent, no approval step, no blind reveal. A tenant reviews a landlord and their specific property; a landlord reviews a tenant. Either party can post at any time without the other's involvement. A single user account can act as both tenant and landlord. The initial market is Portugal.

## Tech Stack

- **Frontend**: React + TypeScript + shadcn/ui + Tailwind CSS
- **Backend**: Node.js + Hono + TypeScript
- **Database**: SQLite via Drizzle ORM
- **Auth**: Session-based authentication with bcrypt password hashing
- **Validation**: Zod (shared schemas between client and server)
- **Email**: Nodemailer (verification emails)
- **Maps**: Leaflet + React Leaflet with OpenStreetMap tiles (no paid API keys)
- **Seed data**: @faker-js/faker with `pt_PT` locale
- **Font**: Inter (via Google Fonts)
- **Deployment**: Dockerized, ready for Railway / Fly.io / any VPS

Hono over Express because it's lighter, faster, and has better TypeScript support out of the box.

## Project Structure

```
rentreview/
├── package.json
├── tsconfig.json
├── drizzle.config.ts
├── docker-compose.yml
├── .env.example
├── src/
│   ├── server/
│   │   ├── index.ts              # Hono app entry point
│   │   ├── db/
│   │   │   ├── schema.ts         # Drizzle schema definitions
│   │   │   ├── migrate.ts        # Migration runner
│   │   │   └── seed.ts           # Seed script (run via npm run seed)
│   │   ├── routes/
│   │   │   ├── auth.ts           # Register, login, logout, verify email
│   │   │   ├── users.ts          # Profile, search
│   │   │   ├── properties.ts     # CRUD for landlord properties
│   │   │   ├── reviews.ts        # Submit and list reviews
│   │   │   └── rankings.ts       # Ranking/leaderboard queries
│   │   ├── middleware/
│   │   │   ├── auth.ts           # Session validation middleware
│   │   │   └── rate-limit.ts     # Rate limiting
│   │   ├── repositories/
│   │   │   ├── user.repo.ts
│   │   │   ├── property.repo.ts
│   │   │   └── review.repo.ts
│   │   ├── services/
│   │   │   ├── auth.service.ts
│   │   │   ├── email.service.ts
│   │   │   ├── property.service.ts
│   │   │   ├── review.service.ts
│   │   │   └── ranking.service.ts
│   │   └── lib/
│   │       ├── errors.ts         # Typed error classes
│   │       └── validation.ts     # Shared Zod schemas
│   └── client/
│       ├── index.html
│       ├── main.tsx
│       ├── App.tsx
│       ├── components/
│       │   ├── ui/               # shadcn/ui components
│       │   ├── layout/
│       │   │   ├── Header.tsx
│       │   │   ├── Footer.tsx
│       │   │   └── Layout.tsx
│       │   ├── auth/
│       │   │   ├── LoginForm.tsx
│       │   │   ├── RegisterForm.tsx
│       │   │   └── VerifyEmail.tsx
│       │   ├── profile/
│       │   │   ├── UserProfile.tsx
│       │   │   ├── ProfileEdit.tsx
│       │   │   └── ReviewList.tsx
│       │   ├── properties/
│       │   │   ├── PropertyCard.tsx
│       │   │   ├── PropertyDetail.tsx
│       │   │   ├── PropertyForm.tsx
│       │   │   └── PropertyList.tsx
│       │   ├── reviews/
│       │   │   ├── ReviewForm.tsx
│       │   │   ├── ReviewCard.tsx
│       │   │   └── StarRating.tsx
│       │   ├── rankings/
│       │   │   ├── RankingPage.tsx
│       │   │   ├── RankingList.tsx
│       │   │   ├── RankingFilters.tsx
│       │   │   ├── RankingMap.tsx
│       │   │   └── MapMarkerCard.tsx
│       │   └── search/
│       │       ├── SearchPage.tsx
│       │       └── ResultCard.tsx
│       ├── hooks/
│       │   ├── useAuth.ts
│       │   ├── useSearch.ts
│       │   ├── useProperties.ts
│       │   ├── useRankings.ts
│       │   └── useMap.ts
│       ├── lib/
│       │   ├── api.ts            # API client wrapper
│       │   └── types.ts          # Shared TypeScript types
│       └── pages/
│           ├── Home.tsx
│           ├── Login.tsx
│           ├── Register.tsx
│           ├── UserProfile.tsx
│           ├── PropertyDetail.tsx
│           ├── Search.tsx
│           ├── Dashboard.tsx
│           ├── MyProperties.tsx
│           ├── WriteReview.tsx
│           ├── RankingsTenants.tsx
│           ├── RankingsLandlords.tsx
│           └── RankingsProperties.tsx
├── drizzle/
│   └── migrations/
└── tests/
    ├── server/
    └── client/
```

Note: there are NO files related to review requests, review sessions, mutual consent, or blind reveal. Those concepts do not exist in this application.

## Design System

The UI must feel modern, clean, and inviting. Follow these principles:

### Visual Direction
- Generous whitespace, clear typographic hierarchy.
- Soft neutral background: off-white (`#FAFAF9`) or very light grey.
- One confident accent colour for primary actions (e.g., a warm teal or deep blue — pick one and use it consistently).
- Rounded corners (medium radius, `rounded-lg` / `rounded-xl`), subtle shadows (`shadow-sm`), no heavy borders.
- Inter font via Google Fonts for all text.
- Smooth, restrained micro-interactions: hover state transitions (150–200ms), subtle scale on card hover, no flashy animations.

### Component Patterns
- **Cards** for all summary items (landlords, tenants, properties). Each card shows: avatar/thumbnail, name, city, star rating visualisation, review count. Use consistent card sizing.
- **Star/rating display**: Visual representation of the 1–10 rating (could be a filled bar, numbered badge, or star-based). Make it glanceable.
- **Filter bar**: Horizontal bar with dropdowns and chip-style active filters. Include a "Clear all" button. Filters should update results without a page reload.
- **Map view**: Side-by-side layout — map on the left (or top on mobile), results list on the right (or below on mobile). Clicking a marker highlights the corresponding card in the list and vice versa.
- **Empty states**: Friendly illustrated or text-based empty states for profiles with no reviews, search with no results, etc.
- **Skeleton loaders**: Use skeleton placeholders (not spinners) for all async content.

### Responsiveness
- Mobile-first implementation. Breakpoints: `sm` (640px), `md` (768px), `lg` (1024px), `xl` (1280px).
- On mobile: single-column layout, map view goes full-width above the list.
- On desktop: spacious editorial feel — don't just stretch the mobile layout.

### Accessibility
- Minimum 4.5:1 contrast ratio on all text.
- Semantic HTML throughout (proper heading hierarchy, landmark regions, form labels).
- All interactive elements keyboard-navigable.
- Focus indicators visible and styled (not just the browser default).
- Alt text on all images and avatars.
- ARIA labels on icon-only buttons.

## Development Guidelines

### Code Style

- TypeScript strict mode everywhere. Do NOT use `any` — define proper interfaces for all data structures.
- Prefer functional components with hooks on the frontend.
- Use named exports for all modules.
- Error handling: never swallow errors silently. Use typed error classes that extend a base `AppError`.
- Use UK English in all code comments, UI copy, documentation, and user-facing text (e.g., "colour" not "color", "favourite" not "favorite", "organisation" not "organization").
- All API responses use a consistent envelope format:

```typescript
// Success
{ success: true, data: T }

// Error
{ success: false, error: { code: string, message: string } }
```

### Security

- Hash passwords with bcrypt (minimum 12 rounds).
- Validate all input on both client and server using shared Zod schemas.
- Parameterised queries only — Drizzle handles this, but never construct raw SQL with string interpolation.
- Auth middleware on every protected route. No exceptions.
- CORS configured explicitly for the frontend origin only.
- Environment variables for all secrets (session secret, email credentials). Never hardcode.
- Rate limiting on auth endpoints (login, register) — 5 attempts per minute per IP.
- Session cookies must use `httpOnly`, `secure`, and `sameSite: 'lax'` flags.
- Email verification tokens expire after 24 hours.

### Patterns

- **Repository pattern** for all database access. Routes never query the database directly — they call services, which call repositories.
- **Service layer** encapsulates business logic (e.g., "can this user review this landlord?" — check they're not reviewing themselves, check the property belongs to the landlord, etc.).
- Server-side validation mirrors client-side validation using the same Zod schemas (import from `lib/validation.ts`).
- Loading and error states for every async operation on the frontend. Use skeleton loaders, not spinners.

## Features to Implement

### Phase 1 (MVP) — Build in This Order

**1. Project scaffolding and database**
- Initialise the project with Vite (React + TypeScript), Hono server, and Drizzle.
- Set up the database schema (see below), run initial migration.
- Create the `.env.example` with all required variables.
- Configure Tailwind CSS, shadcn/ui, Inter font.

**2. Authentication**
- Registration with email + password. Validate email format and password strength (min 8 chars).
- Email verification flow: on register, send a verification email with a token link. User clicks link → account is verified.
- Login/logout with session-based auth. Store sessions in SQLite.
- Auth middleware that protects all routes except register, login, verify, public profiles, public rankings, and public property pages.

**3. User profiles**
- Profile edit page: name, city/region, bio.
- Public profile page: shows name, city/region, bio.
- For users who have been reviewed as a tenant: show tenant reviews received and average tenant rating.
- For users who have been reviewed as a landlord: show their properties with individual property ratings, plus an overall landlord rating aggregated across all properties.
- Friendly empty state when no reviews exist.

**4. Properties**
- "My Properties" page for landlords to manage their property portfolio.
- Add property form: address, city, postcode, latitude, longitude, property type (apartment, house, studio, room, other), number of bedrooms.
- Edit and delete own properties.
- Property detail page: shows address, metadata, all reviews for this property, and aggregate rating.
- Properties appear on the landlord's public profile.

**5. Independent reviews**
- **Tenant reviewing a landlord/property**: Select landlord (via search/autocomplete) → select one of their properties → write rating (1–10) and description → submit. Published immediately.
- **Landlord reviewing a tenant**: Select tenant (via search/autocomplete) → write rating (1–10) and description → submit. Published immediately.
- Validation: cannot review yourself, property must belong to the selected landlord, rating must be 1–10, description required (minimum 20 characters).
- Reviews appear immediately on the relevant profiles and property pages.
- No mutual consent, no request flow, no blind reveal. Reviews are fully independent.

**6. Search**
- Unified search page with tabs for "Landlords", "Tenants", "Properties".
- Search by name (users) or address/city (properties).
- Results display as cards with key info, rating, and review count.
- Debounced search (300ms).

**7. Rankings**
- Dedicated ranking pages: `/rankings/tenants`, `/rankings/landlords`, `/rankings/properties`.
- **Filters**: by rating range, by city, by property type (landlords/properties), by minimum review count.
- **Sorting**: highest rated, lowest rated, most reviewed, most recent activity.
- **List view** (default): paginated cards, 20 per page.
- **Map view**: Leaflet + OpenStreetMap. Markers colour-coded by rating bucket (green = 8–10, yellow = 5–7, red = 1–4). Click marker to see a summary card with link to full detail page.
- Map + list are synced: clicking a card pans the map to that marker and vice versa.
- Active filters shown as chips above results with a "Clear all" button.

**8. Seed script**
- Located at `src/server/db/seed.ts`, runnable via `npm run seed`.
- Uses `@faker-js/faker` with `pt_PT` locale.
- Creates: 100 tenants, 100 landlords, 1–4 properties per landlord (weighted: ~50% have 1, ~30% have 2, ~15% have 3, ~5% have 4).
- Creates: 200 reviews total. Mix of tenant→landlord/property and landlord→tenant. Asymmetric distribution (many one-sided). Ratings skewed slightly positive (mean ~7, std dev ~2, clamped to 1–10).
- Cities: Lisbon, Porto, Coimbra, Braga, Faro, Aveiro, Setúbal, Funchal, Évora, Viseu, Leiria, Guimarães — with plausible coordinates for each.
- Idempotent: drops and recreates all data on each run.
- Passwords for seed users: all set to `password123` for easy testing.

**9. Dashboard**
- Logged-in user's home page showing: their recent reviews (given and received), their properties (if landlord), and quick links to write a review or add a property.

### Phase 2 (Post-MVP)

- Review disputes and moderation tooling
- Verified rental proof (lease upload)
- Detailed rating sub-categories (keep a `rating_details` JSON column in the reviews table now to prepare for this)
- Email notifications for new reviews received
- Analytics dashboard for landlords with many properties
- Admin panel
- Mobile app (React Native)

## Database Schema

```sql
-- Users
CREATE TABLE users (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  city TEXT,
  bio TEXT,
  email_verified INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Email verification tokens
CREATE TABLE email_verification_tokens (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Sessions (for auth)
CREATE TABLE sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Properties (belong to a landlord)
CREATE TABLE properties (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  landlord_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  postcode TEXT,
  latitude REAL,
  longitude REAL,
  property_type TEXT NOT NULL DEFAULT 'apartment' CHECK (property_type IN ('apartment', 'house', 'studio', 'room', 'other')),
  bedrooms INTEGER,
  description TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Reviews (standalone, one-directional)
CREATE TABLE reviews (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  reviewer_id TEXT NOT NULL REFERENCES users(id),
  reviewed_id TEXT NOT NULL REFERENCES users(id),
  property_id TEXT REFERENCES properties(id) ON DELETE SET NULL,
  reviewed_role TEXT NOT NULL CHECK (reviewed_role IN ('tenant', 'landlord')),
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 10),
  description TEXT NOT NULL,
  rating_details TEXT,  -- JSON field for future sub-category ratings
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Indexes for performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_name ON users(name);
CREATE INDEX idx_users_city ON users(city);
CREATE INDEX idx_properties_landlord ON properties(landlord_id);
CREATE INDEX idx_properties_city ON properties(city);
CREATE INDEX idx_properties_type ON properties(property_type);
CREATE INDEX idx_properties_coords ON properties(latitude, longitude);
CREATE INDEX idx_reviews_reviewer ON reviews(reviewer_id);
CREATE INDEX idx_reviews_reviewed ON reviews(reviewed_id);
CREATE INDEX idx_reviews_property ON reviews(property_id);
CREATE INDEX idx_reviews_reviewed_role ON reviews(reviewed_id, reviewed_role);
CREATE INDEX idx_reviews_rating ON reviews(rating);
```

There are NO tables for review_requests, review_sessions, or anything related to mutual consent. Those concepts do not exist.

### Key constraints
- `reviews.property_id` is required when `reviewed_role = 'landlord'` (enforced in application logic, not the DB constraint, because SQLite lacks conditional constraints). When `reviewed_role = 'tenant'`, `property_id` must be NULL.
- `reviews.property_id` must reference a property owned by `reviews.reviewed_id` (enforced in the service layer).
- A user cannot review themselves (`reviewer_id != reviewed_id`, enforced in service layer).

## API Endpoints

### Auth
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/auth/register` | Register a new user |
| POST | `/api/auth/login` | Log in, create session |
| POST | `/api/auth/logout` | Destroy session |
| GET | `/api/auth/verify/:token` | Verify email address |
| GET | `/api/auth/me` | Get current authenticated user |

### Users
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/users/search?q=&city=&role=` | Search users by name/city, optionally filter by role |
| GET | `/api/users/:id` | Get public profile with reviews and properties |
| PUT | `/api/users/me` | Update own profile |

### Properties
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/properties` | Create a new property (landlord only) |
| GET | `/api/properties?landlord_id=&city=&type=` | List/search properties with filters |
| GET | `/api/properties/:id` | Get property detail with reviews |
| PUT | `/api/properties/:id` | Update own property |
| DELETE | `/api/properties/:id` | Delete own property |

### Reviews
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/reviews` | Submit a review (tenant→landlord+property or landlord→tenant) |
| GET | `/api/reviews?reviewed_id=&property_id=&role=` | List reviews with filters |
| GET | `/api/reviews/:id` | Get single review detail |
| DELETE | `/api/reviews/:id` | Delete own review (within 24h of posting) |

### Rankings
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/rankings/tenants?city=&min_rating=&max_rating=&min_reviews=&sort=&page=&limit=` | Tenant rankings with filters |
| GET | `/api/rankings/landlords?city=&type=&min_rating=&max_rating=&min_reviews=&sort=&page=&limit=` | Landlord rankings with filters |
| GET | `/api/rankings/properties?city=&type=&min_rating=&max_rating=&min_reviews=&sort=&page=&limit=` | Property rankings with filters |

Ranking endpoints return aggregated data: average rating, review count, and the entity's basic info. The `sort` parameter accepts: `highest_rated`, `lowest_rated`, `most_reviewed`, `most_recent`. Default: `highest_rated`. Pagination via `page` (default 1) and `limit` (default 20, max 100).

## Key Decisions

- **No mutual consent flow**: Reviews are independent and immediate. This is the fundamental design decision — there is no request/accept step, no blind reveal, no review sessions. Do not build any of these.
- **Single account, dual roles**: A user is not "a tenant" or "a landlord" — they're a user who can act as either. The role is contextual to each review, not to the account.
- **Property-specific reviews for landlords**: When a tenant reviews a landlord, they must specify which property. This is because a landlord's quality can vary significantly between properties. A landlord's overall rating is the aggregate of all their property reviews.
- **Tenant reviews have no property**: When a landlord reviews a tenant, no property is referenced — the review is about the tenant as a person.
- **Hono over Express**: Chosen for better TypeScript integration and lighter footprint.
- **SQLite over PostgreSQL**: Sufficient for MVP scale, simplifies deployment. Schema designed to migrate to PostgreSQL later — avoid SQLite-specific functions beyond what Drizzle abstracts.
- **Session-based auth over JWT**: Simpler, easier to invalidate, appropriate for this scale.
- **Leaflet + OpenStreetMap**: Free, no API keys required, good enough for the map view. No Google Maps.
- **UK English throughout**: All UI copy, code comments, and documentation use UK English spelling.
- **`rating_details` JSON column**: Present but unused in MVP. Reserves space for future sub-category ratings without requiring a schema migration later.
- **Review deletion window**: Reviews can be deleted by their author within 24 hours of posting. After that they are permanent.
- **No duplicate reviews**: One review per reviewer per target (reviewer_id + reviewed_id + property_id combination must be unique). Enforced in the service layer.
- **Description minimum**: Review descriptions must be at least 50 characters. Enforced via Zod on both client and server.
