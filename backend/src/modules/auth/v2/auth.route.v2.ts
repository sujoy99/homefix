import { Router } from 'express';
import { AuthControllerV2 } from './auth.controller.v2';
import { validate } from '@middlewares/validate';
import { registerSchema, loginSchema } from '../auth.schema';
import { authGuard } from '@modules/auth/auth.guard';
import { asAuthenticated } from '@modules/auth/auth.adapter';
import { AdminController } from '@modules/admin/admin.controller';

export const authRouterV2 = Router();

/**
 * @openapi
 * tags:
 *   - name: Auth
 *     description: Authentication & authorization
 */

/**
 * @openapi
 * /auth/register:
 *   post:
 *     summary: Register a new user (v2)
 *     description: |
 *       ✅ This is V2 version of registration API.
 *     Changes:
 *       - According to Business Logic fields
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - password
 *               - role
 *             properties:
 *               name:
 *                 type: string
 *                 example: John Doe
 *               email:
 *                 type: string
 *                 example: john@example.com
 *               password:
 *                 type: string
 *                 example: Password@123
 *               role:
 *                 type: string
 *                 enum: [RESIDENT, PROVIDER]
 *     responses:
 *       201:
 *         description: User registered successfully
 *       400:
 *         description: Validation error
 *       409:
 *         description: Email already exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiErrorResponse'
 *             examples:
 *               alreadyExists:
 *                 value:
 *                   http_code: 409
 *                   error_code: ALREADY_EXISTS
 *                   message: Resource already exists
 *                   body: null
 * @route   POST /auth/register
 * @desc    Register New User
 * @access  Public
 */
authRouterV2.post('/register', validate(registerSchema), AuthControllerV2.register);








