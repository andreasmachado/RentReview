import { useState, useEffect, useCallback } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { api } from '../lib/api.js';
import type { PropertyRankItem, RankingParams } from '../lib/api.js';

type ViewMode = 'list' | 'map';

function RatingBadge({ rating }: { rating: number }) {
  const colour =
    rating >= 8 ? 'bg-green-100 text-green-800' : rating >= 5 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800';
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-sm font-bold ${colour}`}>
      {rating.toFixed(1)}
    </span>
  );
}

// Lazy-loaded map component to avoid SSR issues with Leaflet
function MapView({ items }: { items: PropertyRankItem[] }) {
  const [MapComponents, setMapComponents] = useState<{
    MapContainer: React.ComponentType<{ center: [number, number]; zoom: number; style: React.CSSProperties; children: React.ReactNode }>;
    TileLayer: React.ComponentType<{ url: string; attribution: string }>;
    Marker: React.ComponentType<{ position: [number, number]; icon?: unknown; children?: React.ReactNode }>;
    Popup: React.ComponentType<{ children: React.ReactNode }>;
  } | null>(null);

  useEffect(() => {
    Promise.all([
      import('react-leaflet'),
      import('leaflet'),
    ]).then(([rl, L]) => {
      // Fix default marker icon
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      });
      setMapComponents({
        MapContainer: rl.MapContainer as unknown as React.ComponentType<{ center: [number, number]; zoom: number; style: React.CSSProperties; children: React.ReactNode }>,
        TileLayer: rl.TileLayer as unknown as React.ComponentType<{ url: string; attribution: string }>,
        Marker: rl.Marker as unknown as React.ComponentType<{ position: [number, number]; icon?: unknown }>,
        Popup: rl.Popup as unknown as React.ComponentType<{ children: React.ReactNode }>,
      });
    });
  }, []);

  const withCoords = items.filter((p) => p.latitude && p.longitude);

  if (!MapComponents) {
    return <div className="h-96 bg-muted rounded-lg flex items-center justify-center text-muted-foreground text-sm">Loading map...</div>;
  }

  const { MapContainer, TileLayer, Marker, Popup } = MapComponents;

  const centre: [number, number] = withCoords.length > 0
    ? [withCoords[0].latitude!, withCoords[0].longitude!]
    : [39.5, -8.0];

  return (
    <MapContainer center={centre} zoom={7} style={{ height: '480px', width: '100%', borderRadius: '0.5rem' }}>
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://openstreetmap.org">OpenStreetMap</a>'
      />
      {withCoords.map((p) => (
        <Marker key={p.id} position={[p.latitude!, p.longitude!]}>
          <Popup>
            <div className="text-sm space-y-1">
              <p className="font-semibold">{p.address}</p>
              <p className="text-muted-foreground">{p.city} · {p.propertyType}</p>
              <p>Rating: <strong>{p.avgRating.toFixed(1)}/10</strong></p>
              <p>{p.reviewCount} review{p.reviewCount !== 1 ? 's' : ''}</p>
              <a href={`/properties/${p.id}`} className="text-blue-600 hover:underline text-xs">
                View property →
              </a>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}

export default function RankingsPropertiesPage() {
  const [items, setItems] = useState<PropertyRankItem[]>([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('list');

  const [filters, setFilters] = useState<RankingParams>({
    sort: 'highest_rated',
    page: 1,
    limit: 20,
  });

  useEffect(() => {
    setLoading(true);
    api.rankings
      .properties(filters)
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

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Property rankings</h1>
        <div className="flex rounded-md border border-border overflow-hidden text-sm">
          <button
            onClick={() => setViewMode('list')}
            className={`px-3 py-1.5 ${viewMode === 'list' ? 'bg-primary text-primary-foreground' : 'hover:bg-accent'}`}
          >
            List
          </button>
          <button
            onClick={() => setViewMode('map')}
            className={`px-3 py-1.5 ${viewMode === 'map' ? 'bg-primary text-primary-foreground' : 'hover:bg-accent'}`}
          >
            Map
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <input
          type="text"
          placeholder="Filter by city..."
          className="rounded-md border border-input bg-background px-3 py-1.5 text-sm"
          onChange={(e) => updateFilter('city', e.target.value || undefined)}
        />
        <select
          className="rounded-md border border-input bg-background px-3 py-1.5 text-sm"
          onChange={(e) => updateFilter('type', e.target.value || undefined)}
        >
          <option value="">All property types</option>
          <option value="apartment">Apartment</option>
          <option value="house">House</option>
          <option value="studio">Studio</option>
          <option value="room">Room</option>
          <option value="other">Other</option>
        </select>
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

      <p className="text-sm text-muted-foreground">{total} propert{total !== 1 ? 'ies' : 'y'} found</p>

      {viewMode === 'map' && !loading && <MapView items={items} />}

      {viewMode === 'list' && (
        <>
          {loading && (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-20 rounded-lg bg-muted animate-pulse" />
              ))}
            </div>
          )}

          {!loading && items.length === 0 && (
            <p className="text-muted-foreground">No properties match the current filters.</p>
          )}

          {!loading && (
            <div className="space-y-2">
              {items.map((property, idx) => (
                <Link
                  key={property.id}
                  to={`/properties/${property.id}`}
                  className="flex items-center gap-4 rounded-lg border border-border p-4 hover:bg-accent transition-colors"
                >
                  <span className="w-6 text-center text-sm font-medium text-muted-foreground">
                    {(filters.page! - 1) * filters.limit! + idx + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{property.address}</p>
                    <p className="text-xs text-muted-foreground capitalize">
                      {property.city} · {property.propertyType}
                      {property.bedrooms ? ` · ${property.bedrooms} bed` : ''}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Landlord: {property.landlordName}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className="text-xs text-muted-foreground">{property.reviewCount} review{property.reviewCount !== 1 ? 's' : ''}</span>
                    <RatingBadge rating={property.avgRating} />
                  </div>
                </Link>
              ))}
            </div>
          )}

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
        </>
      )}
    </div>
  );
}
