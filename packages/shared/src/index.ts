/**
 * ============================
 * @homefix/shared
 * ============================
 * Central export point for all shared code.
 * Used by: backend, mobile, web
 *
 * Import pattern:
 *   import { UserRole, ErrorCode } from '@homefix/shared';
 */

// ── Types ──────────────────────────────────────
export { UserRole, UserStatus, AuthMethod, PUBLIC_REGISTRATION_ROLES } from '@/types/user.types';
export type { PublicRegistrationRole } from '@/types/user.types';

export { ErrorCode, FORCE_LOGOUT_CODES, TOKEN_REFRESH_CODES } from '@/types/auth.types';
export type { ApiResponse, FieldError, PaginatedBody } from '@/types/auth.types';

export { JobStatus, JOB_STATUS_TRANSITIONS, isValidJobTransition } from '@/types/job.types';

export { PaymentMethod, PaymentStatus, REQUIRES_TRANSACTION_ID, CURRENCY_CODE, CURRENCY_SYMBOL } from '@/types/payment.types';

// ── Constants ──────────────────────────────────
export { PLATFORM_COMMISSION_RATE, PROVIDER_PAYOUT_RATE, calculateCommission } from '@/constants/commission';
export { JOB_STATUS_LABELS, PAYMENT_STATUS_LABELS, USER_STATUS_LABELS } from '@/constants/status';

// ── Validation ───────────────────────────────────
export { userRegistrationPayloadSchema, userLoginPayloadSchema, PASSWORD_REGEX } from '@/validation/auth.schema';
export type { UserRegistrationPayload, UserLoginPayload } from '@/validation/auth.schema';
