import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MfsType } from '@homefix/shared';
import WalletScreen from '../../app/(app)/(tabs)/wallet';

jest.setTimeout(15000);

// ── Mocks ──────────────────────────────────────────────────────────────────────

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (k: string, opts?: Record<string, unknown>) => {
      if (opts) return `${k}(${JSON.stringify(opts)})`;
      return k;
    },
  }),
}));

jest.mock('lucide-react-native', () => {
  const React = require('react');
  const { View } = require('react-native');
  const Icon = () => React.createElement(View, null);
  return new Proxy({}, { get: () => Icon });
});

jest.mock('react-native-safe-area-context', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    SafeAreaView: ({ children, ...props }: { children: React.ReactNode }) =>
      React.createElement(View, props, children),
  };
});

jest.mock('../../services/payment.service', () => ({
  paymentService: {
    getWallet: jest.fn(),
    listMfsAccounts: jest.fn(),
    requestWithdrawal: jest.fn(),
    addMfsAccount: jest.fn(),
    deleteMfsAccount: jest.fn(),
    setPrimaryMfsAccount: jest.fn(),
    getMyWithdrawals: jest.fn(),
  },
}));

jest.mock('../../utils/toast', () => ({
  toast: { success: jest.fn(), error: jest.fn() },
}));

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { paymentService } = require('../../services/payment.service');

// ── Helpers ────────────────────────────────────────────────────────────────────

function makeClient() {
  return new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
}

function renderWallet() {
  return render(
    <QueryClientProvider client={makeClient()}>
      <WalletScreen />
    </QueryClientProvider>
  );
}

const walletData = {
  wallet: { id: 'w-1', user_id: 'u-1', balance_paisa: 80000, total_earned_paisa: 100000, total_withdrawn_paisa: 20000, updated_at: new Date().toISOString() },
  transactions: [
    { id: 'tx-1', wallet_id: 'w-1', type: 'credit' as const, amount_paisa: 80000, reference_id: 'pay-1', created_at: new Date().toISOString() },
    { id: 'tx-2', wallet_id: 'w-1', type: 'withdrawal' as const, amount_paisa: 20000, reference_id: 'wr-1', created_at: new Date().toISOString() },
  ],
  next_cursor: null,
};

const accounts = [
  { id: 'a-1', mfs_type: MfsType.BKASH, account_number: '01711223344', account_name: 'Test User', is_primary: true, created_at: new Date().toISOString() },
];

const twoAccounts = [
  { id: 'a-1', mfs_type: MfsType.BKASH, account_number: '01711223344', account_name: 'Test User', is_primary: true, created_at: new Date().toISOString() },
  { id: 'a-2', mfs_type: MfsType.NAGAD, account_number: '01811223344', account_name: 'Test User', is_primary: false, created_at: new Date().toISOString() },
];

const emptyWithdrawals = { withdrawals: [], pending_total_paisa: 0 };

const pendingWithdrawal = {
  id: 'wr-1',
  amount_requested_paisa: 30000,
  status: 'pending' as const,
  requested_at: new Date().toISOString(),
  mfs_account_id: 'a-1',
  amount_sent_paisa: null,
  processed_at: null,
  admin_note: null,
};

// ── Tests ──────────────────────────────────────────────────────────────────────

describe('WalletScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    paymentService.getWallet.mockResolvedValue(walletData);
    paymentService.listMfsAccounts.mockResolvedValue(accounts);
    paymentService.getMyWithdrawals.mockResolvedValue(emptyWithdrawals);
  });

  it('shows wallet balance after loading', async () => {
    renderWallet();
    await waitFor(() => {
      expect(screen.getByText('wallet.title')).toBeTruthy();
      expect(screen.getByText('wallet.balance')).toBeTruthy();
    });
  });

  it('displays credit and withdrawal transactions', async () => {
    renderWallet();
    await waitFor(() => {
      expect(screen.getByText('wallet.tx_credit')).toBeTruthy();
      expect(screen.getByText('wallet.tx_withdrawal')).toBeTruthy();
    });
  });

  it('shows payout accounts section', async () => {
    renderWallet();
    await waitFor(() => {
      expect(screen.getByText('wallet.accounts_title')).toBeTruthy();
    });
  });

  it('shows primary badge on primary account', async () => {
    renderWallet();
    await waitFor(() => {
      expect(screen.getByText('wallet.account_primary')).toBeTruthy();
    });
  });

  it('shows empty state when no transactions exist', async () => {
    paymentService.getWallet.mockResolvedValue({ ...walletData, transactions: [] });
    renderWallet();
    await waitFor(() => {
      expect(screen.getByText('wallet.no_transactions')).toBeTruthy();
    });
  });

  it('shows empty accounts message when no accounts', async () => {
    paymentService.listMfsAccounts.mockResolvedValue([]);
    renderWallet();
    await waitFor(() => {
      expect(screen.getByText('wallet.withdraw_no_account')).toBeTruthy();
    });
  });

  it('shows error state when wallet fails to load', async () => {
    paymentService.getWallet.mockRejectedValue(new Error('Network error'));
    renderWallet();
    await waitFor(() => {
      expect(screen.getByText('wallet.load_error')).toBeTruthy();
    });
  });

  it('opens withdraw modal on button press', async () => {
    renderWallet();
    await waitFor(() => screen.getByText('wallet.withdraw'));

    fireEvent.press(screen.getByText('wallet.withdraw'));

    await waitFor(() => {
      expect(screen.getByText('wallet.withdraw_title')).toBeTruthy();
    });
  });

  it('shows commission info card', async () => {
    renderWallet();
    await waitFor(() => {
      expect(screen.getByText('wallet.commission_info')).toBeTruthy();
    });
  });

  // ── Withdrawal history ───────────────────────────────────────────────────────

  it('shows pending withdrawal request in history section', async () => {
    paymentService.getMyWithdrawals.mockResolvedValue({
      withdrawals: [pendingWithdrawal],
      pending_total_paisa: 30000,
    });
    renderWallet();
    await waitFor(() => {
      expect(screen.getByText('wallet.wr_status_pending')).toBeTruthy();
    });
  });

  it('shows empty withdrawal history section when no requests', async () => {
    paymentService.getMyWithdrawals.mockResolvedValue(emptyWithdrawals);
    renderWallet();
    await waitFor(() => {
      // Wallet loaded correctly
      expect(screen.getByText('wallet.balance')).toBeTruthy();
    });
    // No pending status badge should appear
    expect(screen.queryByText('wallet.wr_status_pending')).toBeNull();
  });

  // ── WithdrawModal — account picker ───────────────────────────────────────────

  it('does not show account picker when provider has only one MFS account', async () => {
    // Default: accounts = [single bKash account]
    renderWallet();
    await waitFor(() => screen.getByText('wallet.withdraw'));

    fireEvent.press(screen.getByText('wallet.withdraw'));

    await waitFor(() => {
      expect(screen.getByText('wallet.withdraw_title')).toBeTruthy();
    });

    // Account picker label should NOT appear for single account
    expect(screen.queryByText('wallet.withdraw_account_label')).toBeNull();
  });

  it('shows account picker when provider has multiple MFS accounts', async () => {
    paymentService.listMfsAccounts.mockResolvedValue(twoAccounts);
    renderWallet();
    await waitFor(() => screen.getByText('wallet.withdraw'));

    fireEvent.press(screen.getByText('wallet.withdraw'));

    await waitFor(() => {
      expect(screen.getByText('wallet.withdraw_account_label')).toBeTruthy();
    });
  });

  it('calls requestWithdrawal with amount_paisa and mfs_account_id', async () => {
    paymentService.requestWithdrawal.mockResolvedValue({
      id: 'wr-new', amount_requested_paisa: 10000, status: 'pending',
      requested_at: new Date().toISOString(), mfs_account_id: 'a-1',
      amount_sent_paisa: null, processed_at: null, admin_note: null,
    });
    renderWallet();
    await waitFor(() => screen.getByText('wallet.withdraw'));

    fireEvent.press(screen.getByText('wallet.withdraw'));
    await waitFor(() => screen.getByText('wallet.withdraw_title'));

    const amountInput = screen.getByDisplayValue('');
    fireEvent.changeText(amountInput, '100');
    fireEvent.press(screen.getByText('wallet.withdraw_submit'));

    await waitFor(() => {
      expect(paymentService.requestWithdrawal).toHaveBeenCalled();
      // TanStack Query calls mutationFn(variables, context) — check first arg only
      const firstCallFirstArg = paymentService.requestWithdrawal.mock.calls[0][0];
      expect(firstCallFirstArg).toMatchObject({ amount_paisa: 10000, mfs_account_id: 'a-1' });
    });
  });
});
