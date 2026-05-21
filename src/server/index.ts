import 'dotenv/config';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { serve } from '@hono/node-server';
import { serveStatic } from '@hono/node-server/serve-static';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { db } from './db/index.js';
import { config } from './lib/config.js';
import { apiSuccess } from './lib/response.js';
import { authRouter } from './routes/auth.js';

// Run migrations before accepting requests
migrate(db, { migrationsFolder: './drizzle/migrations' });
import { usersRouter } from './routes/users.js';
import propertiesRouter from './routes/properties.js';
import reviewsRouter from './routes/reviews.js';
import rankingsRouter from './routes/rankings.js';

const app = new Hono();

app.use('*', logger());
app.use(
  '/api/*',
  cors({
    origin: config.FRONTEND_URL,
    credentials: true,
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type'],
  })
);

app.get('/api/health', (c) => apiSuccess(c, { status: 'ok' }));

app.route('/api/auth', authRouter);
app.route('/api/users', usersRouter);
app.route('/api/properties', propertiesRouter);
app.route('/api/reviews', reviewsRouter);
app.route('/api/rankings', rankingsRouter);

if (config.NODE_ENV === 'production') {
  app.use('/*', serveStatic({ root: './dist/client' }));
  app.get('/*', serveStatic({ path: './dist/client/index.html' }));
}

serve(
  { fetch: app.fetch, port: config.PORT },
  (info) => console.log(`Server running on http://localhost:${info.port}`)
);

export default app;
