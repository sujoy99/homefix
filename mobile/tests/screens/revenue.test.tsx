import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import RevenueScreen from '../../app/(app)/(tabs)/revenue';

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

jest.mock('../../services/admin.service', () => ({
  adminService: {
    getRevenueDashboard: jest.fn(),
    getRevenueJobs: jest.fn(),
    getFinancialSummary: jest.fn(),
    listWithdrawals: jest.fn(),
  },
}));

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { adminService } = require('../../services/admin.service');

// ── Helpers ────────────────────────────────────────────────────────────────────

function makeClient() {
  return new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
}

function renderRevenue() {
  return render(
    <QueryClientProvider client={makeClient()}>
      <RevenueScreen />
    </QueryClientProvider>
  );
}

const dashboardData = {
  total_revenue_paisa: 250000,
  revenue_by_period: [
    { date: '2026-04', total_paisa: 100000 },
    { date: '2026-05', total_paisa: 150000 },
  ],
  breakdown_by_rule: [
    { rule_id: 'r-1', label: 'Standard 20%', scope: 'global', rate: '0.2', total_paisa: 250000 },
  ],
  top_categories: [
    { category_id: 'c-1', name: 'Plumbing', slug: 'plumbing', total_paisa: 150000 },
    { category_id: 'c-2', name: 'Electrical', slug: 'electrical', total_paisa: 100000 },
  ],
};

const financialSummaryData = {
  total_payments_paisa: 120000,
  pending_payments_paisa: 50000,
  platform_revenue_paisa: 24000,
  provider_wallet_balance_paisa: 66000,
  provider_withdrawn_paisa: 30000,
  provider_withdrawal_pending_paisa: 20000,
};

const jobsData = {
  items: [
    {
      ledger_id: 'l-1', payment_id: 'p-1', job_id: 'j-1',
      revenue_paisa: 30000, payment_amount_paisa: 150000,
      commission_rate: '0.2', method: 'bkash',
      rule_label: 'Standard 20%', rule_scope: 'global',
      category_name: 'Plumbing',
      created_at: new Date().toISOString(), verified_at: null,
    },
  ],
  nextCursor: null,
};

// ── Tests ──────────────────────────────────────────────────────────────────────

describe('RevenueScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    adminService.getRevenueDashboard.mockResolvedValue(dashboardData);
    adminService.getRevenueJobs.mockResolvedValue(jobsData);
    adminService.getFinancialSummary.mockResolvedValue(financialSummaryData);
    adminService.listWithdrawals.mockResolvedValue([]);
  });

  it('shows total revenue after loading', async () => {
    renderRevenue();
    await waitFor(() => {
      expect(screen.getByText('revenue.title')).toBeTruthy();
      expect(screen.getByText('revenue.total_revenue')).toBeTruthy();
    });
  });

  it('renders period chart section', async () => {
    renderRevenue();
    await waitFor(() => {
      expect(screen.getByText('revenue.by_period')).toBeTruthy();
    });
  });

  it('renders rule breakdown section', async () => {
    renderRevenue();
    await waitFor(() => {
      expect(screen.getByText('revenue.by_rule')).toBeTruthy();
      expect(screen.getByText('Standard 20%')).toBeTruthy();
    });
  });

  it('renders top categories', async () => {
    renderRevenue();
    await waitFor(() => {
      expect(screen.getByText('revenue.top_categories')).toBeTruthy();
      expect(screen.getByText('Plumbing')).toBeTruthy();
      expect(screen.getByText('Electrical')).toBeTruthy();
    });
  });

  it('loads per-job detail on expand', async () => {
    renderRevenue();
    await waitFor(() => screen.getByText('revenue.per_job'));

    fireEvent.press(screen.getByText('revenue.per_job'));

    await waitFor(() => {
      expect(adminService.getRevenueJobs).toHaveBeenCalled();
    });
  });

  it('shows monthly/daily toggle', async () => {
    renderRevenue();
    await waitFor(() => {
      expect(screen.getByText('revenue.period_monthly')).toBeTruthy();
      expect(screen.getByText('revenue.period_daily')).toBeTruthy();
    });
  });

  it('switches to daily period and re-fetches dashboard', async () => {
    renderRevenue();
    await waitFor(() => screen.getByText('revenue.period_daily'));

    fireEvent.press(screen.getByText('revenue.period_daily'));

    await waitFor(() => {
      expect(adminService.getRevenueDashboard).toHaveBeenCalledWith({ period: 'daily' });
    });
  });

  it('shows empty state for no period data', async () => {
    adminService.getRevenueDashboard.mockResolvedValue({ ...dashboardData, revenue_by_period: [] });
    renderRevenue();
    await waitFor(() => {
      expect(screen.getByText('revenue.no_period_data')).toBeTruthy();
    });
  });

  it('shows empty state for no rule data', async () => {
    adminService.getRevenueDashboard.mockResolvedValue({ ...dashboardData, breakdown_by_rule: [] });
    renderRevenue();
    await waitFor(() => {
      expect(screen.getByText('revenue.no_rule_data')).toBeTruthy();
    });
  });

  it('shows error state on load failure', async () => {
    adminService.getRevenueDashboard.mockRejectedValue(new Error('Network error'));
    renderRevenue();
    await waitFor(() => {
      expect(screen.getByText('revenue.load_error')).toBeTruthy();
    });
  });

  // ── Financial summary card ────────────────────────────────────────────────────

  it('renders financial summary card with title when data is available', async () => {
    renderRevenue();
    await waitFor(() => {
      expect(screen.getByText('revenue.financial_summary_title')).toBeTruthy();
    });
  });

  it('renders all 6 financial stat tile labels', async () => {
    renderRevenue();
    await waitFor(() => {
      expect(screen.getByText('revenue.stat_total_payments')).toBeTruthy();
      expect(screen.getByText('revenue.stat_pending_payments')).toBeTruthy();
      expect(screen.getByText('revenue.stat_platform_revenue')).toBeTruthy();
      expect(screen.getByText('revenue.stat_provider_wallets')).toBeTruthy();
      expect(screen.getByText('revenue.stat_provider_withdrawn')).toBeTruthy();
      expect(screen.getByText('revenue.stat_provider_pending')).toBeTruthy();
    });
  });

  it('does not render financial summary card when the query fails', async () => {
    adminService.getFinancialSummary.mockRejectedValue(new Error('Network error'));
    renderRevenue();
    // Wait for the revenue dashboard to load (so we know the screen rendered)
    await waitFor(() => {
      expect(screen.getByText('revenue.total_revenue')).toBeTruthy();
    });
    expect(screen.queryByText('revenue.financial_summary_title')).toBeNull();
  });

  it('calls getFinancialSummary on load', async () => {
    renderRevenue();
    await waitFor(() => {
      expect(adminService.getFinancialSummary).toHaveBeenCalledTimes(1);
    });
  });
});
