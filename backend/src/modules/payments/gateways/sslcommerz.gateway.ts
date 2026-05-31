import { ErrorCode } from '@errors/error-code';
import { BadRequestError } from '@errors/http-errors';
import { IPaymentGateway, PaymentData, PaymentResult, VerificationResult } from '../payment.interface';

/**
 * Phase 2 SSLCommerz gateway — card and online payments.
 * Stub only. Implement when SSLCommerz subscription is active.
 * Switch by setting platform_settings.active_payment_gateway = 'sslcommerz'.
 */
export class SslCommerzGateway implements IPaymentGateway {
  async processPayment(_data: PaymentData): Promise<PaymentResult> {
    throw new BadRequestError(ErrorCode.NOT_IMPLEMENTED, 'SSLCommerz gateway is not yet active');
  }

  async verifyPayment(_transactionId: string): Promise<VerificationResult> {
    throw new BadRequestError(ErrorCode.NOT_IMPLEMENTED, 'SSLCommerz gateway is not yet active');
  }
}
