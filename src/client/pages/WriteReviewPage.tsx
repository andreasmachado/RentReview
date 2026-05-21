import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { api, ApiError } from '../lib/api.js';
import type { PropertyData, SearchUser } from '../lib/api.js';
import { useAuth } from '../contexts/AuthContext.js';

const formSchema = z.object({
  reviewedRole: z.enum(['tenant', 'landlord']),
  reviewedId: z.string().min(1, 'Please select who you are reviewing'),
  propertyId: z.string().optional(),
  rating: z.number().int().min(1).max(10),
  description: z.string().min(50, 'Description must be at least 50 characters'),
});

type FormValues = z.infer<typeof formSchema>;

export default function WriteReviewPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const prefillReviewedId = searchParams.get('reviewedId') ?? '';
  const prefillPropertyId = searchParams.get('propertyId') ?? '';

  const [searchQ, setSearchQ] = useState('');
  const [searchResults, setSearchResults] = useState<SearchUser[]>([]);
  const [selectedUser, setSelectedUser] = useState<SearchUser | null>(null);
  const [properties, setProperties] = useState<PropertyData[]>([]);
  const [apiError, setApiError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      reviewedRole: 'landlord',
      reviewedId: prefillReviewedId,
      propertyId: prefillPropertyId || undefined,
      rating: 7,
    },
  });

  const reviewedRole = watch('reviewedRole');
  const reviewedId = watch('reviewedId');

  // Load prefilled user
  useEffect(() => {
    if (!prefillReviewedId) return;
    api.users.getProfile(prefillReviewedId).then(({ user }) => {
      setSelectedUser({ ...user, avgRatings: { tenant: null, landlord: null }, reviewCounts: { tenant: 0, landlord: 0 } });
    });
  }, [prefillReviewedId]);

  // Load properties when landlord selected
  useEffect(() => {
    if (reviewedRole !== 'landlord' || !reviewedId) {
      setProperties([]);
      return;
    }
    api.properties.list({ landlord_id: reviewedId }).then(setProperties);
  }, [reviewedRole, reviewedId]);

  // Debounced user search
  useEffect(() => {
    if (searchQ.length < 2) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(() => {
      api.users
        .search({ q: searchQ, role: reviewedRole })
        .then(({ users }) => setSearchResults(users));
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQ, reviewedRole]);

  function selectUser(u: SearchUser) {
    setSelectedUser(u);
    setValue('reviewedId', u.id);
    setSearchQ('');
    setSearchResults([]);
    setValue('propertyId', undefined);
  }

  async function onSubmit(data: FormValues) {
    setApiError(null);
    try {
      await api.reviews.submit({
        reviewedId: data.reviewedId,
        propertyId: data.reviewedRole === 'landlord' ? data.propertyId : undefined,
        reviewedRole: data.reviewedRole,
        rating: data.rating,
        description: data.description,
      });
      setSuccess(true);
      setTimeout(() => navigate(`/users/${data.reviewedId}`), 1500);
    } catch (err) {
      setApiError(err instanceof ApiError ? err.message : 'Failed to submit review');
    }
  }

  const inputClass =
    'w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring';
  const labelClass = 'block text-sm font-medium mb-1';
  const descLength = watch('description')?.length ?? 0;

  if (success) {
    return (
      <div className="max-w-lg mx-auto text-center py-16 space-y-3">
        <p className="text-4xl">✅</p>
        <h2 className="text-xl font-semibold">Review submitted!</h2>
        <p className="text-muted-foreground text-sm">Redirecting to their profile...</p>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Write a review</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {apiError && (
          <div className="text-sm text-destructive rounded-md bg-destructive/10 px-3 py-2">{apiError}</div>
        )}

        {/* Role */}
        <div>
          <label className={labelClass}>You are reviewing them as</label>
          <div className="flex gap-3">
            {(['landlord', 'tenant'] as const).map((role) => (
              <label key={role} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  value={role}
                  {...register('reviewedRole')}
                  className="accent-primary"
                />
                <span className="text-sm capitalize">{role}</span>
              </label>
            ))}
          </div>
        </div>

        {/* User search */}
        <div>
          <label className={labelClass}>
            Who are you reviewing? *
          </label>
          {selectedUser ? (
            <div className="flex items-center gap-3 rounded-md border border-border p-3">
              <div className="flex-1">
                <p className="text-sm font-medium">{selectedUser.name}</p>
                {selectedUser.city && (
                  <p className="text-xs text-muted-foreground">{selectedUser.city}</p>
                )}
              </div>
              <button
                type="button"
                onClick={() => {
                  setSelectedUser(null);
                  setValue('reviewedId', '');
                  setValue('propertyId', undefined);
                }}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                Change
              </button>
            </div>
          ) : (
            <div className="relative">
              <input
                type="search"
                value={searchQ}
                onChange={(e) => setSearchQ(e.target.value)}
                placeholder="Search by name..."
                className={inputClass}
              />
              {searchResults.length > 0 && (
                <div className="absolute z-10 w-full mt-1 rounded-md border border-border bg-background shadow-md max-h-48 overflow-y-auto">
                  {searchResults
                    .filter((u) => u.id !== user?.id)
                    .map((u) => (
                      <button
                        key={u.id}
                        type="button"
                        onClick={() => selectUser(u)}
                        className="w-full text-left px-3 py-2 text-sm hover:bg-accent transition-colors"
                      >
                        <span className="font-medium">{u.name}</span>
                        {u.city && (
                          <span className="ml-2 text-muted-foreground">{u.city}</span>
                        )}
                      </button>
                    ))}
                </div>
              )}
            </div>
          )}
          {errors.reviewedId && (
            <p className="text-xs text-destructive mt-1">{errors.reviewedId.message}</p>
          )}
        </div>

        {/* Property selection (landlord only) */}
        {reviewedRole === 'landlord' && reviewedId && (
          <div>
            <label className={labelClass}>Property *</label>
            {properties.length === 0 ? (
              <p className="text-sm text-muted-foreground">This landlord has no properties registered.</p>
            ) : (
              <select {...register('propertyId')} className={inputClass}>
                <option value="">Select a property...</option>
                {properties.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.address}, {p.city}
                  </option>
                ))}
              </select>
            )}
            {errors.propertyId && (
              <p className="text-xs text-destructive mt-1">{errors.propertyId.message}</p>
            )}
          </div>
        )}

        {/* Rating */}
        <div>
          <label className={labelClass}>Rating: {watch('rating')}/10</label>
          <input
            type="range"
            min={1}
            max={10}
            step={1}
            {...register('rating', { valueAsNumber: true })}
            className="w-full accent-primary"
          />
          <div className="flex justify-between text-xs text-muted-foreground mt-0.5">
            <span>1 (Poor)</span>
            <span>10 (Excellent)</span>
          </div>
          {errors.rating && <p className="text-xs text-destructive mt-1">{errors.rating.message}</p>}
        </div>

        {/* Description */}
        <div>
          <label className={labelClass}>
            Description *{' '}
            <span className={`font-normal ${descLength < 50 ? 'text-muted-foreground' : 'text-green-600'}`}>
              ({descLength}/50 min)
            </span>
          </label>
          <textarea
            {...register('description')}
            rows={5}
            className={`${inputClass} resize-none`}
            placeholder="Describe your experience in detail..."
          />
          {errors.description && (
            <p className="text-xs text-destructive mt-1">{errors.description.message}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-md bg-primary text-primary-foreground py-2.5 text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-opacity"
        >
          {isSubmitting ? 'Submitting...' : 'Submit review'}
        </button>
      </form>
    </div>
  );
}
