import { eq, lt } from 'drizzle-orm';
import { db } from '../db/index.js';
import { sessions } from '../db/schema.js';
import type { Session } from '../db/schema.js';

export const sessionRepository = {
  async create(data: Session): Promise<Session> {
    return db.insert(sessions).values(data).returning().get();
  },

  async findById(id: string): Promise<Session | null> {
    return db.select().from(sessions).where(eq(sessions.id, id)).get() ?? null;
  },

  async deleteById(id: string): Promise<void> {
    await db.delete(sessions).where(eq(sessions.id, id));
  },

  async deleteExpired(): Promise<void> {
    await db.delete(sessions).where(lt(sessions.expiresAt, new Date().toISOString()));
  },
};
