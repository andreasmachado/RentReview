import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../lib/api.js';
import type { PropertyWithReviews } from '../lib/api.js';
import { useAuth } from '../contexts/AuthContext.js';
import { ReviewCard } from '../components/ReviewCard.js';

export default function PropertyDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user: currentUser } = useAuth();
  const [data, setData] = useState<PropertyWithReviews | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    api.properties
      .get(id)
      .then(setData)
      .catch((err) => setError(err.message ?? 'Failed to load property'));
  }, [id]);

  if (error) {
    return <div className="text-destructive p-4 rounded-lg border border-destructive/20">{error}</div>;
  }

  if (!data) {
    return (
      <div className="max-w-2xl mx-auto space-y-4 animate-pulse">
        <div className="h-8 bg-muted rounded w-64" />
        <div className="h-4 bg-muted rounded w-32" />
        <div className="h-20 bg-muted rounded" />
      </div>
    );
  }

  const ratingColour =
    data.avgRating !== null
      ? data.avgRating >= 8
        ? 'text-green-600'
        : data.avgRating >= 5
        ? 'text-yellow-600'
        : 'text-red-600'
      : 'text-muted-foreground';

  const isOwnProperty = currentUser?.id === data.landlordId;

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="space-y-1">
        <div className="flex items-start justify-between">
          <h1 className="text-2xl font-bold">{data.address}</h1>
          {currentUser && !isOwnProperty && (
            <Link
              to={`/write-review?reviewedId=${data.landlordId}&propertyId=${data.id}`}
              className="ml-3 flex-shrink-0 rounded-md bg-primary text-primary-foreground px-3 py-1.5 text-sm font-medium hover:opacity-90"
            >
              Write a review
            </Link>
          )}
        </div>
        <p className="text-muted-foreground capitalize">
          {data.city}{data.postcode ? `, ${data.postcode}` : ''} · {data.propertyType}
          {data.bedrooms ? ` · ${data.bedrooms} bedroom${data.bedrooms !== 1 ? 's' : ''}` : ''}
        </p>
        {data.description && (
          <p className="text-sm text-foreground leading-relaxed mt-2">{data.description}</p>
        )}
        <div className="flex items-center gap-4 mt-3">
          <span className={`text-3xl font-bold ${ratingColour}`}>
            {data.avgRating !== null ? `${data.avgRating.toFixed(1)}/10` : '—'}
          </span>
          <span className="text-muted-foreground text-sm">
            {data.reviewCount} review{data.reviewCount !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Reviews</h2>
        {data.reviews.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border p-6 text-center">
            <p className="text-muted-foreground text-sm">No reviews yet for this property.</p>
            {currentUser && !isOwnProperty && (
              <Link
                to={`/write-review?reviewedId=${data.landlordId}&propertyId=${data.id}`}
                className="text-primary text-sm hover:underline mt-1 inline-block"
              >
                Be the first to review →
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {data.reviews.map((r) => (
              <ReviewCard key={r.id} review={r} showRole={false} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
