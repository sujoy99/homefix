/**
 * ============================
 * Payment Domain Types
 * ============================
 * Types for the payment system.
 *
 * Payment flow (from SRS REQ-018 to REQ-022):
 *   Job status must be AWAITING_PAYMENT before payment.
 *   Resident pays → 20% platform fee → 80% to provider wallet.
 *
 * Used in: backend, mobile, web
 */

/**
 * Supported payment methods (localized for Bangladesh).
 * From SRS REQ-019.
 */
export enum PaymentMethod {
  BKASH = 'bkash',
  NAGAD = 'nagad',
  CARD = 'card',
  BANK_TRANSFER = 'bank_transfer',
  CASH = 'cash',
}

/**
 * Payment status lifecycle.
 */
export enum PaymentStatus {
  PENDING = 'pending',
  SUBMITTED = 'submitted',      // TxID submitted, awaiting verification
  VERIFIED = 'verified',        // Admin verified the TxID
  COMPLETED = 'completed',      // Funds distributed (commission + wallet)
  FAILED = 'failed',
  REFUNDED = 'refunded',
}

/**
 * Payment methods that require manual Transaction ID entry.
 * From SRS REQ-020.
 */
export const REQUIRES_TRANSACTION_ID: ReadonlySet<PaymentMethod> = new Set([
  PaymentMethod.BKASH,
  PaymentMethod.NAGAD,
  PaymentMethod.BANK_TRANSFER,
]);

/**
 * Currency code for Bangladesh.
 */
export const CURRENCY_CODE = 'BDT' as const;

/**
 * Currency symbol for display.
 */
export const CURRENCY_SYMBOL = '৳' as const;
