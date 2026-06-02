import { notificationService } from '../../services/notification.service';

jest.mock('../../api/client', () => ({
  apiClient: {
    post: jest.fn(),
    delete: jest.fn(),
  },
}));

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { apiClient } = require('../../api/client');

function mockResponse<T>(data: T) {
  return Promise.resolve({ data: { status: 'success', body: data } });
}

function mockApiError(status = 400, errorCode = 'ERROR') {
  const err = Object.assign(new Error('API Error'), {
    response: { status, data: { error_code: errorCode } },
  });
  return Promise.reject(err);
}

const FCM_TOKEN = 'fcm-device-token-abc123';

// ─── registerDeviceToken ──────────────────────────────────────────────────────

describe('notificationService.registerDeviceToken', () => {
  beforeEach(() => jest.clearAllMocks());

  it('posts token to /v2/users/me/device-token', async () => {
    apiClient.post.mockReturnValue(mockResponse(null));

    await notificationService.registerDeviceToken(FCM_TOKEN);

    expect(apiClient.post).toHaveBeenCalledWith('/v2/users/me/device-token', {
      token: FCM_TOKEN,
    });
  });

  it('resolves without returning a value on success', async () => {
    apiClient.post.mockReturnValue(mockResponse(null));

    const result = await notificationService.registerDeviceToken(FCM_TOKEN);

    expect(result).toBeUndefined();
  });

  it('rejects on 401 unauthorized', async () => {
    apiClient.post.mockReturnValue(mockApiError(401, 'UNAUTHORIZED'));

    await expect(notificationService.registerDeviceToken(FCM_TOKEN)).rejects.toThrow();
  });

  it('rejects on server error', async () => {
    apiClient.post.mockReturnValue(mockApiError(500, 'INTERNAL_ERROR'));

    await expect(notificationService.registerDeviceToken(FCM_TOKEN)).rejects.toMatchObject({
      response: { status: 500 },
    });
  });
});

// ─── unregisterDeviceToken ────────────────────────────────────────────────────

describe('notificationService.unregisterDeviceToken', () => {
  beforeEach(() => jest.clearAllMocks());

  it('sends DELETE to /v2/users/me/device-token', async () => {
    apiClient.delete.mockReturnValue(mockResponse(null));

    await notificationService.unregisterDeviceToken();

    expect(apiClient.delete).toHaveBeenCalledWith('/v2/users/me/device-token');
  });

  it('resolves without returning a value on success', async () => {
    apiClient.delete.mockReturnValue(mockResponse(null));

    const result = await notificationService.unregisterDeviceToken();

    expect(result).toBeUndefined();
  });

  it('rejects on 401 unauthorized', async () => {
    apiClient.delete.mockReturnValue(mockApiError(401, 'UNAUTHORIZED'));

    await expect(notificationService.unregisterDeviceToken()).rejects.toThrow();
  });

  it('rejects on 404 when token not found', async () => {
    apiClient.delete.mockReturnValue(mockApiError(404, 'RESOURCE_NOT_FOUND'));

    await expect(notificationService.unregisterDeviceToken()).rejects.toMatchObject({
      response: { data: { error_code: 'RESOURCE_NOT_FOUND' } },
    });
  });
});
