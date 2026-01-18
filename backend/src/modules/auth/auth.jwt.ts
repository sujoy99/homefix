import jwt, { SignOptions } from 'jsonwebtoken';
import { env } from '@config/env';
import { JwtPayload } from './auth.types';
import {  } from '@errors/app-error';
import { UnauthorizedError } from '@errors/http-errors';
import { User } from '@modules/users/user.types';

/**
 * ============================
 * JWT Helpers
 * ============================
 */

/**
 * Generate Access Token
 * - Used for API authorization
 * - Short lived
 */
export function generateAccessToken(payload: JwtPayload): string {
  const options: SignOptions = {};
  if (env.jwtAccessExpiresIn !== undefined) {
    options.expiresIn = env.jwtAccessExpiresIn;
  }

  return jwt.sign(payload, env.jwtAccessSecret, options);
}

/**
 * Generate Refresh Token
 * - Used to rotate access tokens
 * - Long lived
 */
export function generateRefreshToken(payload: JwtPayload): string {
  const options: SignOptions = {};
  if (env.jwtRefreshExpiresIn !== undefined) {
    options.expiresIn = env.jwtRefreshExpiresIn;
  }

  return jwt.sign(payload, env.jwtAccessSecret, options);
}

/**
 * ============================
 * User Sanitizer
 * ============================
 * Ensures sensitive fields never leak outside service
 */
export function sanitizeUser(user: User) {
  const { password, ...safeUser } = user;
  return safeUser;
}

/**
 * ============================
 * JWT Payload Generator from User
 * ============================
 */
export function generateJwtPayload(user: User): JwtPayload {
  return {
    sub: user.id,
    email: user.email,
    role: user.role,
  };
}

/**
 * ============================
 * JWT Access Token Verification
 * ============================
 */
export function verifyAccessToken(token: string): JwtPayload {
  const decoded = jwt.verify(token, env.jwtAccessSecret);

  if (
    typeof decoded !== 'object' ||
    decoded === null ||
    !('sub' in decoded) ||
    !('email' in decoded) ||
    !('role' in decoded)
  ) {
    throw new UnauthorizedError('Invalid access token');
  }

  return decoded as JwtPayload;
}
