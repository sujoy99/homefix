import { act } from 'react';
import { useNotificationStore } from '../../store/notificationStore';

jest.mock('../../services/notification.service', () => ({
  notificationService: {
    getNotifications: jest.fn(),
    markAsRead: jest.fn(),
  },
}));

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { notificationService } = require('../../services/notification.service');

const ITEM_UNREAD = {
  id: 'n1',
  type: 'JOB_ACCEPTED',
  title_en: 'Job Accepted',
  title_bn: 'কাজ গ্রহণ',
  body_en: 'Accepted',
  body_bn: 'গ্রহণ করা হয়েছে',
  data: { jobId: 'job-1' },
  is_read: false,
  created_at: '2026-06-05T10:00:00Z',
};

const ITEM_READ = { ...ITEM_UNREAD, id: 'n2', is_read: true };

function makeListResponse(items: typeof ITEM_UNREAD[], unread_count = 0, total = items.length) {
  return {
    items,
    pagination: { page: 1, limit: 20, total, totalPages: Math.ceil(total / 20) },
    unread_count,
  };
}

function resetStore() {
  useNotificationStore.setState({
    notifications: [],
    unreadCount: 0,
    page: 1,
    hasMore: true,
    loading: false,
  });
}

describe('notificationStore — initial state', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    resetStore();
  });

  it('starts with empty notifications and zero unread count', () => {
    const s = useNotificationStore.getState();
    expect(s.notifications).toHaveLength(0);
    expect(s.unreadCount).toBe(0);
    expect(s.loading).toBe(false);
    expect(s.hasMore).toBe(true);
  });
});

describe('notificationStore.fetchNotifications', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    resetStore();
  });

  it('sets notifications and unreadCount after fetch', async () => {
    notificationService.getNotifications.mockResolvedValue(
      makeListResponse([ITEM_UNREAD], 1),
    );

    await act(async () => {
      await useNotificationStore.getState().fetchNotifications(true);
    });

    const s = useNotificationStore.getState();
    expect(s.notifications).toHaveLength(1);
    expect(s.notifications[0].id).toBe('n1');
    expect(s.unreadCount).toBe(1);
    expect(s.loading).toBe(false);
  });

  it('resets list when reset=true (default)', async () => {
    useNotificationStore.setState({ notifications: [ITEM_READ], page: 2 });
    notificationService.getNotifications.mockResolvedValue(
      makeListResponse([ITEM_UNREAD], 1),
    );

    await act(async () => {
      await useNotificationStore.getState().fetchNotifications(true);
    });

    expect(useNotificationStore.getState().notifications).toHaveLength(1);
    expect(useNotificationStore.getState().notifications[0].id).toBe('n1');
  });

  it('appends items when reset=false (load more)', async () => {
    useNotificationStore.setState({ notifications: [ITEM_READ], page: 2 });
    notificationService.getNotifications.mockResolvedValue(
      makeListResponse([ITEM_UNREAD], 1),
    );

    await act(async () => {
      await useNotificationStore.getState().fetchNotifications(false);
    });

    const s = useNotificationStore.getState();
    expect(s.notifications).toHaveLength(2);
    expect(s.notifications[0].id).toBe('n2');
    expect(s.notifications[1].id).toBe('n1');
  });

  it('sets hasMore=false when response returns fewer items than page size', async () => {
    notificationService.getNotifications.mockResolvedValue(
      makeListResponse([ITEM_UNREAD], 1),
    );

    await act(async () => {
      await useNotificationStore.getState().fetchNotifications(true);
    });

    expect(useNotificationStore.getState().hasMore).toBe(false);
  });

  it('resets loading to false after an error', async () => {
    notificationService.getNotifications.mockRejectedValue(new Error('Network'));

    await act(async () => {
      await useNotificationStore.getState().fetchNotifications(true);
    });

    expect(useNotificationStore.getState().loading).toBe(false);
  });

  it('does not start a second fetch while loading', async () => {
    useNotificationStore.setState({ loading: true });
    notificationService.getNotifications.mockResolvedValue(makeListResponse([], 0));

    await act(async () => {
      await useNotificationStore.getState().fetchNotifications(true);
    });

    expect(notificationService.getNotifications).not.toHaveBeenCalled();
  });
});

describe('notificationStore.markAsRead', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    resetStore();
    useNotificationStore.setState({ notifications: [ITEM_UNREAD, ITEM_READ], unreadCount: 1 });
  });

  it('replaces the notification in the list with the updated version', async () => {
    const updated = { ...ITEM_UNREAD, is_read: true };
    notificationService.markAsRead.mockResolvedValue(updated);

    await act(async () => {
      await useNotificationStore.getState().markAsRead('n1');
    });

    const found = useNotificationStore.getState().notifications.find((n) => n.id === 'n1');
    expect(found?.is_read).toBe(true);
  });

  it('decrements unreadCount when the notification was unread', async () => {
    const updated = { ...ITEM_UNREAD, is_read: true };
    notificationService.markAsRead.mockResolvedValue(updated);

    await act(async () => {
      await useNotificationStore.getState().markAsRead('n1');
    });

    expect(useNotificationStore.getState().unreadCount).toBe(0);
  });

  it('does not change unreadCount when notification was already read', async () => {
    const updated = { ...ITEM_READ, is_read: true };
    notificationService.markAsRead.mockResolvedValue(updated);

    await act(async () => {
      await useNotificationStore.getState().markAsRead('n2');
    });

    expect(useNotificationStore.getState().unreadCount).toBe(1);
  });
});
