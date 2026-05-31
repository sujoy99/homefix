import { CommissionRuleScope } from '@homefix/shared';
import { CommissionRepository } from '../../../src/modules/payments/commission/commission.repository';
import { Payment } from '../../../src/modules/payments/payment.model';
import { Job } from '../../../src/modules/jobs/job.model';
import { PaymentRepository } from '../../../src/modules/payments/payment.repository';
import { RevenueLedgerRepository } from '../../../src/modules/payments/revenue/revenue.repository';
import { WalletService } from '../../../src/modules/payments/wallet/wallet.service';
import { CommissionService } from '../../../src/modules/payments/commission/commission.service';

// ─── Fixtures ────────────────────────────────────────────────────────────────

const PAYMENT_ID    = 'a1eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
const JOB_ID        = 'b2eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
const PROVIDER_ID   = 'c3eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
const CATEGORY_ID   = 'd4eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
const RULE_ID       = 'e5eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
const RULE_ID_CAT   = 'f6eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
const RULE_ID_PROMO = 'a7eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const MOCK_TRX = {} as any;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const makeRule = (overrides: Record<string, unknown> = {}): any => ({
  id: RULE_ID, scope: CommissionRuleScope.GLOBAL, rate: '0.2000', label: 'Default Rate', is_active: true, ...overrides,
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const makePayment = (overrides: Record<string, unknown> = {}): any => ({
  id: PAYMENT_ID, job_id: JOB_ID, provider_id: PROVIDER_ID, amount_paisa: 100000, ...overrides,
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const makeJob = (overrides: Record<string, unknown> = {}): any => ({
  id: JOB_ID, category_id: CATEGORY_ID, ...overrides,
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockQueryBuilder = (resolved: unknown): any => ({
  findById: jest.fn().mockResolvedValue(resolved),
});

afterEach(() => jest.restoreAllMocks());

// ─── resolveRate — priority resolution ───────────────────────────────────────

describe('CommissionService.resolveRate() — priority resolution', () => {
  it('returns the promotion rule when one matches', async () => {
    const promoRule = makeRule({ id: RULE_ID_PROMO, scope: CommissionRuleScope.PROMOTION, rate: '0.1000' });
    jest.spyOn(CommissionRepository, 'resolveRule').mockResolvedValueOnce(promoRule);

    const result = await CommissionService.resolveRate(CATEGORY_ID, new Date());

    expect(result.rate).toBeCloseTo(0.1);
    expect(result.commissionRuleId).toBe(RULE_ID_PROMO);
  });

  it('falls back to category rule when no promotion matches', async () => {
    const catRule = makeRule({ id: RULE_ID_CAT, scope: CommissionRuleScope.CATEGORY, rate: '0.1500' });
    jest.spyOn(CommissionRepository, 'resolveRule').mockResolvedValueOnce(catRule);

    const result = await CommissionService.resolveRate(CATEGORY_ID, new Date());

    expect(result.rate).toBeCloseTo(0.15);
    expect(result.commissionRuleId).toBe(RULE_ID_CAT);
  });

  it('falls back to global rule when no category or promotion matches', async () => {
    jest.spyOn(CommissionRepository, 'resolveRule').mockResolvedValueOnce(makeRule());

    const result = await CommissionService.resolveRate(CATEGORY_ID, new Date());

    expect(result.rate).toBeCloseTo(0.2);
    expect(result.commissionRuleId).toBe(RULE_ID);
    expect(result.label).toBe('Default Rate');
  });

  it('throws NotFoundError (404) when no rule exists at all', async () => {
    jest.spyOn(CommissionRepository, 'resolveRule').mockResolvedValueOnce(undefined);

    await expect(CommissionService.resolveRate(CATEGORY_ID, new Date())).rejects.toMatchObject({ statusCode: 404 });
  });

  it('passes null categoryId to repository (global-only path)', async () => {
    const spyResolve = jest.spyOn(CommissionRepository, 'resolveRule').mockResolvedValueOnce(makeRule());

    await CommissionService.resolveRate(null, new Date());

    expect(spyResolve).toHaveBeenCalledWith(null, expect.any(Date));
  });
});

// ─── applyCommission — shared beforeEach setup ───────────────────────────────

function setupApplyMocks(paymentOverride?: Record<string, unknown>) {
  jest.spyOn(Payment, 'query').mockReturnValue(mockQueryBuilder(makePayment(paymentOverride ?? {})));
  jest.spyOn(Job, 'query').mockReturnValue(mockQueryBuilder(makeJob()));
  jest.spyOn(CommissionRepository, 'resolveRule').mockResolvedValue(makeRule());
  jest.spyOn(PaymentRepository, 'applyCommissionFields').mockResolvedValue(undefined);
  jest.spyOn(RevenueLedgerRepository, 'insert').mockResolvedValue(undefined as never);
  jest.spyOn(WalletService, 'creditWallet').mockResolvedValue(undefined);
}

// ─── applyCommission — paisa math ────────────────────────────────────────────

describe('CommissionService.applyCommission() — paisa math', () => {
  it('floors platform_fee_paisa — never rounds up', async () => {
    // 100001 paisa × 0.2 = 20000.2 → floor = 20000
    setupApplyMocks({ amount_paisa: 100001 });

    await CommissionService.applyCommission(PAYMENT_ID, MOCK_TRX);

    const fields = (PaymentRepository.applyCommissionFields as jest.Mock).mock.calls[0][1];
    expect(fields.platform_fee_paisa).toBe(20000);
    expect(fields.provider_net_paisa).toBe(100001 - 20000);
  });

  it('platform_fee + provider_net always equals amount_paisa', async () => {
    for (const amount of [100000, 50050, 1, 9999999]) {
      setupApplyMocks({ amount_paisa: amount });

      await CommissionService.applyCommission(PAYMENT_ID, MOCK_TRX);

      const fields = (PaymentRepository.applyCommissionFields as jest.Mock).mock.lastCall[1];
      expect(fields.platform_fee_paisa + fields.provider_net_paisa).toBe(amount);
      jest.restoreAllMocks();
    }
  });

  it('applies the 20% default rate correctly for 100000 paisa', async () => {
    setupApplyMocks();

    await CommissionService.applyCommission(PAYMENT_ID, MOCK_TRX);

    const fields = (PaymentRepository.applyCommissionFields as jest.Mock).mock.calls[0][1];
    expect(fields.platform_fee_paisa).toBe(20000);
    expect(fields.provider_net_paisa).toBe(80000);
    expect(fields.commission_rate).toBe('0.2000');
  });
});

// ─── applyCommission — side-effects ──────────────────────────────────────────

describe('CommissionService.applyCommission() — side-effects', () => {
  beforeEach(() => setupApplyMocks());

  it('inserts a platform_revenue_ledger row with the platform fee amount', async () => {
    await CommissionService.applyCommission(PAYMENT_ID, MOCK_TRX);

    expect(RevenueLedgerRepository.insert).toHaveBeenCalledWith(
      expect.objectContaining({ payment_id: PAYMENT_ID, commission_rule_id: RULE_ID, amount_paisa: 20000 }),
      MOCK_TRX
    );
  });

  it('credits provider wallet with provider_net_paisa', async () => {
    await CommissionService.applyCommission(PAYMENT_ID, MOCK_TRX);

    expect(WalletService.creditWallet).toHaveBeenCalledWith(PROVIDER_ID, 80000, JOB_ID, MOCK_TRX);
  });

  it('passes the same trx to every repository call (single-transaction guarantee)', async () => {
    await CommissionService.applyCommission(PAYMENT_ID, MOCK_TRX);

    expect((Payment.query as jest.Mock).mock.calls[0][0]).toBe(MOCK_TRX);
    expect((Job.query as jest.Mock).mock.calls[0][0]).toBe(MOCK_TRX);
    expect((PaymentRepository.applyCommissionFields as jest.Mock).mock.calls[0][2]).toBe(MOCK_TRX);
    expect((RevenueLedgerRepository.insert as jest.Mock).mock.calls[0][1]).toBe(MOCK_TRX);
    expect((WalletService.creditWallet as jest.Mock).mock.calls[0][3]).toBe(MOCK_TRX);
  });

  it('throws NotFoundError (404) when payment is not found', async () => {
    jest.spyOn(Payment, 'query').mockReturnValue(mockQueryBuilder(undefined));

    await expect(CommissionService.applyCommission(PAYMENT_ID, MOCK_TRX)).rejects.toMatchObject({ statusCode: 404 });
  });

  it('throws NotFoundError (404) when job is not found', async () => {
    jest.spyOn(Job, 'query').mockReturnValue(mockQueryBuilder(undefined));

    await expect(CommissionService.applyCommission(PAYMENT_ID, MOCK_TRX)).rejects.toMatchObject({ statusCode: 404 });
  });
});
