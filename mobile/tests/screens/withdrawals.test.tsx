import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import AdminWithdrawalsScreen from '../../app/(app)/admin/withdrawals';

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

jest.mock('expo-router', () => ({
  useRouter: () => ({ back: jest.fn() }),
}));

jest.mock('../../services/admin.service', () => ({
  adminService: {
    listWithdrawals: jest.fn(),
    completeWithdrawal: jest.fn(),
    rejectWithdrawal: jest.fn(),
  },
}));

jest.mock('../../utils/toast', () => ({
  toast: { success: jest.fn(), error: jest.fn() },
}));

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { adminService } = require('../../services/admin.service');

// ── Helpers ────────────────────────────────────────────────────────────────────

function makeClient() {
  return new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
}

function renderWithdrawals() {
  return render(
    <QueryClientProvider client={makeClient()}>
      <AdminWithdrawalsScreen />
    </QueryClientProvider>
  );
}

// ── Fixtures ───────────────────────────────────────────────────────────────────

const pendingItem = {
  id: 'wr-1',
  wallet_id: 'w-1',
  provider_id: 'p-1',
  mfs_account_id: 'mfs-1',
  amount_requested_paisa: 50_000,
  status: 'pending' as const,
  requested_at: new Date().toISOString(),
  amount_sent_paisa: null,
  sent_at: null,
  admin_txid: null,
  admin_note: null,
  processed_at: null,
  provider: { id: 'p-1', full_name: 'Rahim Uddin', mobile: '01711223344' },
  mfsAccount: { id: 'mfs-1', mfs_type: 'bkash', account_number: '01711223344', account_name: 'Rahim Uddin' },
  wallet: { id: 'w-1', balance_paisa: 80_000 },
  total_pending_paisa: 50_000,
};

const completedItem = {
  ...pendingItem,
  id: 'wr-2',
  status: 'completed' as const,
  amount_sent_paisa: 50_000,
  admin_txid: 'TXNABC12345',
  sent_at: new Date().toISOString(),
  processed_at: new Date().toISOString(),
};

const rejectedItem = {
  ...pendingItem,
  id: 'wr-3',
  status: 'rejected' as const,
  admin_note: 'Account details mismatch',
  processed_at: new Date().toISOString(),
};

// ── Tests ──────────────────────────────────────────────────────────────────────

describe('AdminWithdrawalsScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    adminService.listWithdrawals.mockResolvedValue([pendingItem]);
  });

  it('shows the screen title', async () => {
    renderWithdrawals();
    await waitFor(() => {
      expect(screen.getByText('admin_withdrawals.title')).toBeTruthy();
    });
  });

  it('renders provider name and pending status badge', async () => {
    renderWithdrawals();
    await waitFor(() => {
      expect(screen.getByText('Rahim Uddin')).toBeTruthy();
      expect(screen.getByText('admin_withdrawals.status_pending')).toBeTruthy();
    });
  });

  it('shows pending count badge when pending requests exist', async () => {
    renderWithdrawals();
    await waitFor(() => {
      expect(screen.getByText('admin_withdrawals.pending_count({"count":1})')).toBeTruthy();
    });
  });

  it('does not show pending count badge when no pending requests', async () => {
    adminService.listWithdrawals.mockResolvedValue([completedItem]);
    renderWithdrawals();
    await waitFor(() => {
      expect(screen.getByText('admin_withdrawals.status_completed')).toBeTruthy();
    });
    expect(screen.queryByText(/pending_count/)).toBeNull();
  });

  it('shows Complete and Reject action buttons on pending items', async () => {
    renderWithdrawals();
    await waitFor(() => {
      expect(screen.getByText('admin_withdrawals.complete')).toBeTruthy();
      expect(screen.getByText('admin_withdrawals.reject')).toBeTruthy();
    });
  });

  it('does not show action buttons on completed items', async () => {
    adminService.listWithdrawals.mockResolvedValue([completedItem]);
    renderWithdrawals();
    await waitFor(() => {
      expect(screen.getByText('admin_withdrawals.status_completed')).toBeTruthy();
    });
    expect(screen.queryByText('admin_withdrawals.complete')).toBeNull();
    expect(screen.queryByText('admin_withdrawals.reject')).toBeNull();
  });

  it('does not show action buttons on rejected items', async () => {
    adminService.listWithdrawals.mockResolvedValue([rejectedItem]);
    renderWithdrawals();
    await waitFor(() => {
      expect(screen.getByText('admin_withdrawals.status_rejected')).toBeTruthy();
    });
    expect(screen.queryByText('admin_withdrawals.complete')).toBeNull();
    expect(screen.queryByText('admin_withdrawals.reject')).toBeNull();
  });

  it('opens the Complete modal when Complete button is pressed', async () => {
    renderWithdrawals();
    await waitFor(() => screen.getByText('admin_withdrawals.complete'));

    fireEvent.press(screen.getByText('admin_withdrawals.complete'));

    await waitFor(() => {
      expect(screen.getByText('admin_withdrawals.complete_title')).toBeTruthy();
    });
  });

  it('opens the Reject modal when Reject button is pressed', async () => {
    renderWithdrawals();
    await waitFor(() => screen.getByText('admin_withdrawals.reject'));

    fireEvent.press(screen.getByText('admin_withdrawals.reject'));

    await waitFor(() => {
      expect(screen.getByText('admin_withdrawals.reject_title')).toBeTruthy();
    });
  });

  it('TxID input in Complete modal forces text to uppercase', async () => {
    renderWithdrawals();
    await waitFor(() => screen.getByText('admin_withdrawals.complete'));

    fireEvent.press(screen.getByText('admin_withdrawals.complete'));
    await waitFor(() => screen.getByText('admin_withdrawals.complete_title'));

    const txidInput = screen.getByPlaceholderText('admin_withdrawals.complete_txid_placeholder');
    fireEvent.changeText(txidInput, 'abcdef123');

    expect(txidInput.props.value).toBe('ABCDEF123');
  });

  it('Complete modal shows validation error when TxID is empty', async () => {
    renderWithdrawals();
    await waitFor(() => screen.getByText('admin_withdrawals.complete'));

    fireEvent.press(screen.getByText('admin_withdrawals.complete'));
    await waitFor(() => screen.getByText('admin_withdrawals.complete_title'));

    // Fill amount but leave TxID empty → press Submit
    const amountInput = screen.getByPlaceholderText('admin_withdrawals.complete_amount_placeholder');
    fireEvent.changeText(amountInput, '500');
    fireEvent.press(screen.getByText('admin_withdrawals.complete_submit'));

    await waitFor(() => {
      expect(screen.getByText('admin_withdrawals.complete_txid_error')).toBeTruthy();
    });
  });

  it('shows empty state when no withdrawal requests exist', async () => {
    adminService.listWithdrawals.mockResolvedValue([]);
    renderWithdrawals();
    await waitFor(() => {
      expect(screen.getByText('admin_withdrawals.empty_title')).toBeTruthy();
      expect(screen.getByText('admin_withdrawals.empty_desc')).toBeTruthy();
    });
  });

  it('shows error state when the list fails to load', async () => {
    adminService.listWithdrawals.mockRejectedValue(new Error('Network error'));
    renderWithdrawals();
    await waitFor(() => {
      expect(screen.getByText('common.error')).toBeTruthy();
    });
  });
});
