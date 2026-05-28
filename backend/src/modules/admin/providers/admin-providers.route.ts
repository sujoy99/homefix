import { Router } from 'express';
import { AdminProviderController } from './admin-providers.controller';
import { authGuard } from '@modules/auth/auth.guard';
import { permissionGuard } from '@modules/auth/rbac.guard';
import { Permission } from '@modules/auth/permissions';
import { validate } from '@middlewares/validate';
import { asyncHandler } from '@utils/async-handler';
import { z } from 'zod';

export const adminProviderRouter = Router();

const providerIdSchema = z.object({ params: z.object({ id: z.string().uuid() }) });

/**
 * @openapi
 * tags:
 *   - name: Admin - Providers
 *     description: Provider verification management (admin only)
 */

/**
 * @openapi
 * /admin/providers/pending:
 *   get:
 *     summary: List all providers awaiting approval
 *     tags: [Admin - Providers]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Pending providers returned
 *       403:
 *         description: Forbidden
 */
adminProviderRouter.get(
  '/pending',
  authGuard,
  permissionGuard(Permission.PROVIDER_MANAGE),
  asyncHandler(AdminProviderController.listPending)
);

/**
 * @openapi
 * /admin/providers/{id}/approve:
 *   post:
 *     summary: Approve a pending provider
 *     tags: [Admin - Providers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Provider approved, status set to active
 *       400:
 *         description: Not a provider or already approved
 *       404:
 *         description: Provider not found
 */
adminProviderRouter.post(
  '/:id/approve',
  authGuard,
  permissionGuard(Permission.PROVIDER_MANAGE),
  validate(providerIdSchema),
  asyncHandler(AdminProviderController.approve)
);

/**
 * @openapi
 * /admin/providers/{id}/reject:
 *   post:
 *     summary: Reject a pending provider
 *     tags: [Admin - Providers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Provider rejected, status set to inactive
 *       400:
 *         description: Not a provider or already rejected
 *       404:
 *         description: Provider not found
 */
adminProviderRouter.post(
  '/:id/reject',
  authGuard,
  permissionGuard(Permission.PROVIDER_MANAGE),
  validate(providerIdSchema),
  asyncHandler(AdminProviderController.reject)
);
