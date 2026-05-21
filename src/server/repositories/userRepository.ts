import { and, eq, like, or } from 'drizzle-orm';
import { db } from '../db/index.js';
import { users } from '../db/schema.js';
import type { NewUser, User } from '../db/schema.js';

export const userRepository = {
  findById(id: string): User | null {
    return db.select().from(users).where(eq(users.id, id)).get() ?? null;
  },

  findByEmail(email: string): User | null {
    return db.select().from(users).where(eq(users.email, email.toLowerCase())).get() ?? null;
  },

  create(data: Omit<NewUser, 'id' | 'createdAt' | 'updatedAt'>): User {
    return db
      .insert(users)
      .values({ ...data, email: data.email.toLowerCase() })
      .returning()
      .get();
  },

  update(id: string, data: Partial<Pick<User, 'name' | 'city' | 'bio'>>): User {
    return db
      .update(users)
      .set({ ...data, updatedAt: new Date().toISOString() })
      .where(eq(users.id, id))
      .returning()
      .get();
  },

  setEmailVerified(id: string): void {
    db.update(users)
      .set({ emailVerified: 1, updatedAt: new Date().toISOString() })
      .where(eq(users.id, id))
      .run();
  },

  search(q?: string, city?: string): User[] {
    const conditions = [];
    if (q) {
      conditions.push(or(like(users.name, `%${q}%`), like(users.city, `%${q}%`)));
    }
    if (city) {
      conditions.push(like(users.city, `%${city}%`));
    }
    return db
      .select()
      .from(users)
      .where(conditions.length ? and(...conditions) : undefined)
      .limit(50)
      .all();
  },
};
