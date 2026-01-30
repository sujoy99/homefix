import { Router } from 'express';
import { AdminController } from './admin.controller';
import { authGuard } from '@modules/auth/auth.guard';
import { roleGuard } from '@modules/auth/role.guard';
import { permissionGuard } from '@modules/auth/rbac.guard';
import { asAuthenticated } from '@modules/auth/auth.adapter';
import { UserRole } from '@modules/users/user.types';
import { Permission } from '@modules/auth/permissions';

export const adminRouter = Router();

/**
 * ============================
 * Admin Routes
 * ============================
 */

/**
 * @swagger
 * /admin/dashboard:
 *   get:
 *     summary: Admin dashboard
 *     description: Access restricted to ADMIN users only
 *     tags:
 *       - Admin
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard data
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (insufficient role)
 */
adminRouter.get(
  '/dashboard',
  authGuard, // JWT required
  roleGuard(UserRole.ADMIN), // Role restriction
  asAuthenticated(AdminController.dashboard)
);

/**
 * @swagger
 * /admin/settings:
 *   get:
 *     summary: Settings
 *     description: Access to restricted ADMIN users only
 *     tags:
 *       - Admin
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard data
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (insufficient role)
 */
adminRouter.get(
  '/settings',
  authGuard, // JWT required
  permissionGuard(Permission.SETTINGS_MANAGE),
  asAuthenticated(AdminController.settings)
);
