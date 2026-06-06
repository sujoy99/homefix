import { renderHook, act, waitFor } from '@testing-library/react-native';
import { useVoiceCall } from '../../hooks/useVoiceCall';
import type { RoomConfig } from '../../services/call.service';

// ── callService mock ──────────────────────────────────────────────────────────

const mockCreateRoom = jest.fn();
const mockBuildCallUrl = jest.fn();

jest.mock('../../services/call.service', () => ({
  callService: {
    createRoom:    (...a: unknown[]) => mockCreateRoom(...a),
    buildCallUrl:  (...a: unknown[]) => mockBuildCallUrl(...a),
  },
}));

// ── expo-web-browser mock ─────────────────────────────────────────────────────

const mockOpenBrowserAsync = jest.fn();

jest.mock('expo-web-browser', () => ({
  openBrowserAsync: (...a: unknown[]) => mockOpenBrowserAsync(...a),
}));

// ── react-i18next mock ────────────────────────────────────────────────────────

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (k: string) => k }),
}));

// ── toast mock ────────────────────────────────────────────────────────────────

jest.mock('../../utils/toast', () => ({
  toast: { error: jest.fn(), success: jest.fn() },
}));

// ── helpers ───────────────────────────────────────────────────────────────────

function buildRoomConfig(overrides: Partial<RoomConfig> = {}): RoomConfig {
  return {
    provider: 'jitsi',
    roomName: 'homefix-job-job-1',
    serverUrl: 'https://meet.homefix.app',
    ...overrides,
  };
}

// ─────────────────────────────────────────────────────────────────────────────

describe('useVoiceCall', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCreateRoom.mockResolvedValue(buildRoomConfig());
    mockBuildCallUrl.mockReturnValue('https://meet.homefix.app/homefix-job-job-1');
    mockOpenBrowserAsync.mockResolvedValue({ type: 'dismiss' });
  });

  it('starts with isCallLoading false', () => {
    const { result } = renderHook(() => useVoiceCall('job-1'));
    expect(result.current.isCallLoading).toBe(false);
  });

  it('startCall calls createRoom with the jobId', async () => {
    const { result } = renderHook(() => useVoiceCall('job-1'));

    await act(async () => { await result.current.startCall(); });

    expect(mockCreateRoom).toHaveBeenCalledWith('job-1');
  });

  it('startCall calls buildCallUrl with the returned config', async () => {
    const config = buildRoomConfig({ token: 'jwt-abc' });
    mockCreateRoom.mockResolvedValue(config);

    const { result } = renderHook(() => useVoiceCall('job-1'));
    await act(async () => { await result.current.startCall(); });

    expect(mockBuildCallUrl).toHaveBeenCalledWith(config);
  });

  it('startCall opens the browser with the built URL', async () => {
    mockBuildCallUrl.mockReturnValue('https://meet.homefix.app/homefix-job-job-1?jwt=tok');

    const { result } = renderHook(() => useVoiceCall('job-1'));
    await act(async () => { await result.current.startCall(); });

    expect(mockOpenBrowserAsync).toHaveBeenCalledWith(
      'https://meet.homefix.app/homefix-job-job-1?jwt=tok',
    );
  });

  it('sets isCallLoading true while in flight, false after success', async () => {
    let resolve!: (v: { type: string }) => void;
    mockOpenBrowserAsync.mockReturnValue(new Promise<{ type: string }>((res) => { resolve = res; }));

    const { result } = renderHook(() => useVoiceCall('job-1'));

    act(() => { void result.current.startCall(); });
    await waitFor(() => expect(result.current.isCallLoading).toBe(true));

    await act(async () => { resolve({ type: 'dismiss' }); });
    expect(result.current.isCallLoading).toBe(false);
  });

  it('shows error toast and resets isCallLoading when createRoom throws', async () => {
    mockCreateRoom.mockRejectedValue(new Error('API error'));
    const { toast } = require('../../utils/toast');

    const { result } = renderHook(() => useVoiceCall('job-1'));
    await act(async () => { await result.current.startCall(); });

    expect(toast.error).toHaveBeenCalledWith('call.error_start');
    expect(result.current.isCallLoading).toBe(false);
  });

  it('shows error toast and resets isCallLoading when openBrowserAsync throws', async () => {
    mockOpenBrowserAsync.mockRejectedValue(new Error('Browser error'));
    const { toast } = require('../../utils/toast');

    const { result } = renderHook(() => useVoiceCall('job-1'));
    await act(async () => { await result.current.startCall(); });

    expect(toast.error).toHaveBeenCalledWith('call.error_start');
    expect(result.current.isCallLoading).toBe(false);
  });
});
