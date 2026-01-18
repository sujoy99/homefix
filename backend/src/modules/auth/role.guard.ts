import { Request, Response, NextFunction } from 'express';
import { AppError } from '@errors/app-error';
import { UserRole } from '@modules/users/user.types';
import { ForbiddenError, UnauthorizedError } from '@errors/http-errors';

/**
 * ============================
 * Role-Based Access Control
 * ============================
 * Usage: roleGuard(UserRole.ADMIN)
 */
export function roleGuard(...allowedRoles: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new UnauthorizedError('Authentication required'));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(
        new ForbiddenError('Forbidden: insufficient permissions')
      );
    }

    next();
  };
}
