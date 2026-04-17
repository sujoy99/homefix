import jwt, { SignOptions } from 'jsonwebtoken';
import ms from 'ms';
import { env } from '@config/env';
import { JwtPayload, JwtPayloadVal, RefreshTokenPayload, RefreshTokenPayloadVal, UserWithAuth } from './auth.types';
import { UnauthorizedError } from '@errors/http-errors';
import { User, UserRole, UserStatus } from '@modules/users/user.types';
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
 * - Used for API authorization
 * - Short lived
 */
export function accessTokenGeneration(payload: JwtPayloadVal): string {
  const options: SignOptions = {};
  if (env.jwtAccessExpiresIn !== undefined) {
    options.expiresIn = env.jwtAccessExpiresIn;
  }

  return jwt.sign(payload, env.jwtAccessSecret, options);
}

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
export function refreshTokenGeneration(userId: string) {
  const tokenId = randomUUID();

  const options: SignOptions = {};
  if (env.jwtRefreshExpiresIn !== undefined) {
    options.expiresIn = env.jwtRefreshExpiresIn;
  }
  const token = jwt.sign({ sub: userId, tokenId } satisfies RefreshTokenPayloadVal,
    env.jwtRefreshSecret, options);
  return { token, tokenId };
}

export function generateRefreshToken(userId: string, authAccount: AuthAccount, deviceId?: string) {
  const tokenId = randomUUID();
  const tokenVersion = authAccount.refresh_token_version;

  const options: SignOptions = {};
  if (env.jwtRefreshExpiresIn !== undefined) {
    options.expiresIn = env.jwtRefreshExpiresIn;
  }
  const payload: RefreshTokenPayload = {
    sub: userId,
    tokenId,
    ...(deviceId ? { deviceId } : {}),
    tokenVersion: authAccount.refresh_token_version,
  };
  const token = jwt.sign(payload, env.jwtRefreshSecret, options);
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
export function jwtPayloadGeneration(user: User, deviceId: string): JwtPayloadVal {
  return {
    sub: user.id,
    email: user.email,
    role: user.role,
    deviceId: deviceId,
    tokenVersion: user.tokenVersion,
  };
}


export function generateJwtPayload(
  id: string, 
  mobile: string, 
  role: UserRole, 
  status: UserStatus, 
  deviceId: string
): JwtPayload {
  return {
    sub: id,
    mobile: mobile,
    role: role,
    status: status,
    deviceId: deviceId,
  };
}

/**
 * ============================
 * JWT Access Token Verification
 * ============================
 */
export function verifyAccessTokenVal(token: string): JwtPayloadVal {
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

  return decoded as JwtPayloadVal;
}

export function verifyAccessToken(token: string): JwtPayload {
  const decoded = jwt.verify(token, env.jwtAccessSecret);

  if (
    typeof decoded !== 'object' ||
    decoded === null ||
    !('sub' in decoded) ||
    !('mobile' in decoded) ||
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

/**
 * ============================
 * JWT Refresh Token decode if verify fails
 * logout fallback
 * logging
 * debugging
 * ============================
 */
export function decodeRefreshToken(
  token: string
): RefreshTokenPayload | null {
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
