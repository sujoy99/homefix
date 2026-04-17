import { z } from 'zod';
import validator from 'validator';
import { UserRole } from '@modules/users/user.types';
import { AuthMethod } from './auth.types';

const PASSWORD_REGEX =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?#&])[A-Za-z\d@$!%*?#&]{8,}$/;

/**
 * ============================
 * Register Validation Schema
 * ============================
 * Public registration
 * - RESIDENT / PROVIDER allowed
 * - ADMIN explicitly blocked
 */
export const registerSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),

    email: z
      .string()
      .trim()
      .toLowerCase()
      .refine((value) => validator.isEmail(value), {
        message: 'Invalid email address',
      }),

    password: z
      .string()
      .min(8)
      .max(128)
      .refine((val) => PASSWORD_REGEX.test(val), {
        message:
          'Password must be 8–128 characters and include uppercase, lowercase, ' +
          'number, and special character',
      }),
    /**
     * Role selection (public-safe)
     * ADMIN is intentionally excluded
     */
    role: z.enum([UserRole.RESIDENT, UserRole.PROVIDER]),
  }),
});

/**
 * ============================
 * Register Validation Schema (V2)
 * ============================
 * Public registration
 * - RESIDENT / PROVIDER allowed
 * - ADMIN explicitly blocked
 * - Mobile + NID registration
 * - Provider requires NID photo
 */
export const userRegistrationSchema = z.object({
  body: z
    .object({
      full_name: z
        .string()
        .min(3, 'Full name must be at least 3 characters'),

      mobile: z
        .string()
        .regex(/^[0-9]{11}$/, 'Mobile must be 11 digits'),

      nid: z
        .string()
        .regex(/^[0-9]{10}$/, 'NID must be 10 digits'),

      latitude: z.number(),
      longitude: z.number(),

      /**
       * Only RESIDENT / PROVIDER allowed
       */
      role: z.enum([UserRole.RESIDENT, UserRole.PROVIDER]),

      /**
       * Optional (email, password, provider)
       */
      email: z
      .string()
      .trim()
      .toLowerCase()
      .refine((value) => validator.isEmail(value), {
        message: 'Invalid email address',
      })
      .optional(),

      password: z
      .string()
      .min(8)
      .max(128)
      .refine((val) => PASSWORD_REGEX.test(val), {
        message:
          'Password must be 8–128 characters and include uppercase, lowercase, ' +
          'number, and special character',
      })
      .optional(),

      auth_method: z.enum([AuthMethod.PASSWORD, AuthMethod.OTP, AuthMethod.GOOGLE, AuthMethod.FACEBOOK])
      .optional(),

      /**
       * Optional (nid required for provider)
       */
      photo_url: z.string().optional(),
      nid_photo_url: z.string().optional(),
    })
  .refine(
    (data) =>
      data.role !== UserRole.PROVIDER || !!data.nid_photo_url,
    {
      message: 'NID photo is required for provider',
      path: ['nid_photo_url'],
    }
  ),
});

/**
 * ============================
 * Login Validation Schema
 * ============================
 */
export const loginSchema = z.object({
  body: z.object({
    email: z
      .string()
      .trim()
      .toLowerCase()
      .refine((value) => validator.isEmail(value), {
        message: 'Invalid email address',
      }),

    password: z.string().min(1, 'Password is required'),
    deviceId: z.string()
  }),
});

/**
 * Common fields
 */
const baseSchema = z.object({
  deviceId: z.string(),
});

/**
 * PASSWORD login (mobile/email + password)
 */
const passwordSchema = baseSchema.extend({
  method: z.literal(AuthMethod.PASSWORD),

  mobile: z
    .string()
    .regex(/^[0-9]{11}$/, 'Mobile must be 11 digits')
    .optional(),

  email: z
    .string()
    .trim()
    .toLowerCase()
    .refine((v) => validator.isEmail(v), {
      message: 'Invalid email',
    })
    .optional(),

  password: z.string().min(1, 'Password is required'),
}).refine((data) => data.mobile || data.email, {
  message: 'Mobile or email is required',
});

/**
 * OTP login (mobile only)
 */
const otpSchema = baseSchema.extend({
  method: z.literal(AuthMethod.OTP),

  mobile: z
    .string()
    .regex(/^[0-9]{11}$/, 'Mobile must be 11 digits'),
});

/**
 * Google login (email only for now)
 */
const googleSchema = baseSchema.extend({
  method: z.literal(AuthMethod.GOOGLE),

  email: z
    .string()
    .trim()
    .toLowerCase()
    .refine((v) => validator.isEmail(v), {
      message: 'Invalid email',
    }),
});

export const userLoginSchema = z.object({
  
  body: z.discriminatedUnion('method', [
    passwordSchema,
    otpSchema,
    googleSchema,
  ]),
});
