/**
 * ============================
 * Commission & Financial Constants
 * ============================
 * From SRS Section 6.1:
 *   Platform Fee: 20% of job value → Admin balance
 *   Provider Payout: 80% of job value → Provider wallet
 *
 * Example (SRS):
 *   Job = ৳1,000
 *   Platform Fee = ৳200
 *   Provider Payout = ৳800
 *
 * These values are centralized here so backend (calculation)
 * and frontend (display) always agree.
 */

/**
 * Platform commission rate (0.0 to 1.0).
 */
export const PLATFORM_COMMISSION_RATE = 0.20;

/**
 * Provider payout rate (1 - commission).
 */
export const PROVIDER_PAYOUT_RATE = 1 - PLATFORM_COMMISSION_RATE;

/**
 * Calculate commission breakdown for a given job amount.
 *
 * @param totalAmount - Total job value in BDT
 * @returns Breakdown of platform fee and provider payout
 *
 * @example
 * ```ts
 * const result = calculateCommission(1000);
 * // { totalAmount: 1000, platformFee: 200, providerPayout: 800 }
 * ```
 */
export function calculateCommission(totalAmount: number): {
  totalAmount: number;
  platformFee: number;
  providerPayout: number;
} {
  const platformFee = Math.round(totalAmount * PLATFORM_COMMISSION_RATE);
  const providerPayout = totalAmount - platformFee;

  return {
    totalAmount,
    platformFee,
    providerPayout,
  };
}
