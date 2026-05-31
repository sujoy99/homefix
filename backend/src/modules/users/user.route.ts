import { Router } from 'express';
import { UserController } from './user.controller';
import { authGuard } from '@modules/auth/auth.guard';
import { asAuthenticated } from '@modules/auth/auth.adapter';
import { asyncHandler } from '@utils/async-handler';

export const userRouter = Router();

/**
 * ============================
 * User Routes
 * ============================
 */

/**
 * @swagger
 * /users/me:
 *   get:
 *     summary: Get current authenticated user (with embedded profile_completion summary)
 *     tags:
 *       - Users
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile fetched successfully
 *       401:
 *         description: Unauthorized
 */
userRouter.get('/me', authGuard, asyncHandler(asAuthenticated(UserController.me)));

/**
 * @swagger
 * /users/me/profile-completion:
 *   get:
 *     summary: Get full profile completion breakdown with item list
 *     description: Returns percentage, threshold, and per-field completed/missing lists. Role-aware (Provider 9 fields / Resident 5 fields).
 *     tags:
 *       - Users
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profile completion data
 *       401:
 *         description: Unauthorized
 */
userRouter.get(
  '/me/profile-completion',
  authGuard,
  asyncHandler(asAuthenticated(UserController.getProfileCompletion))
);
