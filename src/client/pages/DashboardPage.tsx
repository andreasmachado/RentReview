import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api.js';
import type { PropertyWithStats, ReviewData } from '../lib/api.js';
import { useAuth } from '../contexts/AuthContext.js';
import { ReviewCard } from '../components/ReviewCard.js';

export default function DashboardPage() {
  const { user } = useAuth();
  const [recentReviews, setRecentReviews] = useState<ReviewData[]>([]);
  const [properties, setProperties] = useState<PropertyWithStats[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      api.reviews.list({ reviewed_id: user.id }),
      api.properties.list({ landlord_id: user.id }),
    ])
      .then(([reviews, props]) => {
        setRecentReviews(reviews.slice(0, 5));
        setProperties(props);
      })
      .finally(() => setLoading(false));
  }, [user]);

  return (
    <div className="max-w-3xl mx-auto space-y-10">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">Welcome back, {user?.name}</h1>
          <p className="text-muted-foreground text-sm mt-1">Here's an overview of your activity.</p>
        </div>
        <div className="flex gap-2">
          <Link
            to="/write-review"
            className="rounded-md bg-primary text-primary-foreground px-4 py-2 text-sm font-medium hover:opacity-90 transition-opacity"
          >
            Write a review
          </Link>
          <Link
            to="/my-properties"
            className="rounded-md border border-border px-4 py-2 text-sm hover:bg-accent transition-colors"
          >
            My properties
          </Link>
        </div>
      </div>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">My properties</h2>
          <Link to="/my-properties" className="text-sm text-primary hover:underline">
            Manage →
          </Link>
        </div>
        {loading && <div className="h-20 bg-muted rounded animate-pulse" />}
        {!loading && properties.length === 0 && (
          <div className="rounded-lg border border-dashed border-border p-6 text-center">
            <p className="text-muted-foreground text-sm">You haven't added any properties yet.</p>
            <Link to="/my-properties" className="text-primary text-sm hover:underline mt-1 inline-block">
              Add your first property →
            </Link>
          </div>
        )}
        {!loading && properties.length > 0 && (
          <div className="grid gap-3 sm:grid-cols-2">
            {properties.map((p) => (
              <Link
                key={p.id}
                to={`/properties/${p.id}`}
                className="rounded-lg border border-border p-4 hover:bg-accent transition-colors"
              >
                <p className="font-medium text-sm truncate">{p.address}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{p.city} · {p.propertyType}</p>
                <div className="mt-2 flex items-center gap-2 text-xs">
                  {p.avgRating !== null ? (
                    <span className="font-semibold">{p.avgRating.toFixed(1)}/10</span>
                  ) : (
                    <span className="text-muted-foreground">No ratings yet</span>
                  )}
                  <span className="text-muted-foreground">{p.reviewCount} review{p.reviewCount !== 1 ? 's' : ''}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Recent reviews received</h2>
          {user && (
            <Link to={`/users/${user.id}`} className="text-sm text-primary hover:underline">
              View profile →
            </Link>
          )}
        </div>
        {loading && <div className="h-20 bg-muted rounded animate-pulse" />}
        {!loading && recentReviews.length === 0 && (
          <p className="text-muted-foreground text-sm">No reviews received yet.</p>
        )}
        {!loading && recentReviews.map((r) => <ReviewCard key={r.id} review={r} />)}
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        <Link
          to="/rankings/tenants"
          className="rounded-lg border border-border p-5 hover:bg-accent transition-colors text-center"
        >
          <p className="text-2xl font-bold text-primary">🏆</p>
          <p className="font-medium mt-1">Tenant Rankings</p>
          <p className="text-xs text-muted-foreground mt-0.5">See top-rated tenants</p>
        </Link>
        <Link
          to="/rankings/landlords"
          className="rounded-lg border border-border p-5 hover:bg-accent transition-colors text-center"
        >
          <p className="text-2xl font-bold text-primary">🏠</p>
          <p className="font-medium mt-1">Landlord Rankings</p>
          <p className="text-xs text-muted-foreground mt-0.5">Find reliable landlords</p>
        </Link>
        <Link
          to="/rankings/properties"
          className="rounded-lg border border-border p-5 hover:bg-accent transition-colors text-center"
        >
          <p className="text-2xl font-bold text-primary">📍</p>
          <p className="font-medium mt-1">Property Rankings</p>
          <p className="text-xs text-muted-foreground mt-0.5">Discover great properties</p>
        </Link>
      </section>
    </div>
  );
}
