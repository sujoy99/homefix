import { paymentService } from '../../services/payment.service';
import { PaymentMethod, MfsType } from '@homefix/shared';

jest.mock('../../api/client', () => ({
  apiClient: {
    get: jest.fn(),
    post: jest.fn(),
    patch: jest.fn(),
    delete: jest.fn(),
  },
}));

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { apiClient } = require('../../api/client');

function mockResponse<T>(data: T) {
  return Promise.resolve({ data: { status: 'success', body: data } });
}

function mockApiError(status = 400, errorCode = 'ERROR') {
  const err = Object.assign(new Error('API Error'), {
    response: { status, data: { error_code: errorCode } },
  });
  return Promise.reject(err);
}

const PAYMENT_ID = 'pay-1';
const JOB_ID = 'job-1';

// ─── submitPayment ────────────────────────────────────────────────────────────

describe('paymentService.submitPayment', () => {
  beforeEach(() => jest.clearAllMocks());

  it('posts to /v2/payments and returns the payment', async () => {
    const payment = {
      id: PAYMENT_ID, job_id: JOB_ID, resident_id: 'r-1',
      method: PaymentMethod.BKASH, transaction_id: 'TXN12345678',
      amount_paisa: 150000, status: 'submitted', created_at: new Date().toISOString(),
    };
    apiClient.post.mockReturnValue(mockResponse(payment));

    const result = await paymentService.submitPayment({
      job_id: JOB_ID,
      method: PaymentMethod.BKASH,
      transaction_id: 'TXN12345678',
      amount_paisa: 150000,
    });

    expect(apiClient.post).toHaveBeenCalledWith('/v2/payments', {
      job_id: JOB_ID,
      method: PaymentMethod.BKASH,
      transaction_id: 'TXN12345678',
      amount_paisa: 150000,
    });
    expect(result.id).toBe(PAYMENT_ID);
    expect(result.method).toBe(PaymentMethod.BKASH);
  });

  it('sends payment without transaction_id for cash method', async () => {
    const payment = {
      id: PAYMENT_ID, job_id: JOB_ID, resident_id: 'r-1',
      method: PaymentMethod.CASH, transaction_id: null,
      amount_paisa: 100000, status: 'submitted', created_at: new Date().toISOString(),
    };
    apiClient.post.mockReturnValue(mockResponse(payment));

    await paymentService.submitPayment({ job_id: JOB_ID, method: PaymentMethod.CASH, amount_paisa: 100000 });

    expect(apiClient.post).toHaveBeenCalledWith('/v2/payments', {
      job_id: JOB_ID,
      method: PaymentMethod.CASH,
      amount_paisa: 100000,
    });
  });

  it('rejects on API error', async () => {
    apiClient.post.mockReturnValue(mockApiError(400, 'INVALID_STATE'));
    await expect(paymentService.submitPayment({ job_id: JOB_ID, method: PaymentMethod.CASH, amount_paisa: 100 }))
      .rejects.toThrow();
  });
});

// ─── getWallet ────────────────────────────────────────────────────────────────

describe('paymentService.getWallet', () => {
  beforeEach(() => jest.clearAllMocks());

  it('gets wallet data from /v2/providers/wallet', async () => {
    const walletData = {
      wallet: { id: 'w-1', user_id: 'u-1', balance_paisa: 80000, total_earned_paisa: 100000, total_withdrawn_paisa: 20000, updated_at: new Date().toISOString() },
      transactions: [],
      next_cursor: null,
    };
    apiClient.get.mockReturnValue(mockResponse(walletData));

    const result = await paymentService.getWallet();

    expect(apiClient.get).toHaveBeenCalledWith('/v2/providers/wallet');
    expect(result.wallet.balance_paisa).toBe(80000);
    expect(result.next_cursor).toBeNull();
  });

  it('returns transactions with wallet', async () => {
    const tx = { id: 'tx-1', wallet_id: 'w-1', type: 'credit' as const, amount_paisa: 80000, reference_id: 'pay-1', created_at: new Date().toISOString() };
    const walletData = {
      wallet: { id: 'w-1', user_id: 'u-1', balance_paisa: 80000, total_earned_paisa: 100000, total_withdrawn_paisa: 0, updated_at: new Date().toISOString() },
      transactions: [tx],
      next_cursor: null,
    };
    apiClient.get.mockReturnValue(mockResponse(walletData));

    const result = await paymentService.getWallet();

    expect(result.transactions).toHaveLength(1);
    expect(result.transactions[0].type).toBe('credit');
  });
});

// ─── requestWithdrawal ────────────────────────────────────────────────────────

describe('paymentService.requestWithdrawal', () => {
  beforeEach(() => jest.clearAllMocks());

  it('posts to /v2/providers/wallet/withdraw with full payload', async () => {
    const withdrawal = {
      id: 'wr-1', amount_requested_paisa: 50000, status: 'pending' as const,
      requested_at: new Date().toISOString(), mfs_account_id: 'a-1',
      amount_sent_paisa: null, processed_at: null, admin_note: null,
    };
    apiClient.post.mockReturnValue(mockResponse(withdrawal));

    const result = await paymentService.requestWithdrawal({ amount_paisa: 50000, mfs_account_id: 'a-1' });

    expect(apiClient.post).toHaveBeenCalledWith('/v2/providers/wallet/withdraw', {
      amount_paisa: 50000,
      mfs_account_id: 'a-1',
    });
    expect(result.amount_requested_paisa).toBe(50000);
    expect(result.mfs_account_id).toBe('a-1');
  });

  it('sends the secondary account id when a non-primary account is chosen', async () => {
    const withdrawal = {
      id: 'wr-2', amount_requested_paisa: 20000, status: 'pending' as const,
      requested_at: new Date().toISOString(), mfs_account_id: 'a-secondary',
      amount_sent_paisa: null, processed_at: null, admin_note: null,
    };
    apiClient.post.mockReturnValue(mockResponse(withdrawal));

    await paymentService.requestWithdrawal({ amount_paisa: 20000, mfs_account_id: 'a-secondary' });

    expect(apiClient.post).toHaveBeenCalledWith(
      '/v2/providers/wallet/withdraw',
      expect.objectContaining({ mfs_account_id: 'a-secondary' })
    );
  });

  it('rejects when balance is insufficient', async () => {
    apiClient.post.mockReturnValue(mockApiError(400, 'INSUFFICIENT_BALANCE'));
    await expect(
      paymentService.requestWithdrawal({ amount_paisa: 999999, mfs_account_id: 'a-1' })
    ).rejects.toThrow();
  });
});

// ─── getMyWithdrawals ─────────────────────────────────────────────────────────

describe('paymentService.getMyWithdrawals', () => {
  beforeEach(() => jest.clearAllMocks());

  it('fetches from /v2/providers/wallet/withdrawals', async () => {
    const myWithdrawals = {
      withdrawals: [
        {
          id: 'wr-1', amount_requested_paisa: 50000, status: 'pending' as const,
          requested_at: new Date().toISOString(), mfs_account_id: 'a-1',
          amount_sent_paisa: null, processed_at: null, admin_note: null,
        },
      ],
      pending_total_paisa: 50000,
    };
    apiClient.get.mockReturnValue(mockResponse(myWithdrawals));

    const result = await paymentService.getMyWithdrawals();

    expect(apiClient.get).toHaveBeenCalledWith('/v2/providers/wallet/withdrawals');
    expect(result.withdrawals).toHaveLength(1);
    expect(result.pending_total_paisa).toBe(50000);
  });

  it('returns empty list and zero pending total when no withdrawals', async () => {
    apiClient.get.mockReturnValue(mockResponse({ withdrawals: [], pending_total_paisa: 0 }));

    const result = await paymentService.getMyWithdrawals();

    expect(result.withdrawals).toHaveLength(0);
    expect(result.pending_total_paisa).toBe(0);
  });
});

// ─── MFS accounts ─────────────────────────────────────────────────────────────

describe('paymentService MFS accounts', () => {
  beforeEach(() => jest.clearAllMocks());

  it('listMfsAccounts fetches from /v2/providers/payment-accounts', async () => {
    const accounts = [
      { id: 'a-1', mfs_type: MfsType.BKASH, account_number: '01711223344', account_name: 'Test', is_primary: true, created_at: new Date().toISOString() },
    ];
    apiClient.get.mockReturnValue(mockResponse(accounts));

    const result = await paymentService.listMfsAccounts();

    expect(apiClient.get).toHaveBeenCalledWith('/v2/providers/payment-accounts');
    expect(result).toHaveLength(1);
    expect(result[0].mfs_type).toBe(MfsType.BKASH);
  });

  it('addMfsAccount posts to /v2/providers/payment-accounts', async () => {
    const account = { id: 'a-2', mfs_type: MfsType.NAGAD, account_number: '01811223344', account_name: 'Jane', is_primary: false, created_at: new Date().toISOString() };
    apiClient.post.mockReturnValue(mockResponse(account));

    const result = await paymentService.addMfsAccount({ mfs_type: MfsType.NAGAD, account_number: '01811223344', account_name: 'Jane' });

    expect(apiClient.post).toHaveBeenCalledWith('/v2/providers/payment-accounts', expect.objectContaining({ mfs_type: MfsType.NAGAD }));
    expect(result.id).toBe('a-2');
  });

  it('deleteMfsAccount calls DELETE on the account id', async () => {
    apiClient.delete.mockReturnValue(Promise.resolve({ data: {} }));

    await paymentService.deleteMfsAccount('a-1');

    expect(apiClient.delete).toHaveBeenCalledWith('/v2/providers/payment-accounts/a-1');
  });
});

// ─── getProfileCompletion ─────────────────────────────────────────────────────

describe('paymentService.getProfileCompletion', () => {
  beforeEach(() => jest.clearAllMocks());

  it('fetches from /v2/users/me/profile-completion', async () => {
    const completion = {
      percentage: 60,
      meets_threshold: false,
      threshold: 70,
      missing_items: [{ key: 'bio', label_key: 'profile.completion.bio', weight: 10 }],
      completed_items: [],
    };
    apiClient.get.mockReturnValue(mockResponse(completion));

    const result = await paymentService.getProfileCompletion();

    expect(apiClient.get).toHaveBeenCalledWith('/v2/users/me/profile-completion');
    expect(result.percentage).toBe(60);
    expect(result.meets_threshold).toBe(false);
  });
});
