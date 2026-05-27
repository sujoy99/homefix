import { NextFunction, Request, Response } from 'express';
import { UnauthorizedError } from '@errors/http-errors';
import { verifyAccessToken } from '@modules/auth/auth.jwt';
import { JwtPayload } from '@modules/auth/auth.types';
import { ErrorCode } from '@errors/error-code';
import { InvalidationStore } from '@modules/auth/invalidation.store';
import jwt from 'jsonwebtoken';

/**
 * ============================
 * Authentication Guard (v2)
 * ============================
 * - Verifies JWT access token (stateless JWT verify)
 * - Checks in-memory invalidation store to close the logoutAll gap (O(1))
 * - Attaches user payload to request
 */
export async function authGuard(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new UnauthorizedError(ErrorCode.TOKEN_MISSING, 'Access token missing'));
  }

  const token = authHeader.split(' ')[1];

  if (!token) {
    return next(new UnauthorizedError(ErrorCode.TOKEN_MISSING, 'Access token missing'));
  }

  try {
    const payload = verifyAccessToken(token);

    if (payload.status !== 'active') {
      return next(new UnauthorizedError(ErrorCode.ACCOUNT_INACTIVE, 'Account is not active'));
    }

    /**
     * In-memory logoutAll check — O(1), no DB call.
     * If the user called logoutAll after this token was issued, reject it.
     * The `iat` field is the token's issued-at time in seconds.
     */
    const tokenIat = (payload as any).iat as number | undefined;
    if (tokenIat !== undefined && InvalidationStore.isRevoked(payload.sub, tokenIat)) {
      return next(
        new UnauthorizedError(ErrorCode.SESSION_EXPIRED, 'Session expired. Please login again.')
      );
    }

    (req as Request & { user: JwtPayload }).user = payload;
    return next();
  } catch (err: any) {
    if (err instanceof jwt.TokenExpiredError) {
      return next(new UnauthorizedError(ErrorCode.TOKEN_EXPIRED, 'Access token expired'));
    }
    return next(new UnauthorizedError(ErrorCode.TOKEN_INVALID, 'Invalid or malformed token'));
  }
}
