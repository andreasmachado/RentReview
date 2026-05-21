import type { Context, Next } from 'hono';
import { ErrorCode } from '../lib/errors.js';
import { apiError } from '../lib/response.js';
import { getSessionUser } from '../lib/session.js';

export async function requireAuth(c: Context, next: Next) {
  const user = await getSessionUser(c);
  if (!user) {
    return apiError(c, ErrorCode.UNAUTHORIZED, 'Authentication required', 401);
  }
  c.set('user', user);
  await next();
}

export async function optionalAuth(c: Context, next: Next) {
  const user = await getSessionUser(c);
  c.set('user', user ?? null);
  await next();
}
