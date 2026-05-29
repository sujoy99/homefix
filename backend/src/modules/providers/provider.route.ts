import { Router } from 'express';
import { ProviderController } from './provider.controller';
import { validate } from '@middlewares/validate';
import { updateProviderProfileSchema, addSkillSchema, skillIdSchema, providerUserIdSchema, listAvailableSchema } from './provider.schema';
import { authGuard } from '@modules/auth/auth.guard';
import { asAuthenticated } from '@modules/auth/auth.adapter';
import { asyncHandler } from '@utils/async-handler';

export const providerRouter = Router();

/**
 * @openapi
 * tags:
 *   - name: Providers
 *     description: Provider profile and skills
 */

/**
 * @openapi
 * /providers/available:
 *   get:
 *     summary: List available providers, optionally filtered by location (REQ-007,008)
 *     tags: [Providers]
 *     parameters:
 *       - in: query
 *         name: lat
 *         schema: { type: number }
 *         description: Latitude of the search centre
 *       - in: query
 *         name: lon
 *         schema: { type: number }
 *         description: Longitude of the search centre
 *       - in: query
 *         name: radius
 *         schema: { type: number, default: 10 }
 *         description: Search radius in km (default 10)
 *       - in: query
 *         name: category
 *         schema: { type: string, format: uuid }
 *         description: Filter by category ID
 *     responses:
 *       200:
 *         description: Available providers returned, sorted by distance when lat/lon provided
 */
providerRouter.get(
  '/available',
  validate(listAvailableSchema),
  asyncHandler(ProviderController.listAvailable)
);

/**
 * NOTE: /me/profile routes must be declared BEFORE /:user_id to prevent
 * Express matching "me" as a user_id param.
 */

/**
 * @openapi
 * /providers/me/profile:
 *   get:
 *     summary: Get or create authenticated provider's own profile
 *     tags: [Providers]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Provider profile returned or auto-created
 */
providerRouter.get(
  '/me/profile',
  authGuard,
  asyncHandler(asAuthenticated(ProviderController.getMyProfile))
);

/**
 * @openapi
 * /providers/me/profile:
 *   patch:
 *     summary: Update authenticated provider's profile
 *     tags: [Providers]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               bio:
 *                 type: string
 *                 nullable: true
 *               experience_years:
 *                 type: integer
 *               hourly_rate:
 *                 type: number
 *                 nullable: true
 *               is_available:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Profile updated
 */
providerRouter.patch(
  '/me/profile',
  authGuard,
  validate(updateProviderProfileSchema),
  asyncHandler(asAuthenticated(ProviderController.updateMyProfile))
);

/**
 * @openapi
 * /providers/me/skills:
 *   post:
 *     summary: Add a skill (category) to provider's profile
 *     tags: [Providers]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [category_id]
 *             properties:
 *               category_id:
 *                 type: string
 *                 format: uuid
 *               is_primary:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: Skill added
 *       404:
 *         description: Category not found
 *       409:
 *         description: Skill already added
 */
providerRouter.post(
  '/me/skills',
  authGuard,
  validate(addSkillSchema),
  asyncHandler(asAuthenticated(ProviderController.addSkill))
);

/**
 * @openapi
 * /providers/me/skills/{skill_id}:
 *   delete:
 *     summary: Remove a skill from provider's profile
 *     tags: [Providers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: skill_id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Skill removed
 *       404:
 *         description: Skill not found
 */
providerRouter.delete(
  '/me/skills/:skill_id',
  authGuard,
  validate(skillIdSchema),
  asyncHandler(asAuthenticated(ProviderController.removeSkill))
);

/**
 * @openapi
 * /providers/{user_id}:
 *   get:
 *     summary: Get a provider's public profile by user ID
 *     tags: [Providers]
 *     parameters:
 *       - in: path
 *         name: user_id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Provider profile returned
 *       404:
 *         description: Profile not found
 */
providerRouter.get(
  '/:user_id',
  validate(providerUserIdSchema),
  asyncHandler(ProviderController.getProfileByUser)
);
