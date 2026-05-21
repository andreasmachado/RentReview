import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../lib/api.js';
import type { ProfileData } from '../lib/api.js';
import { useAuth } from '../contexts/AuthContext.js';
import { ReviewCard } from '../components/ReviewCard.js';

function initials(name: string) {
  return name
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase();
}

export default function ProfilePage() {
  const { id } = useParams<{ id: string }>();
  const { user: currentUser } = useAuth();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    api.users
      .getProfile(id)
      .then(setProfile)
      .catch((err) => setError(err.message ?? 'Failed to load profile'));
  }, [id]);

  if (error) {
    return <div className="text-destructive p-4 rounded-lg border border-destructive/20">{error}</div>;
  }

  if (!profile) {
    return (
      <div className="max-w-2xl mx-auto space-y-4 animate-pulse">
        <div className="h-8 bg-muted rounded w-48" />
        <div className="h-4 bg-muted rounded w-32" />
        <div className="h-20 bg-muted rounded" />
      </div>
    );
  }

  const { user, reviews, avgRatings, properties } = profile;
  const isOwnProfile = currentUser?.id === user.id;

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-start gap-5">
        <div className="flex-shrink-0 w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-xl font-bold text-primary">
          {initials(user.name)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold">{user.name}</h1>
              {user.city && <p className="text-muted-foreground">{user.city}</p>}
            </div>
            <div className="flex gap-2 flex-shrink-0">
              {isOwnProfile && (
                <Link
                  to="/profile/edit"
                  className="rounded-md border border-border px-3 py-1.5 text-sm hover:bg-accent"
                >
                  Edit profile
                </Link>
              )}
              {!isOwnProfile && currentUser && (
                <Link
                  to={`/write-review?reviewedId=${user.id}`}
                  className="rounded-md bg-primary text-primary-foreground px-3 py-1.5 text-sm font-medium hover:opacity-90"
                >
                  Write a review
                </Link>
              )}
            </div>
          </div>
          {user.bio && <p className="text-sm text-foreground mt-2 leading-relaxed">{user.bio}</p>}
          <div className="flex gap-4 text-sm mt-3">
            {avgRatings.tenant !== null && (
              <span className="text-muted-foreground">
                Tenant: <strong className="text-foreground">{avgRatings.tenant.toFixed(1)}/10</strong>
                <span className="ml-1 text-xs">({reviews.tenant.length})</span>
              </span>
            )}
            {avgRatings.landlord !== null && (
              <span className="text-muted-foreground">
                Landlord: <strong className="text-foreground">{avgRatings.landlord.toFixed(1)}/10</strong>
                <span className="ml-1 text-xs">({reviews.landlord.length})</span>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Properties (landlord view) */}
      {properties.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Properties</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {properties.map((p) => (
              <Link
                key={p.id}
                to={`/properties/${p.id}`}
                className="rounded-lg border border-border p-4 hover:bg-accent transition-colors"
              >
                <p className="font-medium text-sm">{p.address}</p>
                <p className="text-xs text-muted-foreground mt-0.5 capitalize">
                  {p.city} · {p.propertyType} · {p.bedrooms ? `${p.bedrooms} bed` : ''}
                </p>
                <div className="mt-2 flex items-center gap-3 text-xs">
                  {p.avgRating !== null ? (
                    <span className="font-semibold">{p.avgRating.toFixed(1)}/10</span>
                  ) : (
                    <span className="text-muted-foreground">No ratings</span>
                  )}
                  <span className="text-muted-foreground">{p.reviewCount} review{p.reviewCount !== 1 ? 's' : ''}</span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Tenant reviews */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Reviews as tenant</h2>
        {reviews.tenant.length === 0 ? (
          <p className="text-muted-foreground text-sm">No tenant reviews yet.</p>
        ) : (
          <div className="space-y-3">
            {reviews.tenant.map((r) => (
              <ReviewCard key={r.id} review={r} showRole={false} />
            ))}
          </div>
        )}
      </section>

      {/* Landlord reviews */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Reviews as landlord</h2>
        {reviews.landlord.length === 0 ? (
          <p className="text-muted-foreground text-sm">No landlord reviews yet.</p>
        ) : (
          <div className="space-y-3">
            {reviews.landlord.map((r) => (
              <ReviewCard key={r.id} review={r} showRole={false} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
