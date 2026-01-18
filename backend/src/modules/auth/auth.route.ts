import { Router } from 'express';
import { AuthController } from './auth.controller';
import { validate } from '@middlewares/validate';
import { registerSchema, loginSchema } from './auth.schema';

export const authRouter = Router();

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
 *     summary: Register a new user
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
 * @route   POST /auth/register
 * @desc    Register New User
 * @access  Public
 */
authRouter.post('/register', validate(registerSchema), AuthController.register);

/**
 * @openapi
 * /auth/login:
 *   post:
 *     summary: Login user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 example: john@example.com
 *               password:
 *                 type: string
 *                 example: Password@123
 *     responses:
 *       200:
 *         description: Login successful
 *       401:
 *         description: Invalid credentials
 * @route   POST /auth/login
 * @desc    Login user
 * @access  Public
 */
authRouter.post('/login', validate(loginSchema), AuthController.login);
