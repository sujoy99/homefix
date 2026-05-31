import { Router } from 'express';
import { PaymentController } from './payment.controller';
import { validate } from '@middlewares/validate';
import { createPaymentSchema } from './payment.schema';
import { authGuard } from '@modules/auth/auth.guard';
import { roleGuard } from '@modules/auth/role.guard';
import { asAuthenticated } from '@modules/auth/auth.adapter';
import { asyncHandler } from '@utils/async-handler';
import { UserRole } from '@modules/users/user.types';

const router = Router();

/**
 * @openapi
 * tags:
 *   - name: Payments
 *     description: Payment submission and verification (REQ-019, REQ-020)
 */

/**
 * @openapi
 * /payments:
 *   post:
 *     summary: Resident submits payment TxID for an awaiting-payment job (REQ-019, REQ-020)
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [job_id, method, amount_paisa]
 *             properties:
 *               job_id:
 *                 type: string
 *                 format: uuid
 *               method:
 *                 type: string
 *                 enum: [bkash, nagad, bank_transfer, cash, card]
 *               transaction_id:
 *                 type: string
 *                 description: Required for bKash, Nagad, bank_transfer. Alphanumeric, 8–20 chars.
 *               amount_paisa:
 *                 type: integer
 *                 description: Payment amount in paisa (1 taka = 100 paisa)
 *     responses:
 *       201:
 *         description: Payment submitted — awaiting admin verification
 *       400:
 *         description: Validation error, job not in AWAITING_PAYMENT state, or duplicate payment
 *       403:
 *         description: Not the job owner
 *       404:
 *         description: Job not found
 */
router.post(
  '/',
  authGuard,
  roleGuard(UserRole.RESIDENT),
  validate(createPaymentSchema),
  asyncHandler(asAuthenticated(PaymentController.submitPayment))
);

export { router as paymentRouter };
