import { z } from 'zod';
import { UserRole, AuthMethod } from '@/types/user.types';

export const PASSWORD_REGEX =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?#&])[A-Za-z\d@$!%*?#&]{8,}$/;

/**
 * ============================
 * Registration Payload Schema
 * ============================
 */
export const userRegistrationPayloadSchema = z
  .object({
    full_name: z.string().min(3, 'Full name must be at least 3 characters'),

    mobile: z.string().regex(/^[0-9]{11}$/, 'Mobile must be 11 digits'),

    nid: z.string().regex(/^[0-9]{10}$/, 'NID must be 10 digits'),

    latitude: z.number(),
    longitude: z.number(),

    role: z.enum([UserRole.RESIDENT, UserRole.PROVIDER]),

    email: z
      .string()
      .trim()
      .toLowerCase()
      .email('Invalid email address')
      .optional()
      .or(z.literal('')), // allow empty string from form

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

    auth_method: z
      .enum([
        AuthMethod.PASSWORD,
        AuthMethod.OTP,
        AuthMethod.GOOGLE,
        AuthMethod.FACEBOOK,
      ])
      .optional(),

    photo_url: z.string().optional(),
    nid_photo_url: z.string().optional(),
  })
  .refine((data) => data.role !== UserRole.PROVIDER || !!data.nid_photo_url, {
    message: 'NID photo is required for provider',
    path: ['nid_photo_url'],
  });

export type UserRegistrationPayload = z.infer<typeof userRegistrationPayloadSchema>;

/**
 * ============================
 * Login Payload Schema
 * ============================
 */
const baseLoginSchema = z.object({
  deviceId: z.string().min(1, 'Device ID is required'),
});

const passwordLoginSchema = baseLoginSchema
  .extend({
    method: z.literal(AuthMethod.PASSWORD),
    mobile: z
      .string()
      .regex(/^[0-9]{11}$/, 'Mobile must be 11 digits')
      .optional()
      .or(z.literal('')),
    email: z
      .string()
      .trim()
      .toLowerCase()
      .email('Invalid email')
      .optional()
      .or(z.literal('')),
    password: z.string().min(1, 'Password is required'),
  })
  .refine((data) => !!data.mobile || !!data.email, {
    message: 'Mobile or email is required',
    path: ['mobile'], // Attach error to mobile field primarily
  });

const otpLoginSchema = baseLoginSchema.extend({
  method: z.literal(AuthMethod.OTP),
  mobile: z.string().regex(/^[0-9]{11}$/, 'Mobile must be 11 digits'),
});

const googleLoginSchema = baseLoginSchema.extend({
  method: z.literal(AuthMethod.GOOGLE),
  email: z.string().trim().toLowerCase().email('Invalid email'),
});

export const userLoginPayloadSchema = z.discriminatedUnion('method', [
  passwordLoginSchema,
  otpLoginSchema,
  googleLoginSchema,
]);

export type UserLoginPayload = z.infer<typeof userLoginPayloadSchema>;
