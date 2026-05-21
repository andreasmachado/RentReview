import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import { updateProfileSchema } from '@shared/validation';
import type { UpdateProfileInput } from '@shared/validation';
import { useAuth } from '../contexts/AuthContext.js';
import { api, ApiError } from '../lib/api.js';

export default function ProfileEditPage() {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<UpdateProfileInput>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: {
      name: user?.name ?? '',
      city: user?.city ?? '',
      bio: user?.bio ?? '',
    },
  });

  async function onSubmit(data: UpdateProfileInput) {
    try {
      await api.users.updateProfile(data);
      await refreshUser();
      navigate(`/users/${user!.id}`);
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to update profile';
      setError('root', { message });
    }
  }

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Edit profile</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Full name</label>
          <input
            {...register('name')}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
          {errors.name && (
            <p className="text-destructive text-xs mt-1">{errors.name.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">City / Region</label>
          <input
            {...register('city')}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
          {errors.city && (
            <p className="text-destructive text-xs mt-1">{errors.city.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Bio</label>
          <textarea
            {...register('bio')}
            rows={3}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
          />
          {errors.bio && (
            <p className="text-destructive text-xs mt-1">{errors.bio.message}</p>
          )}
        </div>

        {errors.root && (
          <p className="text-destructive text-sm">{errors.root.message}</p>
        )}

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-md bg-primary text-primary-foreground px-4 py-2 text-sm font-medium hover:opacity-90 disabled:opacity-50"
          >
            {isSubmitting ? 'Saving...' : 'Save changes'}
          </button>
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="rounded-md border border-border px-4 py-2 text-sm hover:bg-accent"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
