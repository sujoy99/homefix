import { apiClient } from '../api/client';

type ApiResponse<T> = { status: string; body: T };

export interface AppNotification {
  id: string;
  type: string;
  title_en: string;
  title_bn: string;
  body_en: string;
  body_bn: string;
  data: Record<string, unknown> | null;
  is_read: boolean;
  created_at: string;
}

export interface NotificationListResult {
  items: AppNotification[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
  unread_count: number;
}

export const notificationService = {
  registerDeviceToken: async (token: string): Promise<void> => {
    await apiClient.post<ApiResponse<void>>('/v2/users/me/device-token', { token });
  },

  unregisterDeviceToken: async (): Promise<void> => {
    await apiClient.delete<ApiResponse<void>>('/v2/users/me/device-token');
  },

  getNotifications: async (page = 1, limit = 20): Promise<NotificationListResult> => {
    const res = await apiClient.get<ApiResponse<NotificationListResult>>(
      `/v2/users/me/notifications?page=${page}&limit=${limit}`,
    );
    return res.data.body;
  },

  markAsRead: async (id: string): Promise<AppNotification> => {
    const res = await apiClient.patch<ApiResponse<AppNotification>>(
      `/v2/users/me/notifications/${id}/read`,
    );
    return res.data.body;
  },
};
