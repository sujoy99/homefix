import { PaymentStatus } from '@homefix/shared';
import { IPaymentGateway, PaymentData, PaymentResult, VerificationResult } from '../payment.interface';

/**
 * Phase 1 manual gateway — bKash / Nagad / Bank Transfer / Cash.
 *
 * Flow: Resident sends money to HomeFix merchant account out-of-band,
 * then submits their Transaction ID here. Admin verifies manually.
 * No real-time API call to MFS provider is made in Phase 1.
 */
export class ManualPaymentGateway implements IPaymentGateway {
  async processPayment(data: PaymentData): Promise<PaymentResult> {
    // Validation happens in payment.service before reaching here.
    // The gateway's job is only to return the initial status.
    // Actual DB write is done by payment.service inside a transaction.
    return {
      success: true,
      paymentId: '', // Filled in by payment.service after DB insert
      status: PaymentStatus.SUBMITTED,
    };
  }

  async verifyPayment(_transactionId: string): Promise<VerificationResult> {
    // Phase 1: Admin verifies manually — no API call to bKash/Nagad.
    return { verified: false, failureReason: 'Manual verification required by admin' };
  }
}
