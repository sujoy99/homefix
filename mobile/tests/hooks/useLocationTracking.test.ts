import { renderHook, waitFor } from '@testing-library/react-native';
import { useLocationTracking } from '../../hooks/useLocationTracking';

// ── expo-location mock ────────────────────────────────────────────────────────

const mockGetForegroundPermissionsAsync = jest.fn();
const mockRequestForegroundPermissionsAsync = jest.fn();
const mockWatchPositionAsync = jest.fn();

jest.mock('expo-location', () => ({
  Accuracy: { Balanced: 3 },
  getForegroundPermissionsAsync: (...args: unknown[]) =>
    mockGetForegroundPermissionsAsync(...args),
  requestForegroundPermissionsAsync: (...args: unknown[]) =>
    mockRequestForegroundPermissionsAsync(...args),
  watchPositionAsync: (...args: unknown[]) => mockWatchPositionAsync(...args),
}));

// ── locationService mock ──────────────────────────────────────────────────────

const mockUpdateMyLocation = jest.fn();

jest.mock('../../services/location.service', () => ({
  locationService: {
    updateMyLocation: (...args: unknown[]) => mockUpdateMyLocation(...args),
  },
}));

// ── helpers ───────────────────────────────────────────────────────────────────

function makeMockSubscription() {
  return { remove: jest.fn() };
}

// ── tests ─────────────────────────────────────────────────────────────────────

describe('useLocationTracking', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetForegroundPermissionsAsync.mockResolvedValue({ status: 'granted' });
    mockRequestForegroundPermissionsAsync.mockResolvedValue({ status: 'granted' });
    mockWatchPositionAsync.mockResolvedValue(makeMockSubscription());
    mockUpdateMyLocation.mockResolvedValue(undefined);
  });

  it('does not request permissions or start watching when disabled', async () => {
    renderHook(() => useLocationTracking(false));

    await waitFor(() => {
      expect(mockGetForegroundPermissionsAsync).not.toHaveBeenCalled();
    });
    expect(mockWatchPositionAsync).not.toHaveBeenCalled();
  });

  it('starts watching when enabled and permission already granted', async () => {
    mockGetForegroundPermissionsAsync.mockResolvedValue({ status: 'granted' });

    renderHook(() => useLocationTracking(true));

    await waitFor(() => {
      expect(mockWatchPositionAsync).toHaveBeenCalled();
    });
    expect(mockRequestForegroundPermissionsAsync).not.toHaveBeenCalled();
  });

  it('requests permission when not yet granted then starts watching', async () => {
    mockGetForegroundPermissionsAsync.mockResolvedValue({ status: 'undetermined' });
    mockRequestForegroundPermissionsAsync.mockResolvedValue({ status: 'granted' });

    renderHook(() => useLocationTracking(true));

    await waitFor(() => {
      expect(mockRequestForegroundPermissionsAsync).toHaveBeenCalled();
      expect(mockWatchPositionAsync).toHaveBeenCalled();
    });
  });

  it('does not start watching when permission is denied', async () => {
    mockGetForegroundPermissionsAsync.mockResolvedValue({ status: 'undetermined' });
    mockRequestForegroundPermissionsAsync.mockResolvedValue({ status: 'denied' });

    renderHook(() => useLocationTracking(true));

    await waitFor(() => {
      expect(mockRequestForegroundPermissionsAsync).toHaveBeenCalled();
    });
    expect(mockWatchPositionAsync).not.toHaveBeenCalled();
  });

  it('calls updateMyLocation with coords when position changes', async () => {
    let positionCallback: ((loc: unknown) => void) | null = null;
    mockWatchPositionAsync.mockImplementation(
      (_opts: unknown, cb: (loc: unknown) => void) => {
        positionCallback = cb;
        return Promise.resolve(makeMockSubscription());
      },
    );

    renderHook(() => useLocationTracking(true));

    await waitFor(() => {
      expect(mockWatchPositionAsync).toHaveBeenCalled();
    });

    positionCallback!({ coords: { latitude: 23.8103, longitude: 90.4125 } });

    await waitFor(() => {
      expect(mockUpdateMyLocation).toHaveBeenCalledWith(23.8103, 90.4125);
    });
  });

  it('removes watcher subscription on unmount', async () => {
    const mockRemove = jest.fn();
    mockWatchPositionAsync.mockResolvedValue({ remove: mockRemove });

    const { unmount } = renderHook(() => useLocationTracking(true));

    await waitFor(() => {
      expect(mockWatchPositionAsync).toHaveBeenCalled();
    });

    unmount();

    expect(mockRemove).toHaveBeenCalled();
  });
});
