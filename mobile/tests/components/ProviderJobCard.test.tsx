import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { ProviderJobCard } from '../../components/shared/ProviderJobCard';
import { buildJob } from '../factories/job.factory';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (k: string) => k }),
}));

jest.mock('lucide-react-native', () => {
  const React = require('react');
  const { View } = require('react-native');
  const Icon = () => React.createElement(View, null);
  return new Proxy({}, { get: () => Icon });
});

describe('ProviderJobCard', () => {
  const mockPress = jest.fn();

  beforeEach(() => mockPress.mockClear());

  it('renders the job title', () => {
    const job = buildJob({ title: 'Electrical repair' });
    render(<ProviderJobCard job={job} onPress={mockPress} />);
    expect(screen.getByText('Electrical repair')).toBeTruthy();
  });

  it('renders description preview truncated to 100 chars', () => {
    const longDesc = 'A'.repeat(120);
    const job = buildJob({ description: longDesc });
    render(<ProviderJobCard job={job} onPress={mockPress} />);
    expect(screen.getByText(`${'A'.repeat(100)}…`)).toBeTruthy();
  });

  it('renders short description in full', () => {
    const job = buildJob({ description: 'Short description here.' });
    render(<ProviderJobCard job={job} onPress={mockPress} />);
    expect(screen.getByText('Short description here.')).toBeTruthy();
  });

  it('renders distance badge when distanceKm provided', () => {
    const job = buildJob();
    render(<ProviderJobCard job={job} onPress={mockPress} distanceKm={3.5} />);
    expect(screen.getByText('feed.distance_km')).toBeTruthy();
  });

  it('renders "nearby" when distanceKm < 1', () => {
    const job = buildJob();
    render(<ProviderJobCard job={job} onPress={mockPress} distanceKm={0.4} />);
    expect(screen.getByText('feed.distance_near')).toBeTruthy();
  });

  it('renders budget_tbd when no budget', () => {
    const job = buildJob({ estimated_budget: null });
    render(<ProviderJobCard job={job} onPress={mockPress} />);
    expect(screen.getByText('feed.budget_tbd')).toBeTruthy();
  });

  it('calls onPress when View Job button tapped', () => {
    const job = buildJob();
    render(<ProviderJobCard job={job} onPress={mockPress} />);
    fireEvent.press(screen.getAllByText('feed.view_job')[0]);
    expect(mockPress).toHaveBeenCalledTimes(1);
  });
});
