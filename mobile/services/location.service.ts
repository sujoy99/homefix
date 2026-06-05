import { apiClient } from '@/api/client';

type ApiResponse<T> = { status: string; body: T };

export interface ProviderLocation {
  latitude: number;
  longitude: number;
}

export const locationService = {
  updateMyLocation: async (latitude: number, longitude: number): Promise<void> => {
    await apiClient.put<ApiResponse<ProviderLocation>>('/v2/providers/me/location', { latitude, longitude });
  },

  getProviderLocation: async (jobId: string): Promise<ProviderLocation> => {
    const res = await apiClient.get<ApiResponse<ProviderLocation>>(
      `/v2/jobs/${jobId}/provider-location`,
    );
    return res.data.body;
  },
};
