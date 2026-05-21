import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth.js';
import { handleError } from '../lib/response.js';
import { apiSuccess } from '../lib/response.js';
import { createPropertySchema, updatePropertySchema } from '../lib/validation.js';
import { propertyService } from '../services/propertyService.js';
import { reviewService } from '../services/reviewService.js';
import type { User } from '../db/schema.js';

type Variables = { user: User };
const app = new Hono<{ Variables: Variables }>();

const listQuerySchema = z.object({
  landlord_id: z.string().optional(),
  city: z.string().optional(),
  type: z.string().optional(),
  q: z.string().optional(),
});

app.get('/', zValidator('query', listQuerySchema), async (c) => {
  try {
    const { landlord_id, city, type, q } = c.req.valid('query');
    if (landlord_id) {
      const props = await propertyService.getByLandlordId(landlord_id);
      return apiSuccess(c, props);
    }
    const props = propertyService.search({ city, type, q });
    return apiSuccess(c, props);
  } catch (err) {
    return handleError(c, err);
  }
});

app.post('/', requireAuth, zValidator('json', createPropertySchema), async (c) => {
  try {
    const user = c.get('user');
    const data = c.req.valid('json');
    const property = await propertyService.create(user.id, data);
    return apiSuccess(c, property, 201);
  } catch (err) {
    return handleError(c, err);
  }
});

app.get('/:id', async (c) => {
  try {
    const property = await propertyService.getById(c.req.param('id')!);
    const reviews = reviewService.getByPropertyId(property.id);
    return apiSuccess(c, { ...property, reviews });
  } catch (err) {
    return handleError(c, err);
  }
});

app.put('/:id', requireAuth, zValidator('json', updatePropertySchema), async (c) => {
  try {
    const user = c.get('user');
    const data = c.req.valid('json');
    const updated = await propertyService.update(c.req.param('id')!, user.id, data);
    return apiSuccess(c, updated);
  } catch (err) {
    return handleError(c, err);
  }
});

app.delete('/:id', requireAuth, async (c) => {
  try {
    const user = c.get('user');
    await propertyService.delete(c.req.param('id')!, user.id);
    return apiSuccess(c, { deleted: true });
  } catch (err) {
    return handleError(c, err);
  }
});

export default app;
