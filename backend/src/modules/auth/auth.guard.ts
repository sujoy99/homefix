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
export function authGuardVal(
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
    // if(user.tokenVersion !== payload.tokenVersion) {
    //   return next(
    //     new UnauthorizedError(
    //       ErrorCode.SESSION_EXPIRED,
    //       'Session expired. Please login again.'
    //     )
    //   );
    // }
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

/**
 * ============================
 * Authentication Guard (v2)
 * ============================
 * - Verifies JWT access token (stateless)
 * - Attaches user payload to request
 * - No DB calls (FAST)
 */
export function authGuard(
  req: Request,
  _res: Response,
  next: NextFunction
): asserts req is Request & { user: JwtPayload } {
  /**
   * ============================
   * 1. Extract Authorization header
   * ============================
   */
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(
      new UnauthorizedError(
        ErrorCode.TOKEN_MISSING,
        'Access token missing'
      )
    );
  }

  const token = authHeader.split(' ')[1];

  if (!token) {
    return next(
      new UnauthorizedError(
        ErrorCode.TOKEN_MISSING,
        'Access token missing'
      )
    );
  }

  try {
    /**
     * ============================
     * 2. Verify JWT
     * ============================
     */
    const payload = verifyAccessToken(token);

     /**
     * ============================
     * 3. Optional: Block inactive users
     * ============================
     */
    if (payload.status !== 'active') {
      return next(
        new UnauthorizedError(
          ErrorCode.ACCOUNT_INACTIVE,
          'Account is not active'
        )
      );
    }

    /**
     * ============================
     * 4. FUTURE: Redis validation hook
     * ============================
     *
     * IMPORTANT:
     * Keep this structure — later just plug Redis here
     */

    // TODO: enable when Redis is integrated
    /*
    const redisVersion = await redis.get(
      `user:${payload.sub}:tokenVersion`
    );

    if (!redisVersion || redisVersion !== payload.tokenVersion) {
      return next(
        new UnauthorizedError(
          ErrorCode.SESSION_EXPIRED,
          'Session expired. Please login again.'
        )
      );
    }
    */

    /**
     * ============================
     * 3. Attach user to request
     * ============================
     */
    req.user = payload;

    return next();
  } catch (err: any) {
    /**
     * ============================
     * 4. Handle errors
     * ============================
     */
    if (err instanceof jwt.TokenExpiredError) {
      return next(
        new UnauthorizedError(
          ErrorCode.TOKEN_EXPIRED,
          'Access token expired'
        )
      );
    }

    return next(
      new UnauthorizedError(
        ErrorCode.TOKEN_INVALID,
        'Invalid or malformed token'
      )
    );
  }
}
