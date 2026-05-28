import jwt, { SignOptions } from 'jsonwebtoken';
import ms from 'ms';
import { env } from '@config/env';
import { JwtPayload, RefreshTokenPayload } from './auth.types';
import { UnauthorizedError } from '@errors/http-errors';
import { UserRole, UserStatus } from '@modules/users/user.types';
import { User } from '@modules/users/user.model';
import { randomUUID } from 'crypto';
import { ErrorCode } from '@errors/error-code';
import { AuthAccount } from './auth.model';

/**
 * ============================
 * JWT Helpers
 * ============================
 */

/**
 * Generate Access Token
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
 */
export function generateRefreshToken(userId: string, authAccount: AuthAccount, deviceId?: string) {
  const tokenId = randomUUID();

  const options: SignOptions = {};
  if (env.jwtRefreshExpiresIn !== undefined) {
    options.expiresIn = env.jwtRefreshExpiresIn;
  }
  
  const payload: RefreshTokenPayload = {
    sub: userId,
    tokenId,
    tokenVersion: authAccount.refresh_token_version,
    ...(deviceId ? { deviceId } : {}),
  };
  
  const token = jwt.sign(payload, env.jwtRefreshSecret, options);
  return { token, tokenId };
}

/**
 * ============================
 * User Sanitizer
 * ============================
 */
export function sanitizeUser(user: User) {
  return { ...user };
}

/**
 * ============================
 * JWT Payload Generator from User
 * ============================
 */
export function generateJwtPayload(
  user: User,
  authAccount: AuthAccount,
  deviceId?: string
): JwtPayload {
  return {
    sub: user.id,
    email: user.email ?? undefined,
    mobile: user.mobile,
    role: user.role,
    status: user.status,
    tokenVersion: authAccount.refresh_token_version,
    deviceId: deviceId,
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
    !('mobile' in decoded) ||
    !('role' in decoded)
  ) {
    throw new UnauthorizedError(ErrorCode.TOKEN_INVALID, 'Invalid access token');
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

/**
 * ============================
 * JWT Refresh Token decode if verify fails
 * ============================
 */
export function decodeRefreshToken(token: string): RefreshTokenPayload | null {
  const decoded = jwt.decode(token);

  if (
    !decoded ||
    typeof decoded !== 'object' ||
    !('tokenId' in decoded) ||
    !('sub' in decoded)
  ) {
    return null;
  }

  return decoded as RefreshTokenPayload;
}

/**
 * ============================
 * Expiry Date Generator
 * ============================
 */
export function getRefreshTokenExpiryDate(): Date {
  const expiresIn = env.jwtRefreshExpiresIn;

  if (!expiresIn) {
    throw new Error('jwtRefreshExpiresIn is not defined');
  }

  const duration =
    typeof expiresIn === 'string'
      ? ms(expiresIn)
      : expiresIn;

  return new Date(Date.now() + duration);
}
