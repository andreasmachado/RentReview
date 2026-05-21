import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth.js';
import { handleError, apiSuccess } from '../lib/response.js';
import { submitReviewSchema } from '../lib/validation.js';
import { reviewService } from '../services/reviewService.js';
import type { User } from '../db/schema.js';

type Variables = { user: User };
const app = new Hono<{ Variables: Variables }>();

const listQuerySchema = z.object({
  reviewed_id: z.string().optional(),
  property_id: z.string().optional(),
  role: z.enum(['tenant', 'landlord']).optional(),
});

app.get('/', zValidator('query', listQuerySchema), async (c) => {
  try {
    const { reviewed_id, property_id, role } = c.req.valid('query');
    if (property_id) {
      const reviews = reviewService.getByPropertyId(property_id);
      return apiSuccess(c, reviews);
    }
    if (reviewed_id) {
      const reviews = reviewService.getByReviewedId(reviewed_id);
      const filtered = role ? reviews.filter((r) => r.reviewedRole === role) : reviews;
      return apiSuccess(c, filtered);
    }
    return apiSuccess(c, []);
  } catch (err) {
    return handleError(c, err);
  }
});

app.post('/', requireAuth, zValidator('json', submitReviewSchema), async (c) => {
  try {
    const user = c.get('user');
    const data = c.req.valid('json');
    const review = await reviewService.submit(user.id, data);
    return apiSuccess(c, review, 201);
  } catch (err) {
    return handleError(c, err);
  }
});

app.get('/:id', async (c) => {
  try {
    const review = reviewService.getById(c.req.param('id')!);
    return apiSuccess(c, review);
  } catch (err) {
    return handleError(c, err);
  }
});

app.delete('/:id', requireAuth, async (c) => {
  try {
    const user = c.get('user');
    await reviewService.delete(c.req.param('id')!, user.id);
    return apiSuccess(c, { deleted: true });
  } catch (err) {
    return handleError(c, err);
  }
});

export default app;
