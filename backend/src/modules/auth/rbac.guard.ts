import { NextFunction, Request, Response } from 'express';
import { ForbiddenError } from '@errors/http-errors';
import { ROLE_PERMISSIONS } from './roles';
import { Permission } from './permissions';
import { AuthenticatedRequest } from '@modules/auth/auth.types';
import { ErrorCode } from '@errors/error-code';

/**
 * ============================
 * Permission Guard
 * ============================
 * - Checks if authenticated user
 * - Validates required permissions
 */
export function permissionGuard(...requiredPermissions: Permission[]) {
  return (
    req: Request,
    _res: Response,
    next: NextFunction
  ) => {
    const authReq = req as AuthenticatedRequest;
    if (!authReq.user) {
      return next(new ForbiddenError(ErrorCode.FORBIDDEN, 'Access denied'));
    }

    const userPermissions = ROLE_PERMISSIONS[authReq.user.role] ?? [];

    const hasPermission = requiredPermissions.every((perm) =>
      userPermissions.includes(perm)
    );

    if (!hasPermission) {
      return next(
        new ForbiddenError(ErrorCode.INSUFFICIENT_PERMISSION,'You do not have permission to access this resource')
      );
    }

    next();
  };
}
