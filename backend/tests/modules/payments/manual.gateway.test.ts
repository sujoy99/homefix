import { ManualPaymentGateway } from '../../../src/modules/payments/gateways/manual.gateway';
import { PaymentMethod, PaymentStatus } from '@homefix/shared';
import type { PaymentData } from '../../../src/modules/payments/payment.interface';

const gateway = new ManualPaymentGateway();

const basePaymentData: PaymentData = {
  jobId: 'job-uuid-001',
  residentId: 'resident-uuid-001',
  providerId: 'provider-uuid-001',
  amountPaisa: 100000, // ৳1,000 in paisa
  method: PaymentMethod.BKASH,
  transactionId: 'TXN12345678',
};

describe('ManualPaymentGateway.processPayment()', () => {
  it('returns success with SUBMITTED status for bKash payment', async () => {
    const result = await gateway.processPayment(basePaymentData);

    expect(result.success).toBe(true);
    expect(result.status).toBe(PaymentStatus.SUBMITTED);
  });

  it('returns success with SUBMITTED status for Nagad payment', async () => {
    const result = await gateway.processPayment({
      ...basePaymentData,
      method: PaymentMethod.NAGAD,
      transactionId: 'NGD12345678',
    });

    expect(result.success).toBe(true);
    expect(result.status).toBe(PaymentStatus.SUBMITTED);
  });

  it('returns success with SUBMITTED status for cash payment (no TxID)', async () => {
    const { transactionId: _txn, ...cashData } = { ...basePaymentData, method: PaymentMethod.CASH };
    const result = await gateway.processPayment(cashData);

    expect(result.success).toBe(true);
    expect(result.status).toBe(PaymentStatus.SUBMITTED);
  });

  it('returns empty paymentId — DB insert is done by payment.service', async () => {
    const result = await gateway.processPayment(basePaymentData);
    // paymentId is filled in by payment.service after DB insert, not by gateway
    expect(result.paymentId).toBe('');
  });
});

describe('ManualPaymentGateway.verifyPayment()', () => {
  it('returns verified:false — Phase 1 requires manual Admin verification', async () => {
    const result = await gateway.verifyPayment('TXN12345678');

    expect(result.verified).toBe(false);
    expect(result.failureReason).toBeTruthy();
  });

  it('failureReason string is present and non-empty', async () => {
    const result = await gateway.verifyPayment('ANY_TXN_ID');

    expect(typeof result.failureReason).toBe('string');
    expect((result.failureReason as string).length).toBeGreaterThan(0);
  });
});
