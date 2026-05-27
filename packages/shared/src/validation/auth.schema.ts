import { z } from 'zod';
import { UserRole, AuthMethod } from '../types/user.types';

export const PASSWORD_REGEX =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?#&])[A-Za-z\d@$!%*?#&]{8,}$/;

/**
 * ============================
 * Registration Payload Schema
 * ============================
 */
export const userRegistrationPayloadSchema = z
  .object({
    full_name: z
      .string()
      .min(1, 'validation.name_required')
      .min(3, 'validation.name_min'),

    mobile: z.string().regex(/^[0-9]{11}$/, 'validation.mobile_invalid'),

    nid: z.string().regex(/^[0-9]{10,17}$/, 'validation.nid_invalid'),

    latitude: z.number(),
    longitude: z.number(),

    role: z.enum([UserRole.RESIDENT, UserRole.PROVIDER]),

    email: z
      .string()
      .trim()
      .toLowerCase()
      .email('validation.email_invalid')
      .optional()
      .or(z.literal('')), // allow empty string from form

    password: z
      .string()
      .min(8, 'validation.password_min')
      .max(128)
      .refine((val) => PASSWORD_REGEX.test(val), {
        message: 'validation.password_complexity',
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
    message: 'validation.nid_photo_required',
    path: ['nid_photo_url'],
  });

export type UserRegistrationPayload = z.infer<typeof userRegistrationPayloadSchema>;

/**
 * ============================
 * Login Payload Schema
 * ============================
 */
const baseLoginSchema = z.object({
  deviceId: z.string().min(1, 'validation.device_id_required'),
});

const passwordLoginSchema = baseLoginSchema
  .extend({
    method: z.literal(AuthMethod.PASSWORD),
    mobile: z
      .string()
      .regex(/^[0-9]{11}$/, 'validation.mobile_invalid')
      .optional()
      .or(z.literal('')),
    email: z
      .string()
      .trim()
      .toLowerCase()
      .email('validation.email_invalid')
      .optional()
      .or(z.literal('')),
    password: z.string().min(1, 'validation.password_required'),
  })
  .refine((data) => !!data.mobile || !!data.email, {
    message: 'validation.mobile_required',
    path: ['mobile'], // Attach error to mobile field primarily
  });

const otpLoginSchema = baseLoginSchema.extend({
  method: z.literal(AuthMethod.OTP),
  mobile: z.string().regex(/^[0-9]{11}$/, 'validation.mobile_invalid'),
});

const googleLoginSchema = baseLoginSchema.extend({
  method: z.literal(AuthMethod.GOOGLE),
  email: z.string().trim().toLowerCase().email('validation.email_invalid'),
});

export const userLoginPayloadSchema = z.discriminatedUnion('method', [
  passwordLoginSchema,
  otpLoginSchema,
  googleLoginSchema,
]);

export type UserLoginPayload = z.infer<typeof userLoginPayloadSchema>;
