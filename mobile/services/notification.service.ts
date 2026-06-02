import { apiClient } from '../api/client';

type ApiResponse<T> = { status: string; body: T };

export const notificationService = {
  registerDeviceToken: async (token: string): Promise<void> => {
    await apiClient.post<ApiResponse<void>>('/v2/users/me/device-token', { token });
  },

  unregisterDeviceToken: async (): Promise<void> => {
    await apiClient.delete<ApiResponse<void>>('/v2/users/me/device-token');
  },
};
