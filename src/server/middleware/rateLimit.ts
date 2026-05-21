import type { Context, Next } from 'hono';
import { ErrorCode } from '../lib/errors.js';
import { apiError } from '../lib/response.js';

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();
const WINDOW_MS = 60_000;
const MAX_REQUESTS = 5;

export function rateLimit(c: Context, next: Next) {
  const ip = c.req.header('x-forwarded-for')?.split(',')[0].trim() ?? 'unknown';
  const now = Date.now();

  const entry = store.get(ip);
  if (!entry || now > entry.resetAt) {
    store.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return next();
  }

  if (entry.count >= MAX_REQUESTS) {
    return apiError(c, ErrorCode.RATE_LIMITED, 'Too many requests, please try again later', 429);
  }

  entry.count++;
  return next();
}
