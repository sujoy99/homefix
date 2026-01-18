import { z } from 'zod';
import validator from 'validator';

const PASSWORD_REGEX =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,128}$/;

/**
 * ============================
 * Register Validation Schema
 * ============================
 */
export const registerSchema = z.object({
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name is too long'),

  email: z
    .string()
    .trim()
    .toLowerCase()
    .refine((value) => validator.isEmail(value), {
      message: 'Invalid email address',
    }),

  password: z
    .string()
    .refine(
      (val) => PASSWORD_REGEX.test(val),
      {
        message:
          'Password must be 8–128 characters and include uppercase, lowercase, ' +
          'number, and special character',
      }
    ),
});

/**
 * ============================
 * Login Validation Schema
 * ============================
 */
export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .refine((value) => validator.isEmail(value), {
      message: 'Invalid email address',
    }),

  password: z.string().min(1, 'Password is required'),
});

/**
 * ============================
 * DTO Types
 * ============================
 */
export type RegisterDTO = z.infer<typeof registerSchema>;
export type LoginDTO = z.infer<typeof loginSchema>;
