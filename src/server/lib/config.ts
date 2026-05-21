import 'dotenv/config';
import { z } from 'zod';

const envSchema = z.object({
  DATABASE_URL: z.string().default('./dev.db'),
  SESSION_SECRET: z.string().min(32).default('dev-secret-change-this-in-production-now!!'),
  FRONTEND_URL: z.string().default('http://localhost:5173'),
  SMTP_HOST: z.string().default('localhost'),
  SMTP_PORT: z.coerce.number().default(1025),
  SMTP_USER: z.string().default(''),
  SMTP_PASS: z.string().default(''),
  FROM_EMAIL: z.string().default('noreply@rentreview.local'),
  BASE_URL: z.string().default('http://localhost:3001'),
  PORT: z.coerce.number().default(3001),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Invalid environment variables:', parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const config = parsed.data;

export const REQUEST_EXPIRY_DAYS = 30;
export const SESSION_EXPIRY_DAYS = 60;
export const EMAIL_VERIFICATION_EXPIRY_HOURS = 24;
