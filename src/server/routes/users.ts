import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { optionalAuth, requireAuth } from '../middleware/auth.js';
import { userService } from '../services/userService.js';
import { updateProfileSchema } from '../lib/validation.js';
import { apiSuccess, handleError } from '../lib/response.js';
import type { User } from '../db/schema.js';

type Variables = { user: User };
const users = new Hono<{ Variables: Variables }>();

users.get('/search', async (c) => {
  try {
    const q = c.req.query('q');
    const city = c.req.query('city');
    const role = c.req.query('role') as 'tenant' | 'landlord' | undefined;
    const results = userService.searchUsers(q, city, role);
    return apiSuccess(c, { users: results });
  } catch (err) {
    return handleError(c, err);
  }
});

users.get('/:id', optionalAuth, async (c) => {
  try {
    const profile = userService.getPublicProfile(c.req.param('id')!);
    return apiSuccess(c, profile);
  } catch (err) {
    return handleError(c, err);
  }
});

users.put('/me', requireAuth, zValidator('json', updateProfileSchema), async (c) => {
  try {
    const currentUser = c.get('user') as User;
    const input = c.req.valid('json');
    const updated = userService.updateProfile(currentUser.id, input);
    return apiSuccess(c, { user: updated });
  } catch (err) {
    return handleError(c, err);
  }
});

export { users as usersRouter };
