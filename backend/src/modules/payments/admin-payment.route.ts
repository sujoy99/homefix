import { Router } from 'express';
import { PaymentController } from './payment.controller';
import { validate } from '@middlewares/validate';
import { paymentIdSchema } from './payment.schema';
import { authGuard } from '@modules/auth/auth.guard';
import { roleGuard } from '@modules/auth/role.guard';
import { asAuthenticated } from '@modules/auth/auth.adapter';
import { asyncHandler } from '@utils/async-handler';
import { UserRole } from '@modules/users/user.types';

const router = Router();

/**
 * @openapi
 * tags:
 *   - name: Admin - Payments
 *     description: Admin payment verification (REQ-019, REQ-020)
 */

/**
 * @openapi
 * /admin/payments/{id}/verify:
 *   patch:
 *     summary: Admin verifies a submitted payment TxID (REQ-019, REQ-020)
 *     tags: [Admin - Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Payment verified — commission + wallet credit wired in HF-056/057
 *       400:
 *         description: Payment is not in submitted status
 *       404:
 *         description: Payment not found
 */
router.patch(
  '/:id/verify',
  authGuard,
  roleGuard(UserRole.ADMIN),
  validate(paymentIdSchema),
  asyncHandler(asAuthenticated(PaymentController.verifyPayment))
);

export { router as adminPaymentRouter };
