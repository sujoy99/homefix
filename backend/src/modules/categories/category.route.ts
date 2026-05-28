import { Router } from 'express';
import { CategoryController } from './category.controller';
import { validate } from '@middlewares/validate';
import { createCategorySchema, updateCategorySchema, categoryIdSchema } from './category.schema';
import { authGuard } from '@modules/auth/auth.guard';
import { permissionGuard } from '@modules/auth/rbac.guard';
import { Permission } from '@modules/auth/permissions';
import { asyncHandler } from '@utils/async-handler';

export const categoryRouter = Router();

/**
 * @openapi
 * tags:
 *   - name: Categories
 *     description: Service category management
 */

/**
 * @openapi
 * /categories:
 *   get:
 *     summary: List all active service categories
 *     tags: [Categories]
 *     responses:
 *       200:
 *         description: Active categories returned
 */
categoryRouter.get('/', asyncHandler(CategoryController.listActive));

/**
 * @openapi
 * /categories/all:
 *   get:
 *     summary: List all categories including inactive (admin only)
 *     tags: [Categories]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: All categories returned
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
categoryRouter.get(
  '/all',
  authGuard,
  permissionGuard(Permission.CATEGORY_READ),
  asyncHandler(CategoryController.listAll)
);

/**
 * @openapi
 * /categories/{id}:
 *   get:
 *     summary: Get a single category by ID
 *     tags: [Categories]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Category returned
 *       404:
 *         description: Category not found
 */
categoryRouter.get(
  '/:id',
  validate(categoryIdSchema),
  asyncHandler(CategoryController.getById)
);

/**
 * @openapi
 * /categories:
 *   post:
 *     summary: Create a new service category (admin only)
 *     tags: [Categories]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, slug]
 *             properties:
 *               name:
 *                 type: string
 *                 example: Plumbing
 *               slug:
 *                 type: string
 *                 example: plumbing
 *               description:
 *                 type: string
 *                 nullable: true
 *               icon_url:
 *                 type: string
 *                 nullable: true
 *               requires_area:
 *                 type: boolean
 *                 example: false
 *               sort_order:
 *                 type: integer
 *                 example: 0
 *     responses:
 *       201:
 *         description: Category created
 *       400:
 *         description: Validation error
 *       409:
 *         description: Slug already exists
 */
categoryRouter.post(
  '/',
  authGuard,
  permissionGuard(Permission.CATEGORY_WRITE),
  validate(createCategorySchema),
  asyncHandler(CategoryController.create)
);

/**
 * @openapi
 * /categories/{id}:
 *   patch:
 *     summary: Update a category (admin only)
 *     tags: [Categories]
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
 *         description: Category updated
 *       404:
 *         description: Category not found
 */
categoryRouter.patch(
  '/:id',
  authGuard,
  permissionGuard(Permission.CATEGORY_WRITE),
  validate(updateCategorySchema),
  asyncHandler(CategoryController.update)
);

/**
 * @openapi
 * /categories/{id}:
 *   delete:
 *     summary: Delete a category (admin only)
 *     tags: [Categories]
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
 *         description: Category deleted
 *       404:
 *         description: Category not found
 */
categoryRouter.delete(
  '/:id',
  authGuard,
  permissionGuard(Permission.CATEGORY_WRITE),
  validate(categoryIdSchema),
  asyncHandler(CategoryController.delete)
);
