import { Router } from 'express';
import { ReviewController } from './review.controller';
import { validate } from '@middlewares/validate';
import { createReviewSchema, listProviderReviewsSchema } from './review.schema';
import { authGuard } from '@modules/auth/auth.guard';
import { roleGuard } from '@modules/auth/role.guard';
import { asAuthenticated } from '@modules/auth/auth.adapter';
import { asyncHandler } from '@utils/async-handler';
import { UserRole } from '@modules/users/user.types';

const router = Router();

/**
 * @openapi
 * tags:
 *   - name: Reviews
 *     description: Review & rating system (REQ-024, REQ-025, REQ-026)
 */

/**
 * @openapi
 * /jobs/{jobId}/review:
 *   post:
 *     summary: Submit a review for a paid job (REQ-024)
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: jobId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [rating]
 *             properties:
 *               rating:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *               comment:
 *                 type: string
 *                 maxLength: 1000
 *     responses:
 *       201:
 *         description: Review submitted
 *       400:
 *         description: Job not in PAID status
 *       403:
 *         description: Not the job owner
 *       404:
 *         description: Job not found
 *       409:
 *         description: Review already exists for this job
 */
router.post(
  '/jobs/:jobId/review',
  authGuard,
  roleGuard(UserRole.RESIDENT),
  validate(createReviewSchema),
  asyncHandler(asAuthenticated(ReviewController.submitReview))
);

/**
 * @openapi
 * /providers/{providerId}/reviews:
 *   get:
 *     summary: Get paginated reviews for a provider (REQ-025, REQ-026)
 *     tags: [Reviews]
 *     parameters:
 *       - in: path
 *         name: providerId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *           maximum: 50
 *     responses:
 *       200:
 *         description: Paginated list of reviews
 *       404:
 *         description: Provider not found
 */
router.get(
  '/providers/:providerId/reviews',
  validate(listProviderReviewsSchema),
  asyncHandler(ReviewController.listProviderReviews)
);

export { router as reviewRouter };
