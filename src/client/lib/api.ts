import type {
  CreatePropertyInput,
  LoginInput,
  RegisterInput,
  SubmitReviewInput,
  UpdateProfileInput,
} from '@shared/validation';

type ApiResponse<T> = { success: true; data: T } | { success: false; error: { code: string; message: string } };

class ApiError extends Error {
  constructor(
    public code: string,
    message: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...init?.headers },
    ...init,
  });

  const json = (await res.json()) as ApiResponse<T>;

  if (!json.success) {
    throw new ApiError(json.error.code, json.error.message);
  }

  return json.data;
}

function get<T>(path: string) {
  return request<T>(path, { method: 'GET' });
}

function post<T>(path: string, body?: unknown) {
  return request<T>(path, { method: 'POST', body: body ? JSON.stringify(body) : undefined });
}

function put<T>(path: string, body?: unknown) {
  return request<T>(path, { method: 'PUT', body: body ? JSON.stringify(body) : undefined });
}

function del<T>(path: string) {
  return request<T>(path, { method: 'DELETE' });
}

export { ApiError };

export const api = {
  auth: {
    me: () => get<{ user: AuthUser }>('/api/auth/me'),
    register: (data: RegisterInput) => post<{ user: AuthUser }>('/api/auth/register', data),
    login: (data: LoginInput) => post<{ user: AuthUser }>('/api/auth/login', data),
    logout: () => post<null>('/api/auth/logout'),
  },
  users: {
    getProfile: (id: string) => get<ProfileData>(`/api/users/${id}`),
    search: (params: { q?: string; city?: string; role?: string }) => {
      const qs = new URLSearchParams();
      if (params.q) qs.set('q', params.q);
      if (params.city) qs.set('city', params.city);
      if (params.role) qs.set('role', params.role);
      return get<{ users: SearchUser[] }>(`/api/users/search?${qs}`);
    },
    updateProfile: (data: UpdateProfileInput) => put<{ user: AuthUser }>('/api/users/me', data),
  },
  properties: {
    create: (data: CreatePropertyInput) => post<PropertyData>('/api/properties', data),
    list: (params: { landlord_id?: string; city?: string; type?: string; q?: string }) => {
      const qs = new URLSearchParams();
      Object.entries(params).forEach(([k, v]) => v && qs.set(k, v));
      return get<PropertyWithStats[]>(`/api/properties?${qs}`);
    },
    get: (id: string) => get<PropertyWithReviews>(`/api/properties/${id}`),
    update: (id: string, data: Partial<CreatePropertyInput>) =>
      put<PropertyData>(`/api/properties/${id}`, data),
    delete: (id: string) => del<{ deleted: boolean }>(`/api/properties/${id}`),
  },
  reviews: {
    submit: (data: SubmitReviewInput) => post<ReviewData>('/api/reviews', data),
    list: (params: { reviewed_id?: string; property_id?: string; role?: string }) => {
      const qs = new URLSearchParams();
      Object.entries(params).forEach(([k, v]) => v && qs.set(k, v));
      return get<ReviewData[]>(`/api/reviews?${qs}`);
    },
    get: (id: string) => get<ReviewData>(`/api/reviews/${id}`),
    delete: (id: string) => del<{ deleted: boolean }>(`/api/reviews/${id}`),
  },
  rankings: {
    tenants: (params: RankingParams) =>
      get<RankingResult<TenantRankItem>>(`/api/rankings/tenants?${buildRankingParams(params)}`),
    landlords: (params: RankingParams) =>
      get<RankingResult<LandlordRankItem>>(`/api/rankings/landlords?${buildRankingParams(params)}`),
    properties: (params: RankingParams) =>
      get<RankingResult<PropertyRankItem>>(`/api/rankings/properties?${buildRankingParams(params)}`),
  },
};

function buildRankingParams(params: RankingParams): string {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') qs.set(k, String(v));
  });
  return qs.toString();
}

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  city: string | null;
  bio: string | null;
  emailVerified: number;
  createdAt: string;
  updatedAt: string;
}

export interface ReviewData {
  id: string;
  reviewerId: string;
  reviewedId: string;
  propertyId: string | null;
  reviewedRole: 'tenant' | 'landlord';
  rating: number;
  description: string;
  ratingDetails: string | null;
  createdAt: string;
}

export interface PropertyData {
  id: string;
  landlordId: string;
  address: string;
  city: string;
  postcode: string | null;
  latitude: number | null;
  longitude: number | null;
  propertyType: 'apartment' | 'house' | 'studio' | 'room' | 'other';
  bedrooms: number | null;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PropertyWithStats extends PropertyData {
  avgRating: number | null;
  reviewCount: number;
}

export interface PropertyWithReviews extends PropertyWithStats {
  reviews: ReviewData[];
}

export interface ProfileData {
  user: AuthUser;
  reviews: { tenant: ReviewData[]; landlord: ReviewData[] };
  avgRatings: { tenant: number | null; landlord: number | null };
  properties: PropertyWithStats[];
}

export interface SearchUser extends AuthUser {
  avgRatings: { tenant: number | null; landlord: number | null };
  reviewCounts: { tenant: number; landlord: number };
}

export interface RankingParams {
  city?: string;
  type?: string;
  minRating?: number;
  maxRating?: number;
  minReviews?: number;
  sort?: 'highest_rated' | 'lowest_rated' | 'most_reviewed' | 'most_recent';
  page?: number;
  limit?: number;
}

export interface RankingResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface TenantRankItem {
  id: string;
  name: string;
  city: string | null;
  avgRating: number;
  reviewCount: number;
  lastReview: string;
}

export interface LandlordRankItem extends TenantRankItem {
  propertyCount: number;
}

export interface PropertyRankItem {
  id: string;
  address: string;
  city: string;
  postcode: string | null;
  propertyType: string;
  bedrooms: number | null;
  latitude: number | null;
  longitude: number | null;
  landlordId: string;
  landlordName: string;
  avgRating: number;
  reviewCount: number;
  lastReview: string;
}
