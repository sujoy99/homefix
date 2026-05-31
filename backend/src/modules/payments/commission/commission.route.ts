import { Router } from 'express';
import { CommissionController } from './commission.controller';
import { validate } from '@middlewares/validate';
import {
  createCommissionRuleSchema,
  patchCommissionRuleSchema,
  commissionRuleIdSchema,
  previewCommissionSchema,
} from './commission.schema';
import { authGuard } from '@modules/auth/auth.guard';
import { roleGuard } from '@modules/auth/role.guard';
import { asAuthenticated } from '@modules/auth/auth.adapter';
import { asyncHandler } from '@utils/async-handler';
import { UserRole } from '@modules/users/user.types';

const router = Router();

/**
 * @openapi
 * tags:
 *   - name: Admin - Commission Rules
 *     description: Admin commission rule management (REQ-021)
 */

/**
 * @openapi
 * /admin/commission/rules:
 *   get:
 *     summary: List all commission rules (active + inactive)
 *     tags: [Admin - Commission Rules]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of commission rules
 */
router.get(
  '/rules',
  authGuard,
  roleGuard(UserRole.ADMIN),
  asyncHandler(asAuthenticated(CommissionController.listRules))
);

/**
 * @openapi
 * /admin/commission/rules:
 *   post:
 *     summary: Create a new commission rule
 *     tags: [Admin - Commission Rules]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [scope, rate, label]
 *             properties:
 *               scope:
 *                 type: string
 *                 enum: [global, category, promotion]
 *               rate:
 *                 type: number
 *                 minimum: 0
 *                 maximum: 1
 *               label:
 *                 type: string
 *               category_id:
 *                 type: string
 *                 format: uuid
 *                 description: Required for category and promotion scopes
 *               valid_from:
 *                 type: string
 *                 format: date-time
 *                 description: Required for promotion scope
 *               valid_until:
 *                 type: string
 *                 format: date-time
 *                 description: Required for promotion scope
 *     responses:
 *       201:
 *         description: Commission rule created; existing active global rule auto-deactivated if scope=global
 *       400:
 *         description: Validation error
 */
router.post(
  '/rules',
  authGuard,
  roleGuard(UserRole.ADMIN),
  validate(createCommissionRuleSchema),
  asyncHandler(asAuthenticated(CommissionController.createRule))
);

/**
 * @openapi
 * /admin/commission/rules/{id}:
 *   patch:
 *     summary: Update a commission rule (label, rate, valid_from, valid_until only — scope is immutable)
 *     tags: [Admin - Commission Rules]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Commission rule updated
 *       404:
 *         description: Rule not found
 */
router.patch(
  '/rules/:id',
  authGuard,
  roleGuard(UserRole.ADMIN),
  validate(patchCommissionRuleSchema),
  asyncHandler(asAuthenticated(CommissionController.updateRule))
);

/**
 * @openapi
 * /admin/commission/rules/{id}:
 *   delete:
 *     summary: Soft-deactivate a commission rule (audit trail preserved)
 *     tags: [Admin - Commission Rules]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Commission rule deactivated
 *       404:
 *         description: Rule not found
 */
router.delete(
  '/rules/:id',
  authGuard,
  roleGuard(UserRole.ADMIN),
  validate(commissionRuleIdSchema),
  asyncHandler(asAuthenticated(CommissionController.deleteRule))
);

/**
 * @openapi
 * /admin/commission/preview:
 *   get:
 *     summary: Preview which commission rule would apply for a given category and date
 *     tags: [Admin - Commission Rules]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: category_id
 *         schema: { type: string, format: uuid }
 *       - in: query
 *         name: date
 *         schema: { type: string, format: date-time }
 *     responses:
 *       200:
 *         description: Resolved rule — rate, rule_id, label
 *       404:
 *         description: No active rule found
 */
router.get(
  '/preview',
  authGuard,
  roleGuard(UserRole.ADMIN),
  validate(previewCommissionSchema),
  asyncHandler(asAuthenticated(CommissionController.previewRule))
);

export { router as adminCommissionRouter };
