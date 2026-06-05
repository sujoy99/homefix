import { create } from 'zustand';
import {
  notificationService,
  AppNotification,
} from '@/services/notification.service';

const PAGE_SIZE = 20;

interface NotificationState {
  notifications: AppNotification[];
  unreadCount: number;
  page: number;
  hasMore: boolean;
  loading: boolean;

  fetchNotifications: (reset?: boolean) => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  page: 1,
  hasMore: true,
  loading: false,

  fetchNotifications: async (reset = true) => {
    const { page, loading } = get();
    if (loading) return;
    set({ loading: true });
    try {
      const nextPage = reset ? 1 : page;
      const result = await notificationService.getNotifications(nextPage, PAGE_SIZE);
      set((s) => ({
        notifications: reset
          ? result.items
          : [...s.notifications, ...result.items],
        unreadCount: result.unread_count,
        page: nextPage + 1,
        hasMore: result.items.length === PAGE_SIZE,
        loading: false,
      }));
    } catch {
      set({ loading: false });
    }
  },

  markAsRead: async (id: string) => {
    const updated = await notificationService.markAsRead(id);
    set((s) => {
      const wasUnread = s.notifications.find((n) => n.id === id && !n.is_read);
      return {
        notifications: s.notifications.map((n) => (n.id === id ? updated : n)),
        unreadCount: wasUnread ? Math.max(0, s.unreadCount - 1) : s.unreadCount,
      };
    });
  },
}));
