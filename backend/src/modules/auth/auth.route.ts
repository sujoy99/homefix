import { Router } from 'express';
import { AuthController } from './auth.controller';
import { validate } from '@middlewares/validate';
import { registerSchema, loginSchema } from './auth.schema';
import { authGuard } from '@modules/auth/auth.guard';
import { asAuthenticated } from '@modules/auth/auth.adapter';
import { AdminController } from '@modules/admin/admin.controller';

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
 *               deviceId:
 *                  type: string
 *                  example: Android
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *            application/json:
 *              schema:
 *                $ref: '#/components/schemas/ApiSuccessResponse'
 *              examples:
 *                response:
 *                  value:
 *                    http_code: 200
 *                    message: Login successful
 *                    body:
 *                      user:
 *                        id: "uuid"
 *                        name: "John Doe"
 *                        email: "john@example.com"
 *                        role: "RESIDENT"
 *                        tokenVersion: 1
 *                      tokens:
 *                        accessToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *                        refreshToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *
 *       401:
 *         description: Invalid credentials
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiErrorResponse'
 *             examples:
 *               invalidCredentials:
 *                 value:
 *                   http_code: 401
 *                   error_code: INVALID_CREDENTIALS
 *                   message: Invalid credentials
 *                   body: null
 * @route   POST /auth/login
 * @desc    Login user
 * @access  Public
 */
authRouter.post('/login', validate(loginSchema), AuthController.login);

/**
 * @openapi
 * /auth/refresh:
 *   post:
 *     summary: Refresh access token
 *     tags: [Auth]
 *     description: >
 *       Issues a new access token and rotates refresh token.
 *       Old refresh token is revoked immediately.
 *       Flow: Access token expired (401) -> Frontend calls /auth/refresh
 *       -> Backend validates refresh token -> New access token + refresh token returned
 *       -> Retry original request
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refreshToken
 *             properties:
 *               refreshToken:
 *                 type: string
 *                 description: Valid refresh token
 *     responses:
 *       200:
 *         description: Token refreshed successfully
 *       401:
 *         description: Invalid or revoked refresh token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiErrorResponse'
 *             examples:
 *               refreshTokenRevoked:
 *                 value:
 *                   http_code: 401
 *                   error_code: REFRESH_TOKEN_REVOKED
 *                   message: Refresh token revoked
 *                   body: null
 * @route   POST /auth/refresh
 * @desc    Refresh access token
 * @access  Public
 */
authRouter.post('/refresh', AuthController.refresh);

/**
 * @openapi
 * /auth/logout:
 *   post:
 *     summary: Logout user
 *     tags: [Auth]
 *     description: Revokes refresh token (logout)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refreshToken
 *             properties:
 *               refreshToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: Logout successful
 *       500:
 *         description: Invalid request
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiErrorResponse'
 *             examples:
 *               internalServerError:
 *                 value:
 *                   http_code: 500
 *                   error_code: INTERNAL_SERVER_ERROR
 *                   message: Internal server error
 *                   body: null
 * @route   POST /auth/logout
 * @desc    Logout user
 * @access  Public
 */
authRouter.post('/logout', AuthController.logout);

/**
 * @openapi
 * /auth/logout-all:
 *   post:
 *     summary: Logout from all devices
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logged out from all devices
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiErrorResponse'
 *             examples:
 *               authRequired:
 *                 value:
 *                   http_code: 401
 *                   error_code: AUTH_REQUIRED
 *                   message: Authentication required
 *                   body: null
 *
 *               sessionExpired:
 *                 value:
 *                   http_code: 401
 *                   error_code: SESSION_EXPIRED
 *                   message: Session expired. Please login again.
 *                   body: null
 */
authRouter.post('/logout-all', authGuard, asAuthenticated(AuthController.logoutAll));

