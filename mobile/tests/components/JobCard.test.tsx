import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { JobStatus } from '@homefix/shared';
import { JobCard } from '../../components/shared/JobCard';
import { buildJob, buildActiveJob, buildPaidJob } from '../factories/job.factory';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (k: string) => k }),
}));

jest.mock('lucide-react-native', () => {
  const React = require('react');
  const { View } = require('react-native');
  const Icon = () => React.createElement(View, null);
  return new Proxy({}, { get: () => Icon });
});

describe('JobCard', () => {
  it('renders job title', () => {
    const job = buildJob({ title: 'Fix leaking pipe' });
    render(<JobCard job={job} />);
    expect(screen.getByText('Fix leaking pipe')).toBeTruthy();
  });

  it('renders category name chip when provided', () => {
    const job = buildJob();
    render(<JobCard job={job} categoryName="Plumbing" />);
    expect(screen.getByText('Plumbing')).toBeTruthy();
  });

  it('renders status badge key for PENDING job', () => {
    const job = buildJob({ status: JobStatus.PENDING });
    render(<JobCard job={job} />);
    expect(screen.getByText('status.pending')).toBeTruthy();
  });

  it('renders status badge key for ACTIVE job', () => {
    const job = buildActiveJob();
    render(<JobCard job={job} />);
    expect(screen.getByText('status.active')).toBeTruthy();
  });

  it('renders status badge key for PAID job', () => {
    const job = buildPaidJob();
    render(<JobCard job={job} />);
    expect(screen.getByText('status.paid')).toBeTruthy();
  });

  it('renders budget when estimated_budget is set', () => {
    const job = buildJob({ estimated_budget: 1500 });
    render(<JobCard job={job} />);
    expect(screen.getByText('৳1500')).toBeTruthy();
  });

  it('renders budget_tbd key when no budget', () => {
    const job = buildJob({ estimated_budget: null });
    render(<JobCard job={job} />);
    expect(screen.getByText('bookings.budget_tbd')).toBeTruthy();
  });

  it('calls onPress when tapped', () => {
    const onPress = jest.fn();
    const job = buildJob();
    render(<JobCard job={job} onPress={onPress} />);
    fireEvent.press(screen.getByText(job.title!));
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
