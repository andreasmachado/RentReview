import { eq } from 'drizzle-orm';
import { db } from '../db/index.js';
import { emailVerificationTokens } from '../db/schema.js';
import type { EmailVerificationToken } from '../db/schema.js';

export const emailVerificationRepository = {
  async create(data: Omit<EmailVerificationToken, 'id' | 'createdAt'>): Promise<EmailVerificationToken> {
    return db.insert(emailVerificationTokens).values(data).returning().get();
  },

  async findByToken(token: string): Promise<EmailVerificationToken | null> {
    return (
      db
        .select()
        .from(emailVerificationTokens)
        .where(eq(emailVerificationTokens.token, token))
        .get() ?? null
    );
  },

  async deleteByUserId(userId: string): Promise<void> {
    await db
      .delete(emailVerificationTokens)
      .where(eq(emailVerificationTokens.userId, userId));
  },
};
