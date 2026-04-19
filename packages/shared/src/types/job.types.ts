/**
 * ============================
 * Job / Booking Domain Types
 * ============================
 * Types for the service booking lifecycle.
 *
 * Status machine (from SRS Section 6.2):
 *   PENDING → ACTIVE → AWAITING_PAYMENT → PAID
 *   Any state → CANCELLED (with reason)
 *
 * Used in: backend, mobile, web
 */

/**
 * Job status lifecycle.
 *
 * Flow:
 *   Resident posts → PENDING
 *   Provider accepts → ACTIVE
 *   Provider completes work → AWAITING_PAYMENT
 *   Resident pays → PAID
 *   Either party cancels → CANCELLED
 */
export enum JobStatus {
  PENDING = 'pending',
  ACTIVE = 'active',
  AWAITING_PAYMENT = 'awaiting_payment',
  PAID = 'paid',
  CANCELLED = 'cancelled',
}

/**
 * Valid status transitions.
 * Used to enforce the state machine in both backend (validation)
 * and frontend (UI state display).
 */
export const JOB_STATUS_TRANSITIONS: Record<JobStatus, JobStatus[]> = {
  [JobStatus.PENDING]: [JobStatus.ACTIVE, JobStatus.CANCELLED],
  [JobStatus.ACTIVE]: [JobStatus.AWAITING_PAYMENT, JobStatus.CANCELLED],
  [JobStatus.AWAITING_PAYMENT]: [JobStatus.PAID, JobStatus.CANCELLED],
  [JobStatus.PAID]: [],          // Terminal state
  [JobStatus.CANCELLED]: [],     // Terminal state
};

/**
 * Check if a status transition is valid.
 */
export function isValidJobTransition(
  from: JobStatus,
  to: JobStatus
): boolean {
  return JOB_STATUS_TRANSITIONS[from].includes(to);
}
