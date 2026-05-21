import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { AppError, ErrorCode } from '../lib/errors.js';
import { SESSION_EXPIRY_DAYS, EMAIL_VERIFICATION_EXPIRY_HOURS } from '../lib/config.js';
import type { RegisterInput, LoginInput } from '../lib/validation.js';
import { emailVerificationRepository } from '../repositories/emailVerificationRepository.js';
import { sessionRepository } from '../repositories/sessionRepository.js';
import { userRepository } from '../repositories/userRepository.js';
import { emailService } from './emailService.js';
import type { User } from '../db/schema.js';

function addHours(date: Date, hours: number): Date {
  return new Date(date.getTime() + hours * 60 * 60 * 1000);
}

function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
}

export function stripSensitive(user: User): Omit<User, 'passwordHash'> {
  const { passwordHash: _, ...safe } = user;
  return safe;
}

export const authService = {
  async register(input: RegisterInput): Promise<Omit<User, 'passwordHash'>> {
    const existing = await userRepository.findByEmail(input.email);
    if (existing) {
      throw new AppError(ErrorCode.EMAIL_TAKEN, 'Email is already registered', 409);
    }

    const passwordHash = await bcrypt.hash(input.password, 12);
    const user = await userRepository.create({
      email: input.email,
      passwordHash,
      name: input.name,
      emailVerified: 0,
    });

    const token = crypto.randomBytes(32).toString('hex');
    await emailVerificationRepository.create({
      userId: user.id,
      token,
      expiresAt: addHours(new Date(), EMAIL_VERIFICATION_EXPIRY_HOURS).toISOString(),
    });

    await emailService.sendVerification(user.email, token).catch((err) => {
      console.error('Failed to send verification email:', err);
    });

    return stripSensitive(user);
  },

  async login(input: LoginInput): Promise<{ sessionId: string; user: Omit<User, 'passwordHash'> }> {
    const user = await userRepository.findByEmail(input.email);
    if (!user) {
      throw new AppError(ErrorCode.INVALID_CREDENTIALS, 'Invalid email or password', 401);
    }

    const valid = await bcrypt.compare(input.password, user.passwordHash);
    if (!valid) {
      throw new AppError(ErrorCode.INVALID_CREDENTIALS, 'Invalid email or password', 401);
    }

    if (!user.emailVerified) {
      throw new AppError(
        ErrorCode.EMAIL_NOT_VERIFIED,
        'Please verify your email before logging in',
        403
      );
    }

    const sessionId = crypto.randomUUID();
    await sessionRepository.create({
      id: sessionId,
      userId: user.id,
      expiresAt: addDays(new Date(), SESSION_EXPIRY_DAYS).toISOString(),
      createdAt: new Date().toISOString(),
    });

    return { sessionId, user: stripSensitive(user) };
  },

  async logout(sessionId: string): Promise<void> {
    await sessionRepository.deleteById(sessionId);
  },

  async verifyEmail(token: string): Promise<Omit<User, 'passwordHash'>> {
    const record = await emailVerificationRepository.findByToken(token);
    if (!record) {
      throw new AppError(ErrorCode.NOT_FOUND, 'Verification token not found', 404);
    }

    if (new Date(record.expiresAt) < new Date()) {
      throw new AppError(ErrorCode.TOKEN_EXPIRED, 'Verification token has expired', 410);
    }

    await userRepository.setEmailVerified(record.userId);
    await emailVerificationRepository.deleteByUserId(record.userId);

    const user = await userRepository.findById(record.userId);
    if (!user) {
      throw new AppError(ErrorCode.NOT_FOUND, 'User not found', 404);
    }

    return stripSensitive(user);
  },
};
