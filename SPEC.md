# RentReview — High-Level Specification

## Overview

RentReview is a public platform where tenants and landlords independently review each other based on their rental experiences. Reviews are one-directional and standalone — a tenant can review a landlord (and their specific property) without the landlord ever reviewing the tenant back, and vice versa. There is no mutual consent gate; either party can post a review at any time. A single user account can act as both tenant and landlord simultaneously.

## Problem Statement

The rental market suffers from a massive information asymmetry. Tenants have no reliable way to know if a landlord is responsive, fair, and maintains their property — until they've already signed a lease. Landlords rely on credit scores and references that say little about what someone is actually like to live with. RentReview creates a shared reputation layer that benefits both sides, making the rental market more transparent for everyone.

## Target Users

- **Tenants** looking to build a rental reputation and check a prospective landlord's track record before committing to a lease.
- **Landlords** looking to verify a prospective tenant's history and build their own reputation as a fair, responsive property owner.
- Users can be both a tenant and a landlord simultaneously (e.g., someone who rents out one property while renting another).

The initial market context is Portugal — seed data, city names, and locale defaults reflect this.

## Core Features (MVP)

### 1. Registration & User Profiles

- Users sign up with email and password. Email verification required.
- A single account can act as both tenant and landlord — no need for separate accounts.
- Profile contains basic information: name, city/region, and a short bio.
- Public profile page displays the user's reviews received (as tenant and/or as landlord), average rating in each role, and number of reviews.

**Acceptance criteria:**
- A user can register, verify their email, log in, and view/edit their profile.
- A user's public profile shows their reviews split by role (tenant / landlord).

### 2. Properties

- A landlord can register one or more properties on the platform.
- Each property has an address, city, postcode, coordinates (latitude/longitude), property type (apartment, house, studio, room, etc.), number of bedrooms, and optional metadata.
- Properties belong to a single landlord and are displayed on the landlord's profile.
- Each property has its own standalone rating (aggregated from reviews targeting that property) and review list.
- A landlord's overall rating is the aggregate across all their properties.

**Acceptance criteria:**
- A landlord can add, edit, and list their properties.
- Each property has its own detail page with address, metadata, rating, and reviews.
- A landlord's profile shows all their properties with individual ratings, plus an overall aggregate.

### 3. Independent Reviews

Reviews are one-directional and standalone. There is no mutual consent flow, no request/accept step, and no blind reveal. Either party can review the other at any time.

- **Tenant reviews landlord**: The tenant selects a landlord (via search), then selects one of that landlord's properties, then writes a review (rating 1–10 and description). The review is published immediately and references both the landlord and the specific property.
- **Landlord reviews tenant**: The landlord searches for a tenant and writes a review (rating 1–10 and description). No property reference needed — the review is about the tenant's behaviour as a renter.
- A review by one party does not require, trigger, or gate a review by the other party. They are fully independent.
- Reviews are visible immediately upon submission.

**Acceptance criteria:**
- A tenant can review a landlord+property without any approval step. The review appears immediately.
- A landlord can review a tenant without any approval step. The review appears immediately.
- One party reviewing the other does not create any obligation or prompt for the other to reciprocate.

### 4. Search

- Users can search for landlords, tenants, or properties.
- Search by name, city/region, and property type.
- Search results show summary cards with name/address, location, average rating, and review count.
- Debounced search input to avoid excessive API calls.

**Acceptance criteria:**
- Searching by name returns matching users with basic info and ratings.
- Searching for properties by city or type returns matching results.
- Filtering by city/region narrows results appropriately.

### 5. Rankings

Dedicated ranking pages for tenants, landlords, and properties with rich filtering and presentation.

**Filters:**
- By rating (minimum/maximum, rating buckets).
- By city (and ideally by district/postcode area).
- By property type (for landlords/properties).
- By minimum review count (to filter out noise from single-review profiles).

**Sorting:**
- Highest rated, lowest rated, most reviewed, most recent activity.

**Views:**
- List view (default) with pagination or infinite scroll.
- Map view using Leaflet with OpenStreetMap tiles (no paid API keys). Markers colour-coded by rating bucket and clickable to open a detail card.

**Detail pages:**
- Landlord detail page: all their properties, each with its own rating and review list.
- Property detail page: all reviews for that specific property.
- Tenant detail page: profile and reviews received from landlords.

**Acceptance criteria:**
- Ranking pages load with sensible defaults and allow filtering/sorting.
- Map view displays properties/landlords geographically with colour-coded markers.
- Clicking a marker opens a detail card with key info and a link to the full profile.
- Queries are performant with proper indexing.

### 6. Seed Data

A seed script populates the database with realistic but clearly fictitious data for development and demonstration:

- 100 tenants, 100 landlords.
- Each landlord owns 1–4 properties (weighted distribution: most have 1–2).
- 200 reviews total, distributed realistically: mix of tenant-on-landlord/property and landlord-on-tenant reviews, asymmetric (some have no counter-review), ratings following a believable slightly-positive-skewed distribution.
- Faker library with Portuguese locale (`pt_PT`). Real Portuguese cities (Lisbon, Porto, Coimbra, Braga, Faro, Aveiro, Setúbal, Funchal, etc.) with plausible coordinates.
- Idempotent: safe to re-run (wipes and repopulates).
- Runnable via `npm run seed`.

**Acceptance criteria:**
- Running `npm run seed` populates the database with consistent, realistic data.
- Re-running the command resets the data cleanly.
- Seed data is visually convincing in the UI (no obvious placeholder text).

## Future Features (Post-MVP)

- **Review disputes** — A flagging system where a user can contest a review they believe is unfair or fraudulent, with moderation support.
- **Verified rental proof** — Upload a lease or utility bill to verify the rental relationship actually existed.
- **Detailed rating categories** — Break the 1–10 rating into sub-categories (e.g., responsiveness, property condition, payment reliability, communication).
- **Notifications** — Email and/or push notifications for new reviews, etc.
- **Analytics dashboard** — For landlords managing multiple properties, a summary of their reputation trends over time.
- **Mobile app** — Native iOS/Android app for easier on-the-go access.
- **Admin/moderation panel** — Review flagging, user management, content moderation.

## Data Model (Conceptual)

- A **User** has a name, email, password hash, city/region, bio, and a verified flag. A user can act as both tenant and landlord.
- A **Property** belongs to a single user (the landlord). It has an address, city, postcode, coordinates (lat/lng), property type, number of bedrooms, and metadata. A landlord can have many properties.
- A **Review** is a standalone, one-directional record. It has a reviewer, a reviewed user, a rating (1–10), a description, and the role being reviewed (tenant or landlord). If the reviewed role is "landlord", the review also references a specific property. Reviews are visible immediately upon creation.

There are no review requests, review sessions, or mutual consent entities.

## User Flows

### Flow 1: New User Registration
User visits the site → signs up with email/password → receives verification email → clicks verification link → lands on their empty profile → can start searching or adding properties.

### Flow 2: Landlord Adds Properties
Landlord logs in → goes to "My Properties" → clicks "Add Property" → fills in address, city, postcode, type, bedrooms → saves. Property appears on their profile and is searchable.

### Flow 3: Tenant Reviews a Landlord
Tenant searches for a landlord by name or city → visits the landlord's profile → sees their properties → clicks "Write a Review" on a specific property → writes a rating (1–10) and description → submits. The review is immediately visible on the property's page and the landlord's profile.

### Flow 4: Landlord Reviews a Tenant
Landlord searches for a tenant by name → visits the tenant's profile → clicks "Write a Review" → writes a rating (1–10) and description → submits. The review is immediately visible on the tenant's profile.

### Flow 5: Browsing Rankings
User visits the rankings page → selects "Landlords" tab → filters by city (e.g., Lisbon) and minimum rating (7+) → toggles to map view → sees colour-coded markers → clicks a marker → sees a summary card → clicks through to the landlord's full profile.

## Non-Functional Requirements

- **Security** — Passwords hashed with bcrypt. Email verification required. Session-based auth. Input validation on all forms. Rate limiting on auth endpoints.
- **Privacy** — Users control only basic profile info. Property addresses are public (they're the subject of reviews). Reviews are public immediately upon submission.
- **Performance** — Ranking queries must be fast with hundreds of users and properties. Proper indexing on rating, city, foreign keys, and review counts. Map view should load smoothly with up to 500 markers.
- **Deployment** — Web application, cloud-hosted. Should be deployable to a VPS or a platform like Railway/Fly.io.
- **Accessibility** — Proper contrast, semantic HTML, keyboard-navigable filters and modals, alt text on avatars/images.
- **Responsiveness** — Mobile-first design, but the desktop experience should feel spacious and editorial.

## Open Questions

- Should there be a minimum character count for review descriptions to avoid low-effort reviews?
- Should users be able to edit or delete their own reviews after posting, or are they permanent?
- Is there a need for admin/moderation tooling in MVP, or can that wait?
- Should duplicate reviews be allowed (same reviewer reviewing the same landlord+property twice)?
