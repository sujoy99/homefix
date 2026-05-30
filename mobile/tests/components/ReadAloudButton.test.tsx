import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { ReadAloudButton } from '../../components/shared/ReadAloudButton';

// ── expo-speech mock ──────────────────────────────────────────────────────────
jest.mock('expo-speech', () => ({
  speak: jest.fn(),
  stop: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (k: string) => k }),
}));

jest.mock('lucide-react-native', () => {
  const React = require('react');
  const { View } = require('react-native');
  const Icon = () => React.createElement(View, null);
  return new Proxy({}, { get: () => Icon });
});

// ─────────────────────────────────────────────────────────────────────────────

const Speech = require('expo-speech');

describe('ReadAloudButton', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders "read aloud" button in idle state', () => {
    render(<ReadAloudButton text="Fix the pipe" />);
    expect(screen.getByRole('button', { name: 'job_detail.read_aloud' })).toBeTruthy();
    expect(screen.getByText('job_detail.read_aloud')).toBeTruthy();
  });

  it('calls Speech.speak with text and language on press', () => {
    render(<ReadAloudButton text="Fix the pipe" language="bn-BD" />);
    fireEvent.press(screen.getByRole('button', { name: 'job_detail.read_aloud' }));

    expect(Speech.speak).toHaveBeenCalledWith(
      'Fix the pipe',
      expect.objectContaining({ language: 'bn-BD' }),
    );
  });

  it('shows stop button while speaking', async () => {
    Speech.speak.mockImplementationOnce((_text: string, opts: { onDone?: () => void }) => {
      // Don't call onDone — simulate ongoing speech
      void opts;
    });

    render(<ReadAloudButton text="Fix the pipe" />);
    fireEvent.press(screen.getByRole('button', { name: 'job_detail.read_aloud' }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'job_detail.read_aloud_stop' })).toBeTruthy();
    });
  });

  it('calls Speech.stop and resets to idle when stop is pressed', async () => {
    Speech.speak.mockImplementationOnce(() => { /* ongoing */ });

    render(<ReadAloudButton text="Fix the pipe" />);
    fireEvent.press(screen.getByRole('button', { name: 'job_detail.read_aloud' }));
    await waitFor(() => screen.getByRole('button', { name: 'job_detail.read_aloud_stop' }));

    fireEvent.press(screen.getByRole('button', { name: 'job_detail.read_aloud_stop' }));

    await waitFor(() => {
      expect(Speech.stop).toHaveBeenCalled();
      expect(screen.getByRole('button', { name: 'job_detail.read_aloud' })).toBeTruthy();
    });
  });

  it('resets to idle when Speech.speak calls onDone', async () => {
    Speech.speak.mockImplementationOnce((_text: string, opts: { onDone?: () => void }) => {
      opts.onDone?.();
    });

    render(<ReadAloudButton text="Fix the pipe" />);
    fireEvent.press(screen.getByRole('button', { name: 'job_detail.read_aloud' }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'job_detail.read_aloud' })).toBeTruthy();
    });
  });

  it('uses en-US language when language prop is en-US', () => {
    render(<ReadAloudButton text="Fix the pipe" language="en-US" />);
    fireEvent.press(screen.getByRole('button', { name: 'job_detail.read_aloud' }));

    expect(Speech.speak).toHaveBeenCalledWith(
      'Fix the pipe',
      expect.objectContaining({ language: 'en-US' }),
    );
  });
});
