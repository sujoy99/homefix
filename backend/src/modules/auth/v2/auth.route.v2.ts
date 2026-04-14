import { Router } from 'express';
import { AuthControllerV2 } from './auth.controller.v2';
import { validate } from '@middlewares/validate';
import { registerSchema, loginSchema, userRegistrationSchema } from '../auth.schema';
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








