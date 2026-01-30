import { NextFunction, Request, Response } from 'express';
import { ForbiddenError, UnauthorizedError } from '@errors/http-errors';
import { UserRole } from '@modules/users/user.types';
import { AuthenticatedRequest } from './auth.types';
import { ErrorCode } from '@errors/error-code';

/**
 * ============================
 * Role-Based Access Control
 * ============================
 * Restricts access based on user roles
 * Usage:
 *      roleGuard(UserRole.ADMIN)
 *      roleGuard(UserRole.ADMIN, UserRole.PROVIDER)
 */
export function roleGuard(...allowedRoles: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const authReq = req as AuthenticatedRequest;
    if (!authReq.user) {
      return next(new UnauthorizedError(ErrorCode.AUTH_REQUIRED,'Authentication required'));
    }

    if (!allowedRoles.includes(authReq.user.role)) {
      return next(new ForbiddenError(ErrorCode.INSUFFICIENT_PERMISSION,'Forbidden: insufficient permissions'));
    }

    next();
  };
}
