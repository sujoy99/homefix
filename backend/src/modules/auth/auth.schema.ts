import { z } from 'zod';
import validator from 'validator';
import { UserRole } from '@modules/users/user.types';

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
