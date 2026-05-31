import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { JobStatus, PaymentMethod } from '@homefix/shared';
import PaymentScreen from '../../app/(app)/payment/[jobId]';
import { buildJob } from '../factories/job.factory';

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

jest.mock('expo-router', () => ({
  useLocalSearchParams: () => ({ jobId: 'job-awaiting' }),
  useRouter: () => ({ back: jest.fn(), replace: jest.fn(), push: jest.fn() }),
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

jest.mock('../../services/job.service', () => ({
  jobService: { getJobById: jest.fn() },
}));

jest.mock('../../services/category.service', () => ({
  categoryService: { listActive: jest.fn() },
}));

jest.mock('../../services/payment.service', () => ({
  paymentService: { submitPayment: jest.fn() },
}));

jest.mock('../../utils/toast', () => ({
  toast: { success: jest.fn(), error: jest.fn() },
}));

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { jobService } = require('../../services/job.service');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { categoryService } = require('../../services/category.service');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { paymentService } = require('../../services/payment.service');

// ── Helpers ────────────────────────────────────────────────────────────────────

function makeClient() {
  return new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
}

function renderPaymentScreen() {
  return render(
    <QueryClientProvider client={makeClient()}>
      <PaymentScreen />
    </QueryClientProvider>
  );
}

const awaitingJob = buildJob({ id: 'job-awaiting', status: JobStatus.AWAITING_PAYMENT, estimated_budget: 1500 });
const categories = [{ id: awaitingJob.category_id, name: 'Plumbing', name_bn: 'পাইপলাইন', requires_area: false, is_active: true }];

// ── Tests ──────────────────────────────────────────────────────────────────────

describe('PaymentScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jobService.getJobById.mockResolvedValue(awaitingJob);
    categoryService.listActive.mockResolvedValue(categories);
  });

  it('renders the order summary and method selection after loading', async () => {
    renderPaymentScreen();
    await waitFor(() => {
      expect(screen.getByText('payment.order_summary')).toBeTruthy();
      expect(screen.getByText('payment.select_method')).toBeTruthy();
    });
  });

  it('shows method labels for all 5 payment methods', async () => {
    renderPaymentScreen();
    await waitFor(() => {
      expect(screen.getByText('payment.method_bkash')).toBeTruthy();
      expect(screen.getByText('payment.method_nagad')).toBeTruthy();
      expect(screen.getByText('payment.method_cash')).toBeTruthy();
      expect(screen.getByText('payment.method_card')).toBeTruthy();
      expect(screen.getByText('payment.method_bank_transfer')).toBeTruthy();
    });
  });

  it('shows TxID input when bKash is selected', async () => {
    renderPaymentScreen();
    await waitFor(() => screen.getByText('payment.method_bkash'));

    fireEvent.press(screen.getByText('payment.method_bkash'));

    await waitFor(() => {
      expect(screen.getByText('payment.txid_label')).toBeTruthy();
    });
  });

  it('does not show TxID input for cash method', async () => {
    renderPaymentScreen();
    await waitFor(() => screen.getByText('payment.method_cash'));

    fireEvent.press(screen.getByText('payment.method_cash'));

    await waitFor(() => {
      expect(screen.queryByText('payment.txid_label')).toBeNull();
    });
  });

  it('prefills amount from estimated budget', async () => {
    renderPaymentScreen();
    await waitFor(() => {
      const amountInput = screen.getByDisplayValue('1500');
      expect(amountInput).toBeTruthy();
    });
  });

  it('validates required txid for bKash and shows error', async () => {
    renderPaymentScreen();
    await waitFor(() => screen.getByText('payment.method_bkash'));

    fireEvent.press(screen.getByText('payment.method_bkash'));
    await waitFor(() => screen.getByText('payment.txid_label'));

    fireEvent.press(screen.getByText('payment.submit'));

    await waitFor(() => {
      expect(screen.getByText('payment.txid_required')).toBeTruthy();
    });
    expect(paymentService.submitPayment).not.toHaveBeenCalled();
  });

  it('validates txid format (8–20 alphanumeric)', async () => {
    renderPaymentScreen();
    await waitFor(() => screen.getByText('payment.method_bkash'));
    fireEvent.press(screen.getByText('payment.method_bkash'));
    await waitFor(() => screen.getByText('payment.txid_label'));

    fireEvent.changeText(screen.getByLabelText('payment.txid_label'), 'abc');
    fireEvent.press(screen.getByText('payment.submit'));

    await waitFor(() => {
      expect(screen.getByText('payment.txid_invalid')).toBeTruthy();
    });
  });

  it('submits payment successfully for cash with a valid amount', async () => {
    const payment = { id: 'pay-1', job_id: 'job-awaiting', resident_id: 'r-1', method: PaymentMethod.CASH, transaction_id: null, amount_paisa: 150000, status: 'submitted', created_at: new Date().toISOString() };
    paymentService.submitPayment.mockResolvedValue(payment);

    const { getByText, getByDisplayValue } = renderPaymentScreen();
    await waitFor(() => getByText('payment.method_cash'));

    fireEvent.press(getByText('payment.method_cash'));
    fireEvent.changeText(getByDisplayValue('1500'), '1500');
    fireEvent.press(getByText('payment.submit'));

    await waitFor(() => {
      expect(paymentService.submitPayment).toHaveBeenCalledWith({
        job_id: 'job-awaiting',
        method: PaymentMethod.CASH,
        amount_paisa: 150000,
      });
    });
  });

  it('submits bKash payment with valid txid', async () => {
    const payment = { id: 'pay-2', job_id: 'job-awaiting', resident_id: 'r-1', method: PaymentMethod.BKASH, transaction_id: 'TXN12345678', amount_paisa: 150000, status: 'submitted', created_at: new Date().toISOString() };
    paymentService.submitPayment.mockResolvedValue(payment);

    const { getByText, getByLabelText, getByDisplayValue } = renderPaymentScreen();
    await waitFor(() => getByText('payment.method_bkash'));

    fireEvent.press(getByText('payment.method_bkash'));
    await waitFor(() => getByLabelText('payment.txid_label'));
    fireEvent.changeText(getByLabelText('payment.txid_label'), 'TXN12345678');
    fireEvent.changeText(getByDisplayValue('1500'), '1500');
    fireEvent.press(getByText('payment.submit'));

    await waitFor(() => {
      expect(paymentService.submitPayment).toHaveBeenCalledWith({
        job_id: 'job-awaiting',
        method: PaymentMethod.BKASH,
        transaction_id: 'TXN12345678',
        amount_paisa: 150000,
      });
    });
  });

  it('shows error toast on API failure', async () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { toast } = require('../../utils/toast');
    paymentService.submitPayment.mockRejectedValue(new Error('Network error'));

    const { getByText, getByDisplayValue } = renderPaymentScreen();
    await waitFor(() => getByText('payment.method_cash'));

    fireEvent.press(getByText('payment.method_cash'));
    fireEvent.changeText(getByDisplayValue('1500'), '1500');
    fireEvent.press(getByText('payment.submit'));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('payment.error');
    });
  });
});
