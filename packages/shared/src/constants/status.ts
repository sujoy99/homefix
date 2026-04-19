/**
 * ============================
 * Status Display Mappings
 * ============================
 * Human-readable labels for status values.
 * Used by frontend for consistent display.
 *
 * These are in English — localized labels come from i18n files.
 * These serve as fallback keys / identifiers.
 */

import { JobStatus } from '@/types/job.types';
import { PaymentStatus } from '@/types/payment.types';
import { UserStatus } from '@/types/user.types';

/**
 * Job status display labels (English fallback).
 * Actual display uses i18n keys: `job.status.{status}`
 */
export const JOB_STATUS_LABELS: Record<JobStatus, string> = {
  [JobStatus.PENDING]: 'Pending',
  [JobStatus.ACTIVE]: 'Active',
  [JobStatus.AWAITING_PAYMENT]: 'Awaiting Payment',
  [JobStatus.PAID]: 'Paid',
  [JobStatus.CANCELLED]: 'Cancelled',
};

/**
 * Payment status display labels (English fallback).
 */
export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  [PaymentStatus.PENDING]: 'Pending',
  [PaymentStatus.SUBMITTED]: 'Submitted',
  [PaymentStatus.VERIFIED]: 'Verified',
  [PaymentStatus.COMPLETED]: 'Completed',
  [PaymentStatus.FAILED]: 'Failed',
  [PaymentStatus.REFUNDED]: 'Refunded',
};

/**
 * User status display labels (English fallback).
 */
export const USER_STATUS_LABELS: Record<UserStatus, string> = {
  [UserStatus.PENDING]: 'Pending Approval',
  [UserStatus.ACTIVE]: 'Active',
  [UserStatus.INACTIVE]: 'Inactive',
};
