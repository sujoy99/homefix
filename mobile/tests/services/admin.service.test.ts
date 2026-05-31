import { adminService } from '../../services/admin.service';

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

// ─── getFinancialSummary ──────────────────────────────────────────────────────

describe('adminService.getFinancialSummary', () => {
  beforeEach(() => jest.clearAllMocks());

  it('calls GET /v2/admin/revenue/financial-summary', async () => {
    const summary = {
      total_payments_paisa: 100_000,
      pending_payments_paisa: 50_000,
      platform_revenue_paisa: 20_000,
      provider_wallet_balance_paisa: 80_000,
      provider_withdrawn_paisa: 20_000,
      provider_withdrawal_pending_paisa: 30_000,
    };
    apiClient.get.mockReturnValue(mockResponse(summary));

    const result = await adminService.getFinancialSummary();

    expect(apiClient.get).toHaveBeenCalledWith('/v2/admin/revenue/financial-summary');
    expect(result.total_payments_paisa).toBe(100_000);
    expect(result.pending_payments_paisa).toBe(50_000);
    expect(result.platform_revenue_paisa).toBe(20_000);
    expect(result.provider_wallet_balance_paisa).toBe(80_000);
    expect(result.provider_withdrawn_paisa).toBe(20_000);
    expect(result.provider_withdrawal_pending_paisa).toBe(30_000);
  });

  it('returns all 6 numeric fields from the response body', async () => {
    apiClient.get.mockReturnValue(
      mockResponse({
        total_payments_paisa: 0,
        pending_payments_paisa: 0,
        platform_revenue_paisa: 0,
        provider_wallet_balance_paisa: 0,
        provider_withdrawn_paisa: 0,
        provider_withdrawal_pending_paisa: 0,
      })
    );

    const result = await adminService.getFinancialSummary();

    expect(Object.keys(result)).toHaveLength(6);
    Object.values(result).forEach((v) => expect(typeof v).toBe('number'));
  });

  it('rejects when the request fails', async () => {
    apiClient.get.mockReturnValue(Promise.reject(new Error('Network error')));
    await expect(adminService.getFinancialSummary()).rejects.toThrow('Network error');
  });
});

// ─── completeWithdrawal ───────────────────────────────────────────────────────

describe('adminService.completeWithdrawal', () => {
  beforeEach(() => jest.clearAllMocks());

  const WR_ID = 'wr-1';
  const payload = {
    amount_sent_paisa: 50_000,
    sent_at: new Date().toISOString(),
    admin_txid: 'ADMINTXN001',
    admin_note: 'Processed',
  };

  it('patches the correct withdrawal URL with payload', async () => {
    const updated = {
      id: WR_ID, status: 'completed', amount_sent_paisa: 50_000,
      admin_txid: 'ADMINTXN001', wallet_id: 'w-1',
      provider_id: 'p-1', mfs_account_id: 'mfs-1',
      amount_requested_paisa: 50_000, requested_at: new Date().toISOString(),
      sent_at: payload.sent_at, admin_note: 'Processed', processed_at: new Date().toISOString(),
    };
    apiClient.patch.mockReturnValue(mockResponse(updated));

    const result = await adminService.completeWithdrawal(WR_ID, payload);

    expect(apiClient.patch).toHaveBeenCalledWith(
      `/v2/admin/withdrawals/${WR_ID}/complete`,
      payload
    );
    expect(result.status).toBe('completed');
    expect(result.admin_txid).toBe('ADMINTXN001');
  });

  it('rejects on API error', async () => {
    apiClient.patch.mockReturnValue(Promise.reject(new Error('Bad Request')));
    await expect(adminService.completeWithdrawal(WR_ID, payload)).rejects.toThrow();
  });
});

// ─── rejectWithdrawal ─────────────────────────────────────────────────────────

describe('adminService.rejectWithdrawal', () => {
  beforeEach(() => jest.clearAllMocks());

  it('patches the reject URL with admin_note', async () => {
    const WR_ID = 'wr-2';
    const rejected = {
      id: WR_ID, status: 'rejected', admin_note: 'Invalid account',
      wallet_id: 'w-1', provider_id: 'p-1', mfs_account_id: 'mfs-1',
      amount_requested_paisa: 30_000, amount_sent_paisa: null,
      requested_at: new Date().toISOString(), sent_at: null,
      admin_txid: null, processed_at: new Date().toISOString(),
    };
    apiClient.patch.mockReturnValue(mockResponse(rejected));

    const result = await adminService.rejectWithdrawal(WR_ID, 'Invalid account');

    expect(apiClient.patch).toHaveBeenCalledWith(
      `/v2/admin/withdrawals/${WR_ID}/reject`,
      { admin_note: 'Invalid account' }
    );
    expect(result.status).toBe('rejected');
  });
});
