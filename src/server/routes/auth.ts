import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { deleteCookie, getCookie, setCookie } from 'hono/cookie';
import { requireAuth } from '../middleware/auth.js';
import { rateLimit } from '../middleware/rateLimit.js';
import { authService } from '../services/authService.js';
import { loginSchema, registerSchema } from '../lib/validation.js';
import { COOKIE_OPTIONS, SESSION_COOKIE } from '../lib/session.js';
import { apiSuccess, apiError, handleError } from '../lib/response.js';
import { config } from '../lib/config.js';
import type { User } from '../db/schema.js';

type Variables = { user: User };
const auth = new Hono<{ Variables: Variables }>();

auth.post('/register', rateLimit, zValidator('json', registerSchema), async (c) => {
  try {
    const input = c.req.valid('json');
    const user = await authService.register(input);
    return apiSuccess(c, { user }, 201);
  } catch (err) {
    return handleError(c, err);
  }
});

auth.post('/login', rateLimit, zValidator('json', loginSchema), async (c) => {
  try {
    const input = c.req.valid('json');
    const { sessionId, user } = await authService.login(input);
    setCookie(c, SESSION_COOKIE, sessionId, {
      ...COOKIE_OPTIONS,
      secure: config.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 60,
    });
    return apiSuccess(c, { user });
  } catch (err) {
    return handleError(c, err);
  }
});

auth.post('/logout', requireAuth, async (c) => {
  const sessionId = getCookie(c, SESSION_COOKIE);
  if (sessionId) await authService.logout(sessionId);
  deleteCookie(c, SESSION_COOKIE, { path: '/' });
  return apiSuccess(c, null);
});

auth.get('/verify/:token', async (c) => {
  try {
    await authService.verifyEmail(c.req.param('token'));
    return c.redirect(`${config.FRONTEND_URL}/login?verified=true`);
  } catch (err) {
    return c.redirect(`${config.FRONTEND_URL}/login?error=invalid_token`);
  }
});

auth.get('/me', requireAuth, (c) => {
  const user = c.get('user');
  const { passwordHash: _, ...safeUser } = user as Record<string, unknown> & { passwordHash: string };
  return apiSuccess(c, { user: safeUser });
});

export { auth as authRouter };
