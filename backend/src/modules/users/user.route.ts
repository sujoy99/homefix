import { Router } from 'express';
import { UserController } from './user.controller';
import { authGuard } from '@modules/auth/auth.guard';
import { asAuthenticated } from '@modules/auth/auth.adapter';

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
 *     summary: Get current authenticated user
 *     description: Returns profile information of the logged-in user
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

/**
 * @route   GET /users/me
 * @desc    Get current logged-in user
 * @access  Protected
 */
userRouter.get(
  '/me',
  authGuard, // JWT required
  asAuthenticated(UserController.me)
);
