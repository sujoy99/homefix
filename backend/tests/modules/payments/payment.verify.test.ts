import { PaymentMethod, PaymentStatus } from '@homefix/shared';

jest.mock('../../../src/modules/config/config.service', () => ({
  ConfigService: { getSetting: jest.fn().mockResolvedValue('manual') },
}));

import { PaymentRepository } from '../../../src/modules/payments/payment.repository';
import { paymentService } from '../../../src/modules/payments/payment.service';

const ADMIN_ID   = 'a1eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
const PAYMENT_ID = 'b2eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';

const makePayment = (overrides = {}) => ({
  id: PAYMENT_ID,
  job_id: 'c3eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  resident_id: 'd4eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  provider_id: 'e5eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  amount_paisa: 100000,
  method: PaymentMethod.BKASH,
  transaction_id: 'TXN1234567',
  status: PaymentStatus.SUBMITTED,
  commission_rate: null,
  commission_rule_id: null,
  platform_fee_paisa: null,
  provider_net_paisa: null,
  created_at: new Date().toISOString(),
  verified_at: null,
  verified_by_admin_id: null,
  ...overrides,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
} as any);

let spyFindById: jest.SpyInstance;
let spyVerify: jest.SpyInstance;

beforeEach(() => {
  spyFindById = jest.spyOn(PaymentRepository, 'findById').mockResolvedValue(undefined);
  spyVerify   = jest.spyOn(PaymentRepository, 'verify').mockResolvedValue(undefined);
});

afterEach(() => jest.restoreAllMocks());

describe('paymentService.verifyPayment() — guards', () => {
  it('throws NotFoundError (404) when payment does not exist', async () => {
    spyFindById.mockResolvedValueOnce(undefined);
    await expect(paymentService.verifyPayment(PAYMENT_ID, ADMIN_ID)).rejects.toMatchObject({ statusCode: 404 });
  });

  it('throws BadRequestError (400) when payment is already verified', async () => {
    spyFindById.mockResolvedValueOnce(makePayment({ status: PaymentStatus.VERIFIED }));
    await expect(paymentService.verifyPayment(PAYMENT_ID, ADMIN_ID)).rejects.toMatchObject({ statusCode: 400 });
  });

  it('throws BadRequestError (400) when payment is completed', async () => {
    spyFindById.mockResolvedValueOnce(makePayment({ status: PaymentStatus.COMPLETED }));
    await expect(paymentService.verifyPayment(PAYMENT_ID, ADMIN_ID)).rejects.toMatchObject({ statusCode: 400 });
  });

  it('throws BadRequestError (400) when payment is failed', async () => {
    spyFindById.mockResolvedValueOnce(makePayment({ status: PaymentStatus.FAILED }));
    await expect(paymentService.verifyPayment(PAYMENT_ID, ADMIN_ID)).rejects.toMatchObject({ statusCode: 400 });
  });
});

describe('paymentService.verifyPayment() — success', () => {
  it('calls PaymentRepository.verify with the correct payment ID and admin ID', async () => {
    const verifiedAt = new Date().toISOString();
    spyFindById.mockResolvedValueOnce(makePayment({ status: PaymentStatus.SUBMITTED }));
    spyVerify.mockResolvedValueOnce(
      makePayment({ status: PaymentStatus.VERIFIED, verified_at: verifiedAt, verified_by_admin_id: ADMIN_ID })
    );

    await paymentService.verifyPayment(PAYMENT_ID, ADMIN_ID);

    expect(spyVerify).toHaveBeenCalledWith(PAYMENT_ID, ADMIN_ID);
  });

  it('returns payment with VERIFIED status', async () => {
    spyFindById.mockResolvedValueOnce(makePayment({ status: PaymentStatus.SUBMITTED }));
    spyVerify.mockResolvedValueOnce(
      makePayment({ status: PaymentStatus.VERIFIED, verified_by_admin_id: ADMIN_ID })
    );

    const result = await paymentService.verifyPayment(PAYMENT_ID, ADMIN_ID);

    expect(result.status).toBe(PaymentStatus.VERIFIED);
    expect(result.verified_by_admin_id).toBe(ADMIN_ID);
  });

  it('sets verified_at timestamp on verification', async () => {
    const verifiedAt = new Date().toISOString();
    spyFindById.mockResolvedValueOnce(makePayment({ status: PaymentStatus.SUBMITTED }));
    spyVerify.mockResolvedValueOnce(
      makePayment({ status: PaymentStatus.VERIFIED, verified_at: verifiedAt, verified_by_admin_id: ADMIN_ID })
    );

    const result = await paymentService.verifyPayment(PAYMENT_ID, ADMIN_ID);

    expect(result.verified_at).toBe(verifiedAt);
  });
});
