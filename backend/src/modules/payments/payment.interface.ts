import { PaymentMethod, PaymentStatus } from '@homefix/shared';

export interface PaymentData {
  jobId: string;
  residentId: string;
  providerId: string;
  /** Total amount paid by Resident, in paisa (1 taka = 100 paisa). */
  amountPaisa: number;
  method: PaymentMethod;
  /** Required for bKash, Nagad, bank_transfer. Null for cash/card. */
  transactionId?: string;
}

export interface PaymentResult {
  success: boolean;
  paymentId: string;
  status: PaymentStatus;
}

export interface VerificationResult {
  verified: boolean;
  failureReason?: string;
}

export interface IPaymentGateway {
  processPayment(data: PaymentData): Promise<PaymentResult>;
  verifyPayment(transactionId: string): Promise<VerificationResult>;
}
