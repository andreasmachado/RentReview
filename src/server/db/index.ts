import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { mkdirSync, dirname } from 'node:fs';
import { config } from '../lib/config.js';
import * as schema from './schema.js';

if (config.DATABASE_URL !== ':memory:') {
  mkdirSync(dirname(config.DATABASE_URL), { recursive: true });
}

const sqlite = new Database(config.DATABASE_URL);
sqlite.pragma('journal_mode = WAL');
sqlite.pragma('foreign_keys = ON');

export const db = drizzle(sqlite, { schema });
export const rawDb = sqlite;
