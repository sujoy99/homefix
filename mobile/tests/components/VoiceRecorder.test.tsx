import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { VoiceRecorder } from '../../components/shared/VoiceRecorder';

// ── expo-av mock — all constructors defined inside factory (hoisting-safe) ───
jest.mock('expo-av', () => {
  const recordingInstance = {
    prepareToRecordAsync: jest.fn().mockResolvedValue(undefined),
    startAsync: jest.fn().mockResolvedValue(undefined),
    stopAndUnloadAsync: jest.fn().mockResolvedValue(undefined),
    getURI: jest.fn().mockReturnValue('file:///tmp/voice_test.m4a'),
  };
  const MockRecording = jest.fn(() => recordingInstance);

  const soundInstance = {
    pauseAsync: jest.fn().mockResolvedValue(undefined),
    playAsync: jest.fn().mockResolvedValue(undefined),
    unloadAsync: jest.fn().mockResolvedValue(undefined),
  };

  return {
    Audio: {
      requestPermissionsAsync: jest.fn().mockResolvedValue({ granted: true }),
      setAudioModeAsync: jest.fn().mockResolvedValue(undefined),
      Recording: MockRecording,
      RecordingOptionsPresets: { HIGH_QUALITY: {} },
      Sound: {
        createAsync: jest.fn().mockResolvedValue({ sound: soundInstance }),
      },
    },
  };
});

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

describe('VoiceRecorder', () => {
  it('renders mic button in idle state', () => {
    render(<VoiceRecorder onRecorded={jest.fn()} />);
    expect(screen.getByRole('button', { name: 'booking.voice_record' })).toBeTruthy();
    expect(screen.getByText('booking.voice_hint')).toBeTruthy();
  });

  it('shows stop button and recording status after recording starts', async () => {
    render(<VoiceRecorder onRecorded={jest.fn()} />);
    fireEvent.press(screen.getByRole('button', { name: 'booking.voice_record' }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'booking.voice_stop' })).toBeTruthy();
    });
    expect(screen.getByText('booking.voice_recording')).toBeTruthy();
  });

  it('transitions to recorded state and calls onRecorded after stopping', async () => {
    const onRecorded = jest.fn();
    render(<VoiceRecorder onRecorded={onRecorded} />);

    fireEvent.press(screen.getByRole('button', { name: 'booking.voice_record' }));
    await waitFor(() => screen.getByRole('button', { name: 'booking.voice_stop' }));

    fireEvent.press(screen.getByRole('button', { name: 'booking.voice_stop' }));
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'booking.voice_play' })).toBeTruthy();
    });

    expect(screen.getByText('booking.voice_recorded')).toBeTruthy();
    expect(onRecorded).toHaveBeenCalledWith('file:///tmp/voice_test.m4a');
  });

  it('calls onRecorded(null) and resets to idle on delete', async () => {
    const onRecorded = jest.fn();
    render(<VoiceRecorder onRecorded={onRecorded} />);

    fireEvent.press(screen.getByRole('button', { name: 'booking.voice_record' }));
    await waitFor(() => screen.getByRole('button', { name: 'booking.voice_stop' }));
    fireEvent.press(screen.getByRole('button', { name: 'booking.voice_stop' }));
    await waitFor(() => screen.getByRole('button', { name: 'booking.voice_delete' }));

    fireEvent.press(screen.getByRole('button', { name: 'booking.voice_delete' }));
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'booking.voice_record' })).toBeTruthy();
    });

    expect(onRecorded).toHaveBeenLastCalledWith(null);
  });

  it('does not start recording if mic permission is denied', async () => {
    const { Audio } = require('expo-av');
    Audio.requestPermissionsAsync.mockResolvedValueOnce({ granted: false });

    render(<VoiceRecorder onRecorded={jest.fn()} />);
    fireEvent.press(screen.getByRole('button', { name: 'booking.voice_record' }));

    await waitFor(() => {
      expect(screen.queryByRole('button', { name: 'booking.voice_stop' })).toBeNull();
    });
  });

  it('shows pause button while playing', async () => {
    render(<VoiceRecorder onRecorded={jest.fn()} />);

    fireEvent.press(screen.getByRole('button', { name: 'booking.voice_record' }));
    await waitFor(() => screen.getByRole('button', { name: 'booking.voice_stop' }));
    fireEvent.press(screen.getByRole('button', { name: 'booking.voice_stop' }));
    await waitFor(() => screen.getByRole('button', { name: 'booking.voice_play' }));

    fireEvent.press(screen.getByRole('button', { name: 'booking.voice_play' }));
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'booking.voice_pause' })).toBeTruthy();
    });
  });
});
