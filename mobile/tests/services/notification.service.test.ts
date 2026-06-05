import { notificationService } from '../../services/notification.service';

jest.mock('../../api/client', () => ({
  apiClient: {
    post: jest.fn(),
    delete: jest.fn(),
    get: jest.fn(),
    patch: jest.fn(),
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

// ─── getNotifications ─────────────────────────────────────────────────────────

const NOTIFICATION_ITEM = {
  id: 'notif-1',
  type: 'JOB_ACCEPTED',
  title_en: 'Job Accepted',
  title_bn: 'কাজ গ্রহণ করা হয়েছে',
  body_en: 'Your booking was accepted.',
  body_bn: 'আপনার বুকিং গ্রহণ করা হয়েছে।',
  data: { jobId: 'job-abc' },
  is_read: false,
  created_at: '2026-06-05T10:00:00Z',
};

const PAGINATION = { page: 1, limit: 20, total: 1, totalPages: 1 };

describe('notificationService.getNotifications', () => {
  beforeEach(() => jest.clearAllMocks());

  it('calls GET /v2/users/me/notifications with default page and limit', async () => {
    apiClient.get.mockReturnValue(
      mockResponse({ items: [NOTIFICATION_ITEM], pagination: PAGINATION, unread_count: 1 }),
    );

    await notificationService.getNotifications();

    expect(apiClient.get).toHaveBeenCalledWith('/v2/users/me/notifications?page=1&limit=20');
  });

  it('passes custom page and limit as query params', async () => {
    apiClient.get.mockReturnValue(
      mockResponse({ items: [], pagination: { ...PAGINATION, page: 2 }, unread_count: 0 }),
    );

    await notificationService.getNotifications(2, 10);

    expect(apiClient.get).toHaveBeenCalledWith('/v2/users/me/notifications?page=2&limit=10');
  });

  it('returns items, pagination, and unread_count from response', async () => {
    apiClient.get.mockReturnValue(
      mockResponse({ items: [NOTIFICATION_ITEM], pagination: PAGINATION, unread_count: 1 }),
    );

    const result = await notificationService.getNotifications();

    expect(result.items).toHaveLength(1);
    expect(result.items[0].id).toBe('notif-1');
    expect(result.unread_count).toBe(1);
    expect(result.pagination.total).toBe(1);
  });

  it('rejects on 401 unauthorized', async () => {
    apiClient.get.mockReturnValue(mockApiError(401, 'UNAUTHORIZED'));

    await expect(notificationService.getNotifications()).rejects.toThrow();
  });
});

// ─── markAsRead ───────────────────────────────────────────────────────────────

describe('notificationService.markAsRead', () => {
  beforeEach(() => jest.clearAllMocks());

  it('sends PATCH to /v2/users/me/notifications/:id/read', async () => {
    const read = { ...NOTIFICATION_ITEM, is_read: true };
    apiClient.patch.mockReturnValue(mockResponse(read));

    await notificationService.markAsRead('notif-1');

    expect(apiClient.patch).toHaveBeenCalledWith('/v2/users/me/notifications/notif-1/read');
  });

  it('returns the updated notification with is_read true', async () => {
    const read = { ...NOTIFICATION_ITEM, is_read: true };
    apiClient.patch.mockReturnValue(mockResponse(read));

    const result = await notificationService.markAsRead('notif-1');

    expect(result.is_read).toBe(true);
    expect(result.id).toBe('notif-1');
  });

  it('rejects on 404 when notification not found', async () => {
    apiClient.patch.mockReturnValue(mockApiError(404, 'NOTIFICATION_NOT_FOUND'));

    await expect(notificationService.markAsRead('bad-id')).rejects.toMatchObject({
      response: { data: { error_code: 'NOTIFICATION_NOT_FOUND' } },
    });
  });
});
