import type { ReviewData } from '../lib/api.js';

interface Props {
  review: ReviewData;
  showRole?: boolean;
}

export function ReviewCard({ review, showRole = true }: Props) {
  const date = new Date(review.createdAt).toLocaleDateString('en-GB', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  const ratingColour =
    review.rating >= 8 ? 'bg-green-500' : review.rating >= 5 ? 'bg-yellow-500' : 'bg-red-500';

  return (
    <div className="rounded-lg border border-border p-4 space-y-3">
      <div className="flex items-center justify-between">
        {showRole && (
          <span className="inline-flex items-center rounded-full border border-border px-2.5 py-0.5 text-xs font-medium capitalize">
            {review.reviewedRole}
          </span>
        )}
        <div className="flex items-center gap-2 ml-auto">
          <span className="text-xl font-bold">{review.rating}</span>
          <span className="text-muted-foreground text-sm">/10</span>
          <div className="w-20 h-2 rounded-full bg-muted overflow-hidden">
            <div
              className={`h-full rounded-full ${ratingColour}`}
              style={{ width: `${review.rating * 10}%` }}
            />
          </div>
        </div>
      </div>
      <p className="text-sm text-foreground leading-relaxed">{review.description}</p>
      <p className="text-xs text-muted-foreground">{date}</p>
    </div>
  );
}
