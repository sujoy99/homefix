import jwt, { SignOptions } from 'jsonwebtoken';
import { env } from '@config/env';
import { JwtPayload, RefreshTokenPayload } from './auth.types';
import { UnauthorizedError } from '@errors/http-errors';
import { User } from '@modules/users/user.types';
import { randomUUID } from 'crypto';
import { ErrorCode } from '@errors/error-code';

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
export function generateRefreshToken(userId: string) {
  const tokenId = randomUUID();

  const options: SignOptions = {};
  if (env.jwtRefreshExpiresIn !== undefined) {
    options.expiresIn = env.jwtRefreshExpiresIn;
  }
  const token = jwt.sign({ sub: userId, tokenId } satisfies RefreshTokenPayload,
    env.jwtRefreshSecret, options);
  return { token, tokenId };
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
export function generateJwtPayload(user: User, deviceId: string): JwtPayload {
  return {
    sub: user.id,
    email: user.email,
    role: user.role,
    deviceId: deviceId,
    tokenVersion: user.tokenVersion,
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
    throw new UnauthorizedError(ErrorCode.TOKEN_INVALID,'Invalid access token');
  }

  return decoded as JwtPayload;
}

/**
 * ============================
 * JWT Refresh Token Verification
 * ============================
 */
export function verifyRefreshToken(token: string): RefreshTokenPayload {
  return jwt.verify(token, env.jwtRefreshSecret) as RefreshTokenPayload;
}
