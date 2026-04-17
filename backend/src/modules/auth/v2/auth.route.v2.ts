import { Router } from 'express';
import { AuthControllerV2 } from './auth.controller.v2';
import { validate } from '@middlewares/validate';
import { registerSchema, loginSchema, userRegistrationSchema, userLoginSchema } from '../auth.schema';
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
 *     summary: Register a new user (V2)
 *     description: |
 *       Register a new user using mobile number and National ID.
 *
 *       🔹 Business Logic:
 *       - Resident → account becomes ACTIVE immediately
 *       - Provider → account stays PENDING until admin approval
 *       - Provider must provide NID photo
 *       - Mobile and NID must be unique
 *
 *     tags:
 *       - Auth
 *
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - full_name
 *               - mobile
 *               - nid
 *               - latitude
 *               - longitude
 *               - role
 *             properties:
 *               full_name:
 *                 type: string
 *                 example: Rahim Uddin
 *
 *               mobile:
 *                 type: string
 *                 example: "01712345678"
 *                 description: Must be 11 digit number
 *
 *               nid:
 *                 type: string
 *                 example: "1234567890"
 *                 description: Must be 10 digit number
 * 
 *               email:
 *                 type: string
 *                 example: "abc@email.com"
 *                 description: Must be valid mail
 *                 nullable: true
 * 
 *               password:
 *                 type: string
 *                 example: "Password@123"
 *                 description: Must be 8–128 characters and include uppercase, lowercase, number, and special character
 *                 nullable: true
 *
 *               latitude:
 *                 type: number
 *                 example: 23.8103
 *
 *               longitude:
 *                 type: number
 *                 example: 90.4125
 *
 *               role:
 *                 type: string
 *                 enum: [resident, provider]
 * 
 *               auth_method:
 *                 type: string
 *                 enum: [password, otp, google, facebood]
 *                 description: login method
 *                 nullable: true
 *
 *               photo_url:
 *                 type: string
 *                 example: https://example.com/profile.jpg
 *                 nullable: true
 *
 *               nid_photo_url:
 *                 type: string
 *                 example: https://example.com/nid.jpg
 *                 nullable: true
 *                 description: Required if role = provider
 *
 *     responses:
 *       201:
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: User registered successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       example: "uuid"
 *                     short_code:
 *                       type: string
 *                       example: "USR-000001"
 *                     full_name:
 *                       type: string
 *                     mobile:
 *                       type: string
 *                     role:
 *                       type: string
 *                     status:
 *                       type: string
 *                     auth_method:
 *                       type: string
 *
 *       400:
 *         description: Validation error
 *
 *       409:
 *         description: User already exists (mobile or NID)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiErrorResponse'
 *             examples:
 *               alreadyExists:
 *                 value:
 *                   http_code: 409
 *                   error_code: ALREADY_EXISTS
 *                   message: User already exists with this mobile number
 *                   body: null
 *
 * @route   POST /auth/register
 * @desc    Register New User (V2)
 * @access  Public
 */
authRouterV2.post('/register', validate(userRegistrationSchema), AuthControllerV2.register);


/**
 * @openapi
 * /auth/login:
 *   post:
 *     summary: Login user (V2)
 *     description: |
 *       Supports multiple authentication methods:
 *       - password (mobile/email + password)
 *       - otp (mobile only)
 *       - google (email only)
 *     tags: [Auth]
 *
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             oneOf:
 *               - $ref: '#/components/schemas/LoginPassword'
 *               - $ref: '#/components/schemas/LoginOTP'
 *               - $ref: '#/components/schemas/LoginGoogle'
 *           examples:
 *
 *             password_mobile:
 *               summary: Password login using mobile
 *               value:
 *                 method: password
 *                 mobile: "01712345678"
 *                 password: "Password@123"
 *                 deviceId: "android-device-1"
 *
 *             password_email:
 *               summary: Password login using email
 *               value:
 *                 method: password
 *                 email: "john@example.com"
 *                 password: "Password@123"
 *                 deviceId: "web-browser"
 *
 *             otp_login:
 *               summary: OTP login
 *               value:
 *                 method: otp
 *                 mobile: "01712345678"
 *                 deviceId: "android-device-1"
 *
 *             google_login:
 *               summary: Google login
 *               value:
 *                 method: google
 *                 email: "john@gmail.com"
 *                 deviceId: "web-browser"
 *
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiSuccessResponse'
 *             examples:
 *               success:
 *                 value:
 *                   http_code: 200
 *                   message: Login successful
 *                   body:
 *                     user:
 *                       id: "uuid"
 *                       full_name: "John Doe"
 *                       mobile: "01712345678"
 *                       role: "resident"
 *                       status: "active"
 *                     tokens:
 *                       accessToken: "jwt-access-token"
 *                       refreshToken: "jwt-refresh-token"
 *
 *       401:
 *         description: Unauthorized
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
 *
 * @route   POST /auth/login
 * @desc    Login user
 * @access  Public
 */
authRouterV2.post('/login', validate(userLoginSchema), AuthControllerV2.login);

/**
 * @openapi
 * /auth/refresh:
 *   post:
 *     summary: Refresh access token (V2)
 *     tags: [Auth]
 *     description: |
 *       Issues a new access token and rotates refresh token.
 *       Detects token reuse and invalidates sessions if compromised.
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
 *                 example: "jwt-refresh-token"
 *     responses:
 *       200:
 *         description: Token refreshed successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiSuccessResponse'
 *             examples:
 *               success:
 *                 value:
 *                   http_code: 200
 *                   message: Token refreshed
 *                   body:
 *                     accessToken: "new-access-token"
 *                     refreshToken: "new-refresh-token"
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
authRouterV2.post('/refresh', AuthControllerV2.refresh);

/**
 * @openapi
 * /auth/logout:
 *   post:
 *     summary: Logout user (current device) (V2)
 *     tags: [Auth]
 *     description: Revokes current refresh token (session)
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
authRouterV2.post('/logout', AuthControllerV2.logout);

/**
 * @openapi
 * /auth/logout-all:
 *   post:
 *     summary: Logout from all devices (V2)
 *     tags: [Auth]
 *     description: |
 *       Revokes all sessions and rotates token version.
 *       Forces all devices to re-login.
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
authRouterV2.post('/logout-all', authGuard, asAuthenticated(AuthControllerV2.logoutAll));








