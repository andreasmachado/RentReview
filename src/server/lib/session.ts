import { eq } from 'drizzle-orm';
import type { Context } from 'hono';
import { getCookie } from 'hono/cookie';
import { db } from '../db/index.js';
import { sessions, users } from '../db/schema.js';
import type { User } from '../db/schema.js';

export const SESSION_COOKIE = 'session_id';

export const COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: 'Lax' as const,
  path: '/',
};

export async function getSessionUser(c: Context): Promise<User | null> {
  const sessionId = getCookie(c, SESSION_COOKIE);
  if (!sessionId) return null;

  const row = await db
    .select({ session: sessions, user: users })
    .from(sessions)
    .innerJoin(users, eq(sessions.userId, users.id))
    .where(eq(sessions.id, sessionId))
    .get();

  if (!row) return null;
  if (new Date(row.session.expiresAt) < new Date()) return null;

  return row.user;
}
