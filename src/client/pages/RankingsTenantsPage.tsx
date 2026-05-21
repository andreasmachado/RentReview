import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api.js';
import type { RankingParams, TenantRankItem } from '../lib/api.js';
import { NavLink } from 'react-router-dom';

function RatingBadge({ rating }: { rating: number }) {
  const colour =
    rating >= 8 ? 'bg-green-100 text-green-800' : rating >= 5 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800';
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-sm font-bold ${colour}`}>
      {rating.toFixed(1)}
    </span>
  );
}

export default function RankingsTenantsPage() {
  const [items, setItems] = useState<TenantRankItem[]>([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);

  const [filters, setFilters] = useState<RankingParams>({
    sort: 'highest_rated',
    page: 1,
    limit: 20,
  });

  useEffect(() => {
    setLoading(true);
    api.rankings
      .tenants(filters)
      .then((data) => {
        setItems(data.items);
        setTotal(data.total);
        setPages(data.pages);
      })
      .finally(() => setLoading(false));
  }, [filters]);

  function updateFilter<K extends keyof RankingParams>(key: K, value: RankingParams[K]) {
    setFilters((prev) => ({ ...prev, [key]: value, page: 1 }));
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Tab navigation */}
      <div className="flex gap-1 border-b border-border">
        {[
          { to: '/rankings/tenants', label: 'Tenants' },
          { to: '/rankings/landlords', label: 'Landlords' },
          { to: '/rankings/properties', label: 'Properties' },
        ].map((t) => (
          <NavLink
            key={t.to}
            to={t.to}
            className={({ isActive }) =>
              `px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
                isActive ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground'
              }`
            }
          >
            {t.label}
          </NavLink>
        ))}
      </div>

      <h1 className="text-2xl font-bold">Tenant rankings</h1>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <input
          type="text"
          placeholder="Filter by city..."
          className="rounded-md border border-input bg-background px-3 py-1.5 text-sm"
          onChange={(e) => updateFilter('city', e.target.value || undefined)}
        />
        <select
          className="rounded-md border border-input bg-background px-3 py-1.5 text-sm"
          onChange={(e) => updateFilter('sort', e.target.value as RankingParams['sort'])}
          value={filters.sort}
        >
          <option value="highest_rated">Highest rated</option>
          <option value="lowest_rated">Lowest rated</option>
          <option value="most_reviewed">Most reviewed</option>
          <option value="most_recent">Most recent</option>
        </select>
        <select
          className="rounded-md border border-input bg-background px-3 py-1.5 text-sm"
          onChange={(e) => updateFilter('minReviews', e.target.value ? Number(e.target.value) : undefined)}
        >
          <option value="">Min reviews: any</option>
          <option value="2">2+</option>
          <option value="5">5+</option>
          <option value="10">10+</option>
        </select>
      </div>

      <p className="text-sm text-muted-foreground">{total} tenant{total !== 1 ? 's' : ''} found</p>

      {loading && (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-16 rounded-lg bg-muted animate-pulse" />
          ))}
        </div>
      )}

      {!loading && items.length === 0 && (
        <p className="text-muted-foreground">No tenants match the current filters.</p>
      )}

      {!loading && (
        <div className="space-y-2">
          {items.map((tenant, idx) => (
            <Link
              key={tenant.id}
              to={`/users/${tenant.id}`}
              className="flex items-center gap-4 rounded-lg border border-border p-4 hover:bg-accent transition-colors"
            >
              <span className="w-6 text-center text-sm font-medium text-muted-foreground">
                {(filters.page! - 1) * filters.limit! + idx + 1}
              </span>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{tenant.name}</p>
                {tenant.city && (
                  <p className="text-xs text-muted-foreground">{tenant.city}</p>
                )}
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                <span className="text-xs text-muted-foreground">{tenant.reviewCount} review{tenant.reviewCount !== 1 ? 's' : ''}</span>
                <RatingBadge rating={tenant.avgRating} />
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setFilters((p) => ({ ...p, page: Math.max(1, (p.page ?? 1) - 1) }))}
            disabled={filters.page === 1}
            className="rounded-md border border-border px-3 py-1.5 text-sm disabled:opacity-40 hover:bg-accent"
          >
            Previous
          </button>
          <span className="text-sm text-muted-foreground">
            Page {filters.page} of {pages}
          </span>
          <button
            onClick={() => setFilters((p) => ({ ...p, page: Math.min(pages, (p.page ?? 1) + 1) }))}
            disabled={filters.page === pages}
            className="rounded-md border border-border px-3 py-1.5 text-sm disabled:opacity-40 hover:bg-accent"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
