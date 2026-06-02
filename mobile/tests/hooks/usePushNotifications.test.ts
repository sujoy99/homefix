import { renderHook, waitFor } from '@testing-library/react-native';
import { usePushNotifications } from '../../hooks/usePushNotifications';

const mockPush = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush }),
}));

const mockIsDevice = { value: true };
jest.mock('expo-device', () => ({
  get isDevice() {
    return mockIsDevice.value;
  },
}));

const mockGetPermissionsAsync = jest.fn();
const mockRequestPermissionsAsync = jest.fn();
const mockGetDevicePushTokenAsync = jest.fn();
const mockAddNotificationResponseReceivedListener = jest.fn();

jest.mock('expo-notifications', () => ({
  getPermissionsAsync: (...args: unknown[]) => mockGetPermissionsAsync(...args),
  requestPermissionsAsync: (...args: unknown[]) => mockRequestPermissionsAsync(...args),
  getDevicePushTokenAsync: (...args: unknown[]) => mockGetDevicePushTokenAsync(...args),
  addNotificationResponseReceivedListener: (...args: unknown[]) =>
    mockAddNotificationResponseReceivedListener(...args),
}));

const mockRegisterDeviceToken = jest.fn();
jest.mock('../../services/notification.service', () => ({
  notificationService: {
    registerDeviceToken: (...args: unknown[]) => mockRegisterDeviceToken(...args),
  },
}));

describe('usePushNotifications', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockIsDevice.value = true;
    mockAddNotificationResponseReceivedListener.mockReturnValue({ remove: jest.fn() });
    mockGetPermissionsAsync.mockResolvedValue({ status: 'granted' });
    mockRequestPermissionsAsync.mockResolvedValue({ status: 'granted' });
    mockGetDevicePushTokenAsync.mockResolvedValue({ type: 'android', data: 'fcm-token-xyz' });
    mockRegisterDeviceToken.mockResolvedValue(undefined);
  });

  it('registers push token when permission is already granted', async () => {
    renderHook(() => usePushNotifications());

    await waitFor(() => {
      expect(mockRegisterDeviceToken).toHaveBeenCalledWith('fcm-token-xyz');
    });
  });

  it('requests permission when not already granted then registers token', async () => {
    mockGetPermissionsAsync.mockResolvedValue({ status: 'undetermined' });
    mockRequestPermissionsAsync.mockResolvedValue({ status: 'granted' });

    renderHook(() => usePushNotifications());

    await waitFor(() => {
      expect(mockRequestPermissionsAsync).toHaveBeenCalled();
      expect(mockRegisterDeviceToken).toHaveBeenCalledWith('fcm-token-xyz');
    });
  });

  it('does not register token when permission is denied', async () => {
    // existingStatus !== 'granted' triggers requestPermissionsAsync; that also returns denied
    mockGetPermissionsAsync.mockResolvedValue({ status: 'undetermined' });
    mockRequestPermissionsAsync.mockResolvedValue({ status: 'denied' });

    renderHook(() => usePushNotifications());

    // Wait for the full permission chain to run (requestPermissionsAsync is the last call in denied path)
    await waitFor(() => {
      expect(mockRequestPermissionsAsync).toHaveBeenCalled();
    });
    expect(mockGetDevicePushTokenAsync).not.toHaveBeenCalled();
    expect(mockRegisterDeviceToken).not.toHaveBeenCalled();
  });

  it('does nothing on non-device (simulator)', async () => {
    mockIsDevice.value = false;

    renderHook(() => usePushNotifications());

    await waitFor(() => {
      // setNotificationHandler is module-level so not mocked here
      // just verify none of the permission/token flow fired
      expect(mockGetPermissionsAsync).not.toHaveBeenCalled();
    });
    expect(mockRegisterDeviceToken).not.toHaveBeenCalled();
  });

  it('navigates to job detail when notification is tapped with jobId', () => {
    const ref = { cb: (_: unknown): void => {} };
    mockAddNotificationResponseReceivedListener.mockImplementation((cb: (r: unknown) => void) => {
      ref.cb = cb;
      return { remove: jest.fn() };
    });

    renderHook(() => usePushNotifications());

    ref.cb({
      notification: { request: { content: { data: { type: 'JOB_ACCEPTED', jobId: 'job-uuid-99' } } } },
    });

    expect(mockPush).toHaveBeenCalledWith('/(app)/booking/job/job-uuid-99');
  });

  it('does not navigate when notification data has no jobId', () => {
    const ref = { cb: (_: unknown): void => {} };
    mockAddNotificationResponseReceivedListener.mockImplementation((cb: (r: unknown) => void) => {
      ref.cb = cb;
      return { remove: jest.fn() };
    });

    renderHook(() => usePushNotifications());

    ref.cb({
      notification: { request: { content: { data: { type: 'GENERIC' } } } },
    });

    expect(mockPush).not.toHaveBeenCalled();
  });

  it('removes the notification response listener on unmount', () => {
    const mockRemove = jest.fn();
    mockAddNotificationResponseReceivedListener.mockReturnValue({ remove: mockRemove });

    const { unmount } = renderHook(() => usePushNotifications());
    unmount();

    expect(mockRemove).toHaveBeenCalled();
  });
});
