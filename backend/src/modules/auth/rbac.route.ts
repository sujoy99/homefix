import { Router } from 'express';
import { RbacController } from './rbac.controller';
import { authGuard } from './auth.guard';
import { permissionGuard } from './rbac.guard';
import { Permission } from './permissions';
import { asyncHandler } from '@utils/async-handler';

export const rbacRouter = Router();

/**
 * @openapi
 * tags:
 *   - name: RBAC
 *     description: Role and permission management (admin only)
 */

/**
 * @openapi
 * /admin/rbac/roles:
 *   get:
 *     summary: List all roles with their assigned permissions
 *     tags: [RBAC]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Roles with permissions returned
 */
rbacRouter.get(
  '/roles',
  authGuard,
  permissionGuard(Permission.SETTINGS_MANAGE),
  asyncHandler(RbacController.listRoles)
);

/**
 * @openapi
 * /admin/rbac/permissions:
 *   get:
 *     summary: List all available permission codes
 *     tags: [RBAC]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Permissions list returned
 */
rbacRouter.get(
  '/permissions',
  authGuard,
  permissionGuard(Permission.SETTINGS_MANAGE),
  asyncHandler(RbacController.listPermissions)
);

/**
 * @openapi
 * /admin/rbac/roles/{role}/permissions:
 *   post:
 *     summary: Assign a permission to a role
 *     tags: [RBAC]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: role
 *         required: true
 *         schema:
 *           type: string
 *           enum: [resident, provider, admin]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [permission_code]
 *             properties:
 *               permission_code:
 *                 type: string
 *                 example: JOB_WRITE
 *     responses:
 *       200:
 *         description: Permission assigned
 *       400:
 *         description: Invalid role or permission code
 */
rbacRouter.post(
  '/roles/:role/permissions',
  authGuard,
  permissionGuard(Permission.SETTINGS_MANAGE),
  asyncHandler(RbacController.assignPermission)
);

/**
 * @openapi
 * /admin/rbac/roles/{role}/permissions/{code}:
 *   delete:
 *     summary: Revoke a permission from a role
 *     tags: [RBAC]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: role
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: code
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Permission revoked
 *       404:
 *         description: Mapping not found
 */
rbacRouter.delete(
  '/roles/:role/permissions/:code',
  authGuard,
  permissionGuard(Permission.SETTINGS_MANAGE),
  asyncHandler(RbacController.revokePermission)
);

/**
 * @openapi
 * /admin/rbac/refresh:
 *   post:
 *     summary: Reload permission cache from DB
 *     tags: [RBAC]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Cache refreshed
 */
rbacRouter.post(
  '/refresh',
  authGuard,
  permissionGuard(Permission.SETTINGS_MANAGE),
  asyncHandler(RbacController.refreshCache)
);
