import { Router } from 'express';
import { AdminWithdrawalController } from './admin-withdrawal.controller';
import { validate } from '@middlewares/validate';
import { completeWithdrawalSchema, rejectWithdrawalSchema } from './wallet.schema';
import { authGuard } from '@modules/auth/auth.guard';
import { roleGuard } from '@modules/auth/role.guard';
import { asAuthenticated } from '@modules/auth/auth.adapter';
import { asyncHandler } from '@utils/async-handler';
import { UserRole } from '@modules/users/user.types';

const router = Router();

/**
 * @openapi
 * tags:
 *   - name: Admin - Withdrawals
 *     description: Admin payout management
 */

/**
 * @openapi
 * /admin/withdrawals:
 *   get:
 *     summary: List all withdrawal requests (newest first)
 *     tags: [Admin - Withdrawals]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Withdrawal request list
 */
router.get(
  '/',
  authGuard,
  roleGuard(UserRole.ADMIN),
  asyncHandler(asAuthenticated(AdminWithdrawalController.list))
);

/**
 * @openapi
 * /admin/withdrawals/{id}/complete:
 *   patch:
 *     summary: Mark withdrawal as completed — records amount sent, date, and admin TxID
 *     tags: [Admin - Withdrawals]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [amount_sent_paisa, sent_at, admin_txid]
 *             properties:
 *               amount_sent_paisa:
 *                 type: integer
 *               sent_at:
 *                 type: string
 *                 format: date-time
 *               admin_txid:
 *                 type: string
 *               admin_note:
 *                 type: string
 *     responses:
 *       200:
 *         description: Withdrawal completed; wallet balance deducted
 *       400:
 *         description: Already processed
 *       404:
 *         description: Not found
 */
router.patch(
  '/:id/complete',
  authGuard,
  roleGuard(UserRole.ADMIN),
  validate(completeWithdrawalSchema),
  asyncHandler(asAuthenticated(AdminWithdrawalController.complete))
);

/**
 * @openapi
 * /admin/withdrawals/{id}/reject:
 *   patch:
 *     summary: Reject a withdrawal request (no balance change)
 *     tags: [Admin - Withdrawals]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [admin_note]
 *             properties:
 *               admin_note:
 *                 type: string
 *     responses:
 *       200:
 *         description: Withdrawal rejected
 */
router.patch(
  '/:id/reject',
  authGuard,
  roleGuard(UserRole.ADMIN),
  validate(rejectWithdrawalSchema),
  asyncHandler(asAuthenticated(AdminWithdrawalController.reject))
);

export { router as adminWithdrawalRouter };
