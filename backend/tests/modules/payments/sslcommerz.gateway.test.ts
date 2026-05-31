import { SslCommerzGateway } from '../../../src/modules/payments/gateways/sslcommerz.gateway';
import { BadRequestError } from '../../../src/errors/http-errors';
import { ErrorCode } from '../../../src/errors/error-code';
import { PaymentMethod } from '@homefix/shared';
import type { PaymentData } from '../../../src/modules/payments/payment.interface';

const gateway = new SslCommerzGateway();

const basePaymentData: PaymentData = {
  jobId: 'job-uuid-001',
  residentId: 'resident-uuid-001',
  providerId: 'provider-uuid-001',
  amountPaisa: 100000,
  method: PaymentMethod.CARD,
};

describe('SslCommerzGateway — Phase 2 stub', () => {
  it('processPayment() throws BadRequestError with NOT_IMPLEMENTED code', async () => {
    await expect(gateway.processPayment(basePaymentData)).rejects.toThrow(BadRequestError);
    await expect(gateway.processPayment(basePaymentData)).rejects.toMatchObject({
      errorCode: ErrorCode.NOT_IMPLEMENTED,
    });
  });

  it('verifyPayment() throws BadRequestError with NOT_IMPLEMENTED code', async () => {
    await expect(gateway.verifyPayment('some-txn-id')).rejects.toThrow(BadRequestError);
    await expect(gateway.verifyPayment('some-txn-id')).rejects.toMatchObject({
      errorCode: ErrorCode.NOT_IMPLEMENTED,
    });
  });
});
