import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { VoiceNotePlayer } from '../../components/shared/VoiceNotePlayer';

// ── expo-av mock ──────────────────────────────────────────────────────────────
jest.mock('expo-av', () => {
  let statusCallback: ((s: Record<string, unknown>) => void) | null = null;

  const soundInstance = {
    getStatusAsync: jest.fn().mockResolvedValue({ isLoaded: true, isPlaying: false }),
    pauseAsync: jest.fn().mockResolvedValue(undefined),
    playAsync: jest.fn().mockResolvedValue(undefined),
    unloadAsync: jest.fn().mockResolvedValue(undefined),
    setPositionAsync: jest.fn().mockResolvedValue(undefined),
    _triggerStatus: (s: Record<string, unknown>) => statusCallback && statusCallback(s),
  };

  return {
    Audio: {
      Sound: {
        createAsync: jest.fn().mockImplementation((_src, _opts, cb) => {
          statusCallback = cb ?? null;
          return Promise.resolve({ sound: soundInstance });
        }),
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

const TEST_URI = 'file:///tmp/voice_note.m4a';

describe('VoiceNotePlayer', () => {
  it('renders play button and label', () => {
    render(<VoiceNotePlayer uri={TEST_URI} />);
    expect(screen.getByText('job_detail.voice_note')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'job_detail.voice_play' })).toBeTruthy();
  });

  it('shows pause button after pressing play', async () => {
    render(<VoiceNotePlayer uri={TEST_URI} />);
    fireEvent.press(screen.getByRole('button', { name: 'job_detail.voice_play' }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'job_detail.voice_pause' })).toBeTruthy();
    });
  });

  it('shows play button again after pressing pause', async () => {
    const { Audio } = require('expo-av');
    Audio.Sound.createAsync.mockImplementationOnce((_src: unknown, _opts: unknown, cb: unknown) => {
      const sound = {
        getStatusAsync: jest.fn().mockResolvedValue({ isLoaded: true, isPlaying: true }),
        pauseAsync: jest.fn().mockResolvedValue(undefined),
        playAsync: jest.fn().mockResolvedValue(undefined),
        unloadAsync: jest.fn().mockResolvedValue(undefined),
        setPositionAsync: jest.fn().mockResolvedValue(undefined),
      };
      return Promise.resolve({ sound });
    });

    render(<VoiceNotePlayer uri={TEST_URI} />);
    fireEvent.press(screen.getByRole('button', { name: 'job_detail.voice_play' }));
    await waitFor(() => screen.getByRole('button', { name: 'job_detail.voice_pause' }));

    fireEvent.press(screen.getByRole('button', { name: 'job_detail.voice_pause' }));
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'job_detail.voice_play' })).toBeTruthy();
    });
  });

  it('resets to play state when playback finishes', async () => {
    const { Audio } = require('expo-av');
    let capturedCb: ((s: Record<string, unknown>) => void) | null = null;
    const sound = {
      getStatusAsync: jest.fn().mockResolvedValue({ isLoaded: true, isPlaying: false }),
      pauseAsync: jest.fn().mockResolvedValue(undefined),
      playAsync: jest.fn().mockResolvedValue(undefined),
      unloadAsync: jest.fn().mockResolvedValue(undefined),
      setPositionAsync: jest.fn().mockResolvedValue(undefined),
    };
    Audio.Sound.createAsync.mockImplementationOnce(
      (_src: unknown, _opts: unknown, cb: (s: Record<string, unknown>) => void) => {
        capturedCb = cb;
        return Promise.resolve({ sound });
      },
    );

    render(<VoiceNotePlayer uri={TEST_URI} />);
    fireEvent.press(screen.getByRole('button', { name: 'job_detail.voice_play' }));
    await waitFor(() => screen.getByRole('button', { name: 'job_detail.voice_pause' }));

    // Simulate playback finishing
    capturedCb!({ isLoaded: true, didJustFinish: true, positionMillis: 0 });

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'job_detail.voice_play' })).toBeTruthy();
    });
  });
});
