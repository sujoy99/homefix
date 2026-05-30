import { Router } from 'express';
import { WalletController } from './wallet.controller';
import { MfsAccountController } from './mfs-account.controller';
import { validate } from '@middlewares/validate';
import {
  requestWithdrawalSchema,
  walletTransactionsCursorSchema,
  createMfsAccountSchema,
  mfsAccountIdSchema,
} from './wallet.schema';
import { authGuard } from '@modules/auth/auth.guard';
import { roleGuard } from '@modules/auth/role.guard';
import { asAuthenticated } from '@modules/auth/auth.adapter';
import { asyncHandler } from '@utils/async-handler';
import { UserRole } from '@modules/users/user.types';

const router = Router();

/**
 * @openapi
 * tags:
 *   - name: Provider Wallet
 *     description: Provider wallet balance, earnings, and withdrawal (REQ-022)
 */

/**
 * @openapi
 * /providers/wallet:
 *   get:
 *     summary: Get wallet balance + first page of transactions
 *     tags: [Provider Wallet]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Wallet summary with transactions
 */
router.get(
  '/wallet',
  authGuard,
  roleGuard(UserRole.PROVIDER),
  asyncHandler(asAuthenticated(WalletController.getWallet))
);

/**
 * @openapi
 * /providers/wallet/transactions:
 *   get:
 *     summary: Cursor-paginated wallet transaction ledger (20 per page)
 *     tags: [Provider Wallet]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: cursor
 *         schema: { type: string, format: date-time }
 *         description: created_at of last seen transaction; omit for first page
 *     responses:
 *       200:
 *         description: Transaction list with next_cursor
 */
router.get(
  '/wallet/transactions',
  authGuard,
  roleGuard(UserRole.PROVIDER),
  validate(walletTransactionsCursorSchema),
  asyncHandler(asAuthenticated(WalletController.getTransactions))
);

/**
 * @openapi
 * /providers/wallet/withdraw:
 *   post:
 *     summary: Request a wallet withdrawal (min ৳100)
 *     tags: [Provider Wallet]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [amount_paisa]
 *             properties:
 *               amount_paisa:
 *                 type: integer
 *                 minimum: 10000
 *     responses:
 *       201:
 *         description: Withdrawal request created
 *       400:
 *         description: Insufficient balance, no MFS account, or below minimum
 */
router.post(
  '/wallet/withdraw',
  authGuard,
  roleGuard(UserRole.PROVIDER),
  validate(requestWithdrawalSchema),
  asyncHandler(asAuthenticated(WalletController.requestWithdrawal))
);

/**
 * @openapi
 * /providers/payment-accounts:
 *   get:
 *     summary: List provider MFS payout accounts
 *     tags: [Provider Wallet]
 *     security:
 *       - bearerAuth: []
 */
router.get(
  '/payment-accounts',
  authGuard,
  roleGuard(UserRole.PROVIDER),
  asyncHandler(asAuthenticated(MfsAccountController.list))
);

/**
 * @openapi
 * /providers/payment-accounts:
 *   post:
 *     summary: Add a new MFS payout account
 *     tags: [Provider Wallet]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [mfs_type, account_number, account_name]
 *             properties:
 *               mfs_type:
 *                 type: string
 *                 enum: [bkash, nagad, bank]
 *               account_number:
 *                 type: string
 *               account_name:
 *                 type: string
 *               is_primary:
 *                 type: boolean
 */
router.post(
  '/payment-accounts',
  authGuard,
  roleGuard(UserRole.PROVIDER),
  validate(createMfsAccountSchema),
  asyncHandler(asAuthenticated(MfsAccountController.create))
);

/**
 * @openapi
 * /providers/payment-accounts/{id}:
 *   patch:
 *     summary: Set an account as primary
 *     tags: [Provider Wallet]
 *     security:
 *       - bearerAuth: []
 */
router.patch(
  '/payment-accounts/:id',
  authGuard,
  roleGuard(UserRole.PROVIDER),
  validate(mfsAccountIdSchema),
  asyncHandler(asAuthenticated(MfsAccountController.setPrimary))
);

/**
 * @openapi
 * /providers/payment-accounts/{id}:
 *   delete:
 *     summary: Remove a non-primary MFS account
 *     tags: [Provider Wallet]
 *     security:
 *       - bearerAuth: []
 */
router.delete(
  '/payment-accounts/:id',
  authGuard,
  roleGuard(UserRole.PROVIDER),
  validate(mfsAccountIdSchema),
  asyncHandler(asAuthenticated(MfsAccountController.delete))
);

export { router as walletRouter };
