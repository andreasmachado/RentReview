import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { handleError, apiSuccess } from '../lib/response.js';
import { rankingQuerySchema } from '../lib/validation.js';
import { rankingService } from '../services/rankingService.js';

const app = new Hono();

app.get('/tenants', zValidator('query', rankingQuerySchema), async (c) => {
  try {
    const query = c.req.valid('query');
    const result = rankingService.tenants(query);
    return apiSuccess(c, result);
  } catch (err) {
    return handleError(c, err);
  }
});

app.get('/landlords', zValidator('query', rankingQuerySchema), async (c) => {
  try {
    const query = c.req.valid('query');
    const result = rankingService.landlords(query);
    return apiSuccess(c, result);
  } catch (err) {
    return handleError(c, err);
  }
});

app.get('/properties', zValidator('query', rankingQuerySchema), async (c) => {
  try {
    const query = c.req.valid('query');
    const result = rankingService.propertiesRanking(query);
    return apiSuccess(c, result);
  } catch (err) {
    return handleError(c, err);
  }
});

export default app;
