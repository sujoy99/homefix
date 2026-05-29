import { apiClient } from '@/api/client';

export type PendingProvider = {
  id: string;
  full_name: string;
  mobile: string;
  email: string | null;
  nid: string;
  status: string;
  created_at: string;
};

type ApiResponse<T> = { status: string; body: T };

export const adminService = {
  listPending: async (): Promise<PendingProvider[]> => {
    const res = await apiClient.get<ApiResponse<PendingProvider[]>>(
      '/v2/admin/providers/pending'
    );
    return res.data.body;
  },

  approve: async (providerId: string): Promise<void> => {
    await apiClient.post(`/v2/admin/providers/${providerId}/approve`);
  },

  reject: async (providerId: string): Promise<void> => {
    await apiClient.post(`/v2/admin/providers/${providerId}/reject`);
  },
};
