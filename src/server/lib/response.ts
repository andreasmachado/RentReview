import type { Context } from 'hono';
import type { ContentfulStatusCode } from 'hono/utils/http-status';
import { AppError } from './errors.js';

export function apiSuccess<T>(c: Context, data: T, status: ContentfulStatusCode = 200) {
  return c.json({ success: true as const, data }, status);
}

export function apiError(
  c: Context,
  code: string,
  message: string,
  status: ContentfulStatusCode = 400
) {
  return c.json({ success: false as const, error: { code, message } }, status);
}

export function handleError(c: Context, err: unknown) {
  if (err instanceof AppError) {
    return apiError(c, err.code, err.message, err.statusCode as ContentfulStatusCode);
  }
  console.error('Unexpected error:', err);
  return apiError(c, 'INTERNAL_ERROR', 'An unexpected error occurred', 500);
}
