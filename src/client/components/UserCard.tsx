import { Link } from 'react-router-dom';
import type { SearchUser } from '../lib/api.js';

interface Props {
  user: SearchUser;
}

function initials(name: string) {
  return name
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase();
}

export function UserCard({ user }: Props) {
  const { tenant, landlord } = user.avgRatings;
  const totalReviews = user.reviewCounts.tenant + user.reviewCounts.landlord;

  return (
    <Link
      to={`/users/${user.id}`}
      className="flex items-center gap-4 rounded-lg border border-border p-4 hover:bg-accent transition-colors"
    >
      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold text-primary">
        {initials(user.name)}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium truncate">{user.name}</p>
        {user.city && (
          <p className="text-sm text-muted-foreground truncate">{user.city}</p>
        )}
      </div>
      <div className="flex-shrink-0 text-right text-xs text-muted-foreground space-y-0.5">
        {tenant !== null && <div>Tenant {tenant.toFixed(1)}/10</div>}
        {landlord !== null && <div>Landlord {landlord.toFixed(1)}/10</div>}
        {totalReviews === 0 && <div>No reviews yet</div>}
        {totalReviews > 0 && (
          <div className="text-muted-foreground/70">{totalReviews} review{totalReviews !== 1 ? 's' : ''}</div>
        )}
      </div>
    </Link>
  );
}
