import {NextFunction, Request, Response} from 'express';
import {UnauthorizedError} from '@errors/http-errors';
import {verifyAccessToken} from '@modules/auth/auth.jwt';
import {JwtPayload} from '@modules/auth/auth.types';
import {UserStore} from '@modules/users/user.store';
import {ErrorCode} from "@errors/error-code";
import jwt from "jsonwebtoken";


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
    return next(new UnauthorizedError(ErrorCode.TOKEN_MISSING, 'Access token missing'));
  }

  const token = authHeader.split(' ')[1];

  if (!token) {
    return next(
      new UnauthorizedError(ErrorCode.TOKEN_MISSING, 'Access token missing')
    );
  }

  try {
    const payload = verifyAccessToken(token);
    const user = UserStore.get(payload.sub);
    if (!user) {
      return next(new UnauthorizedError(ErrorCode.TOKEN_INVALID,'Invalid token'));
    }
    // Global Logout Check
    if(user.tokenVersion !== payload.tokenVersion) {
      return next(
        new UnauthorizedError(
          ErrorCode.SESSION_EXPIRED,
          'Session expired. Please login again.'
        )
      );
    }
    req.user = {
      id: payload.sub,
      email: payload.email,
      role: payload.role,
      tokenVersion: payload.tokenVersion
    };

    next();
  } catch(err: any) {
    if (err instanceof jwt.TokenExpiredError) {
      return next(
        new UnauthorizedError(ErrorCode.TOKEN_EXPIRED, 'Access token expired')
      );
    }
    return next(new UnauthorizedError(ErrorCode.TOKEN_INVALID,'Invalid or malformed token'));
  }
}
