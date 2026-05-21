import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { api, ApiError } from '../lib/api.js';
import type { PropertyWithStats } from '../lib/api.js';
import { useAuth } from '../contexts/AuthContext.js';
import { createPropertySchema, type CreatePropertyInput } from '@shared/validation';

function PropertyForm({
  onSuccess,
  onCancel,
}: {
  onSuccess: (p: PropertyWithStats) => void;
  onCancel: () => void;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CreatePropertyInput>({ resolver: zodResolver(createPropertySchema) });

  const [apiError, setApiError] = useState<string | null>(null);

  async function onSubmit(data: CreatePropertyInput) {
    setApiError(null);
    try {
      const property = await api.properties.create(data);
      onSuccess({ ...property, avgRating: null, reviewCount: 0 });
    } catch (err) {
      setApiError(err instanceof ApiError ? err.message : 'Failed to create property');
    }
  }

  const inputClass =
    'w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring';
  const labelClass = 'block text-sm font-medium mb-1';

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 rounded-lg border border-border p-5">
      <h3 className="font-semibold text-base">Add a new property</h3>
      {apiError && (
        <div className="text-sm text-destructive rounded-md bg-destructive/10 px-3 py-2">{apiError}</div>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className={labelClass}>Address *</label>
          <input {...register('address')} className={inputClass} placeholder="Rua de Exemplo, 123" />
          {errors.address && <p className="text-xs text-destructive mt-1">{errors.address.message}</p>}
        </div>
        <div>
          <label className={labelClass}>City *</label>
          <input {...register('city')} className={inputClass} placeholder="Lisbon" />
          {errors.city && <p className="text-xs text-destructive mt-1">{errors.city.message}</p>}
        </div>
        <div>
          <label className={labelClass}>Postcode</label>
          <input {...register('postcode')} className={inputClass} placeholder="1000-001" />
        </div>
        <div>
          <label className={labelClass}>Property type *</label>
          <select {...register('propertyType')} className={inputClass}>
            <option value="apartment">Apartment</option>
            <option value="house">House</option>
            <option value="studio">Studio</option>
            <option value="room">Room</option>
            <option value="other">Other</option>
          </select>
        </div>
        <div>
          <label className={labelClass}>Bedrooms</label>
          <input
            {...register('bedrooms', { valueAsNumber: true })}
            type="number"
            min={0}
            max={20}
            className={inputClass}
            placeholder="2"
          />
        </div>
        <div>
          <label className={labelClass}>Latitude</label>
          <input
            {...register('latitude', { valueAsNumber: true })}
            type="number"
            step="any"
            className={inputClass}
            placeholder="38.7169"
          />
        </div>
        <div>
          <label className={labelClass}>Longitude</label>
          <input
            {...register('longitude', { valueAsNumber: true })}
            type="number"
            step="any"
            className={inputClass}
            placeholder="-9.1399"
          />
        </div>
        <div className="sm:col-span-2">
          <label className={labelClass}>Description</label>
          <textarea
            {...register('description')}
            rows={3}
            className={`${inputClass} resize-none`}
            placeholder="Brief description of the property..."
          />
        </div>
      </div>
      <div className="flex gap-2 pt-1">
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-md bg-primary text-primary-foreground px-4 py-2 text-sm font-medium hover:opacity-90 disabled:opacity-50"
        >
          {isSubmitting ? 'Saving...' : 'Add property'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-md border border-border px-4 py-2 text-sm hover:bg-accent"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

export default function MyPropertiesPage() {
  const { user } = useAuth();
  const [properties, setProperties] = useState<PropertyWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    if (!user) return;
    api.properties
      .list({ landlord_id: user.id })
      .then(setProperties)
      .finally(() => setLoading(false));
  }, [user]);

  function handleAdded(p: PropertyWithStats) {
    setProperties((prev) => [p, ...prev]);
    setShowForm(false);
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this property? This cannot be undone.')) return;
    await api.properties.delete(id);
    setProperties((prev) => prev.filter((p) => p.id !== id));
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">My properties</h1>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="rounded-md bg-primary text-primary-foreground px-4 py-2 text-sm font-medium hover:opacity-90"
          >
            + Add property
          </button>
        )}
      </div>

      {showForm && (
        <PropertyForm onSuccess={handleAdded} onCancel={() => setShowForm(false)} />
      )}

      {loading && (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="h-24 rounded-lg bg-muted animate-pulse" />
          ))}
        </div>
      )}

      {!loading && properties.length === 0 && !showForm && (
        <div className="rounded-lg border border-dashed border-border p-10 text-center">
          <p className="text-muted-foreground">You haven't added any properties yet.</p>
          <button
            onClick={() => setShowForm(true)}
            className="mt-3 text-primary text-sm hover:underline"
          >
            Add your first property →
          </button>
        </div>
      )}

      <div className="space-y-3">
        {properties.map((p) => (
          <div key={p.id} className="rounded-lg border border-border p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <Link
                  to={`/properties/${p.id}`}
                  className="font-medium hover:text-primary transition-colors"
                >
                  {p.address}
                </Link>
                <p className="text-sm text-muted-foreground mt-0.5 capitalize">
                  {p.city} · {p.propertyType} {p.bedrooms ? `· ${p.bedrooms} bed` : ''}
                </p>
                <div className="flex items-center gap-3 mt-2 text-sm">
                  {p.avgRating !== null ? (
                    <span className="font-semibold">{p.avgRating.toFixed(1)}/10</span>
                  ) : (
                    <span className="text-muted-foreground text-xs">No ratings yet</span>
                  )}
                  <span className="text-xs text-muted-foreground">
                    {p.reviewCount} review{p.reviewCount !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>
              <button
                onClick={() => handleDelete(p.id)}
                className="ml-3 text-xs text-muted-foreground hover:text-destructive transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
