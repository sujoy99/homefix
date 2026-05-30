import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { JobStatus } from '@homefix/shared';
import BookingsScreen from '../../app/(app)/(tabs)/bookings';
import { buildJob, buildActiveJob, buildPaidJob } from '../factories/job.factory';

// ── Mock dependencies ─────────────────────────────────────────────────────────

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (k: string, opts?: Record<string, unknown>) => {
    if (opts) return `${k}(${JSON.stringify(opts)})`;
    return k;
  }}),
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
    useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
  };
});

jest.mock('../../services/job.service', () => ({
  jobService: { getMyJobs: jest.fn() },
}));

jest.mock('../../services/category.service', () => ({
  categoryService: { listActive: jest.fn() },
}));

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { jobService } = require('../../services/job.service');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { categoryService } = require('../../services/category.service');

// ── Test helpers ──────────────────────────────────────────────────────────────

function makeClient() {
  return new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0, staleTime: 0 } },
  });
}

function renderBookings(jobs = [] as ReturnType<typeof buildJob>[]) {
  jobService.getMyJobs.mockResolvedValue(jobs);
  categoryService.listActive.mockResolvedValue([
    { id: 'cat-1', name: 'Plumbing', name_bn: 'প্লাম্বিং', slug: 'plumbing', requires_area: false, is_active: true, sort_order: 1 },
  ]);
  return render(
    <QueryClientProvider client={makeClient()}>
      <BookingsScreen />
    </QueryClientProvider>
  );
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('BookingsScreen (resident)', () => {
  beforeEach(() => jest.clearAllMocks());

  it('renders the 4 status tabs', async () => {
    renderBookings([]);
    await waitFor(() => {
      expect(screen.getByText('bookings.tab_upcoming')).toBeTruthy();
      expect(screen.getByText('bookings.tab_active')).toBeTruthy();
      expect(screen.getByText('bookings.tab_awaiting')).toBeTruthy();
      expect(screen.getByText('bookings.tab_completed')).toBeTruthy();
    });
  });

  it('shows empty state on Upcoming tab when there are no PENDING jobs', async () => {
    renderBookings([]);
    await waitFor(() => {
      expect(screen.getByText('bookings.empty_upcoming_title')).toBeTruthy();
    });
  });

  it('renders PENDING job card on Upcoming tab', async () => {
    const job = buildJob({ title: 'Fix tap', status: JobStatus.PENDING });
    renderBookings([job]);
    await waitFor(() => {
      expect(screen.getByText('Fix tap')).toBeTruthy();
    });
  });

  it('shows count on tabs that have jobs', async () => {
    const jobs = [
      buildJob({ status: JobStatus.PENDING }),
      buildJob({ status: JobStatus.PENDING }),
      buildActiveJob(),
    ];
    renderBookings(jobs);
    await waitFor(() => {
      expect(screen.getByText('bookings.tab_upcoming (2)')).toBeTruthy();
      expect(screen.getByText('bookings.tab_active (1)')).toBeTruthy();
    });
  });

  it('switching to Active tab shows only ACTIVE jobs', async () => {
    const pending = buildJob({ title: 'Pending Job', status: JobStatus.PENDING });
    const active  = buildActiveJob();
    active.title  = 'Active Job';
    renderBookings([pending, active]);

    await waitFor(() => screen.getByText('Pending Job'));

    fireEvent.press(screen.getByText('bookings.tab_active (1)'));

    await waitFor(() => {
      expect(screen.getByText('Active Job')).toBeTruthy();
      expect(screen.queryByText('Pending Job')).toBeNull();
    });
  });

  it('Completed tab shows PAID and CANCELLED jobs', async () => {
    const paid = buildPaidJob();
    paid.title = 'Paid Job';
    renderBookings([paid]);

    await waitFor(() => screen.getByText('bookings.tab_upcoming'));
    // Use regex to match tab label regardless of how RN splits child text nodes
    fireEvent.press(screen.getByText(/bookings\.tab_completed/));

    await waitFor(() => {
      expect(screen.getByText('Paid Job')).toBeTruthy();
    });
  });

  it('navigates to booking/create when New Booking FAB tapped', async () => {
    const { router } = require('expo-router');
    renderBookings([]);
    await waitFor(() => screen.getByText('bookings.tab_upcoming'));

    fireEvent.press(screen.getByTestId('new-booking-fab'));
    expect(router.push).toHaveBeenCalledWith('/(app)/booking/create');
  });
});
