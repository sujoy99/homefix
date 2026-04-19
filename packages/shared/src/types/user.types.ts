/**
 * ============================
 * User Domain Types
 * ============================
 * Framework-agnostic types shared across all apps.
 * Source of truth for user-related enums and types.
 *
 * Used in: backend, mobile, web
 */

/**
 * Supported user roles in the system.
 *
 * - RESIDENT / PROVIDER → public registration
 * - ADMIN → internal / admin panel only
 */
export enum UserRole {
  RESIDENT = 'resident',
  PROVIDER = 'provider',
  ADMIN = 'admin',
}

/**
 * User account status lifecycle.
 *
 * - ACTIVE → resident (default on registration)
 * - PENDING → provider (requires admin approval)
 * - INACTIVE → deactivated by admin
 */
export enum UserStatus {
  PENDING = 'pending',
  ACTIVE = 'active',
  INACTIVE = 'inactive',
}

/**
 * Supported authentication methods.
 *
 * - PASSWORD → mobile/email + password
 * - OTP → SMS-based one-time password (future)
 * - GOOGLE → Google OAuth (future)
 * - FACEBOOK → Facebook OAuth (future)
 */
export enum AuthMethod {
  PASSWORD = 'password',
  OTP = 'otp',
  GOOGLE = 'google',
  FACEBOOK = 'facebook',
}

/**
 * Roles allowed for public registration.
 * ADMIN is intentionally excluded — created via seed/internal only.
 */
export const PUBLIC_REGISTRATION_ROLES = [
  UserRole.RESIDENT,
  UserRole.PROVIDER,
] as const;

export type PublicRegistrationRole = (typeof PUBLIC_REGISTRATION_ROLES)[number];
