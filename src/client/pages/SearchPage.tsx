import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api.js';
import type { PropertyWithStats, SearchUser } from '../lib/api.js';
import { UserCard } from '../components/UserCard.js';

type Tab = 'landlords' | 'tenants' | 'properties';

function PropertyCard({ property }: { property: PropertyWithStats }) {
  return (
    <Link
      to={`/properties/${property.id}`}
      className="flex items-center gap-4 rounded-lg border border-border p-4 hover:bg-accent transition-colors"
    >
      <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-lg">
        🏠
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm truncate">{property.address}</p>
        <p className="text-xs text-muted-foreground capitalize">{property.city} · {property.propertyType}</p>
      </div>
      <div className="flex-shrink-0 text-right text-xs text-muted-foreground">
        {property.avgRating !== null ? (
          <div className="font-semibold text-foreground">{property.avgRating.toFixed(1)}/10</div>
        ) : (
          <div>No ratings</div>
        )}
        <div>{property.reviewCount} review{property.reviewCount !== 1 ? 's' : ''}</div>
      </div>
    </Link>
  );
}

export default function SearchPage() {
  const [tab, setTab] = useState<Tab>('landlords');
  const [q, setQ] = useState('');
  const [city, setCity] = useState('');
  const [userResults, setUserResults] = useState<SearchUser[] | null>(null);
  const [propResults, setPropResults] = useState<PropertyWithStats[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (!q && !city) {
      setUserResults(null);
      setPropResults(null);
      return;
    }

    setIsLoading(true);
    timerRef.current = setTimeout(() => {
      if (tab === 'properties') {
        api.properties
          .list({ city: city || undefined, q: q || undefined })
          .then(setPropResults)
          .catch(() => setPropResults([]))
          .finally(() => setIsLoading(false));
      } else {
        const role = tab === 'landlords' ? 'landlord' : 'tenant';
        api.users
          .search({ q: q || undefined, city: city || undefined, role })
          .then(({ users }) => setUserResults(users))
          .catch(() => setUserResults([]))
          .finally(() => setIsLoading(false));
      }
    }, 300);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [q, city, tab]);

  const tabs: { key: Tab; label: string }[] = [
    { key: 'landlords', label: 'Landlords' },
    { key: 'tenants', label: 'Tenants' },
    { key: 'properties', label: 'Properties' },
  ];

  const results = tab === 'properties' ? propResults : userResults;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Search</h1>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => {
              setTab(t.key);
              setUserResults(null);
              setPropResults(null);
            }}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
              tab === t.key
                ? 'border-primary text-foreground'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <input
          type="search"
          placeholder={tab === 'properties' ? 'Search by address...' : 'Search by name...'}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
        <input
          type="text"
          placeholder="City (optional)"
          value={city}
          onChange={(e) => setCity(e.target.value)}
          className="w-40 rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      {isLoading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 rounded-lg bg-muted animate-pulse" />
          ))}
        </div>
      )}

      {!isLoading && results === null && (
        <p className="text-muted-foreground text-sm">
          {tab === 'properties' ? 'Enter an address or city to find properties.' : 'Enter a name or city to search.'}
        </p>
      )}

      {!isLoading && results !== null && results.length === 0 && (
        <p className="text-muted-foreground text-sm">No results found.</p>
      )}

      {!isLoading && results !== null && results.length > 0 && (
        <div className="space-y-2">
          {tab === 'properties'
            ? (propResults ?? []).map((p) => <PropertyCard key={p.id} property={p} />)
            : (userResults ?? []).map((u) => <UserCard key={u.id} user={u} />)}
        </div>
      )}
    </div>
  );
}
