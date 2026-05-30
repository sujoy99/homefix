import { JobStatus, PaymentMethod, PaymentStatus } from '@homefix/shared';

// Mock config first so the gateway registry is created with the mock in place
jest.mock('../../../src/modules/config/config.service', () => ({
  ConfigService: { getSetting: jest.fn().mockResolvedValue('manual') },
}));

import { JobRepository } from '../../../src/modules/jobs/job.repository';
import { PaymentRepository } from '../../../src/modules/payments/payment.repository';
import { paymentService } from '../../../src/modules/payments/payment.service';

const RESIDENT_ID = 'a1eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
const PROVIDER_ID = 'b2eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
const JOB_ID      = 'c3eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';

const makeJob = (overrides = {}) => ({
  id: JOB_ID,
  resident_id: RESIDENT_ID,
  provider_id: PROVIDER_ID,
  status: JobStatus.AWAITING_PAYMENT,
  category_id: 'd4eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  ...overrides,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
} as any);

const makePayment = (overrides = {}) => ({
  id: 'e5eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  job_id: JOB_ID,
  resident_id: RESIDENT_ID,
  provider_id: PROVIDER_ID,
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

let spyFindJob: jest.SpyInstance;
let spyFindPayment: jest.SpyInstance;
let spyCreate: jest.SpyInstance;

beforeEach(() => {
  spyFindJob = jest.spyOn(JobRepository, 'findById').mockResolvedValue(makeJob());
  spyFindPayment = jest.spyOn(PaymentRepository, 'findByJobId').mockResolvedValue(undefined);
  spyCreate = jest.spyOn(PaymentRepository, 'create').mockResolvedValue(makePayment());
});

afterEach(() => jest.restoreAllMocks());

describe('paymentService.submitPayment() — guards', () => {
  it('throws NotFoundError (404) when job does not exist', async () => {
    spyFindJob.mockResolvedValueOnce(undefined);

    await expect(
      paymentService.submitPayment(RESIDENT_ID, {
        job_id: JOB_ID, method: PaymentMethod.BKASH, transaction_id: 'TXN1234567', amount_paisa: 100000,
      })
    ).rejects.toMatchObject({ statusCode: 404 });
  });

  it('throws ForbiddenError (403) when resident does not own the job', async () => {
    spyFindJob.mockResolvedValueOnce(makeJob({ resident_id: 'f6eebc99-9c0b-4ef8-bb6d-6bb9bd380a11' }));

    await expect(
      paymentService.submitPayment(RESIDENT_ID, {
        job_id: JOB_ID, method: PaymentMethod.BKASH, transaction_id: 'TXN1234567', amount_paisa: 100000,
      })
    ).rejects.toMatchObject({ statusCode: 403 });
  });

  it('throws BadRequestError (400) when job is not AWAITING_PAYMENT', async () => {
    spyFindJob.mockResolvedValueOnce(makeJob({ status: JobStatus.ACTIVE }));

    await expect(
      paymentService.submitPayment(RESIDENT_ID, {
        job_id: JOB_ID, method: PaymentMethod.BKASH, transaction_id: 'TXN1234567', amount_paisa: 100000,
      })
    ).rejects.toMatchObject({ statusCode: 400 });
  });

  it('throws BadRequestError (400) when a payment already exists for the job', async () => {
    spyFindPayment.mockResolvedValueOnce(makePayment());

    await expect(
      paymentService.submitPayment(RESIDENT_ID, {
        job_id: JOB_ID, method: PaymentMethod.BKASH, transaction_id: 'TXN1234567', amount_paisa: 100000,
      })
    ).rejects.toMatchObject({ statusCode: 400 });
  });

  it('throws BadRequestError (400) when job has no assigned provider', async () => {
    spyFindJob.mockResolvedValueOnce(makeJob({ provider_id: null }));

    await expect(
      paymentService.submitPayment(RESIDENT_ID, {
        job_id: JOB_ID, method: PaymentMethod.BKASH, transaction_id: 'TXN1234567', amount_paisa: 100000,
      })
    ).rejects.toMatchObject({ statusCode: 400 });
  });
});

describe('paymentService.submitPayment() — success', () => {
  it('creates and returns a submitted payment for bKash with TxID', async () => {
    const result = await paymentService.submitPayment(RESIDENT_ID, {
      job_id: JOB_ID, method: PaymentMethod.BKASH, transaction_id: 'TXN1234567', amount_paisa: 100000,
    });

    expect(spyCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        job_id: JOB_ID,
        resident_id: RESIDENT_ID,
        provider_id: PROVIDER_ID,
        method: PaymentMethod.BKASH,
        transaction_id: 'TXN1234567',
        amount_paisa: 100000,
      })
    );
    expect(result.status).toBe(PaymentStatus.SUBMITTED);
  });

  it('creates payment for cash without including transaction_id in the DB write', async () => {
    spyCreate.mockResolvedValueOnce(makePayment({ method: PaymentMethod.CASH, transaction_id: null }));

    await paymentService.submitPayment(RESIDENT_ID, {
      job_id: JOB_ID, method: PaymentMethod.CASH, amount_paisa: 100000,
    });

    expect(spyCreate).toHaveBeenCalledWith(
      expect.not.objectContaining({ transaction_id: expect.anything() })
    );
  });

  it('routes through ManualPaymentGateway and calls repository.create once', async () => {
    await paymentService.submitPayment(RESIDENT_ID, {
      job_id: JOB_ID, method: PaymentMethod.NAGAD, transaction_id: 'NGD1234567', amount_paisa: 50000,
    });

    expect(spyCreate).toHaveBeenCalledTimes(1);
  });
});
