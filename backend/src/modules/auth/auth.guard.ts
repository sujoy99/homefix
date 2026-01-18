import { Request, Response, NextFunction } from 'express';
import { UnauthorizedError } from '@errors/http-errors';
import { verifyAccessToken } from '@modules/auth/auth.jwt';
import { JwtPayload } from '@modules/auth/auth.types';


/**
 * ============================
 * Authentication Guard
 * ============================
 * - Verifies JWT access token
 * - Attaches user payload to request
 * - Blocks unauthenticated access
 */
export function authGuard(
  req: Request,
  _res: Response,
  next: NextFunction
): asserts req is Request & { user: JwtPayload } {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new UnauthorizedError('Unauthorized'));
  }

  const token = authHeader.split(' ')[1];

  if (!token) {
    return next(new UnauthorizedError('Unauthorized'));
  }

  try {
    const payload = verifyAccessToken(token);

    req.user = {
      id: payload.sub,
      email: payload.email,
      role: payload.role,
    };

    next();
  } catch {
    return next(new UnauthorizedError('Invalid or expired token'));
  }
}
