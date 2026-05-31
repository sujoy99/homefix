import { apiClient } from '@/api/client';

export type ProviderSkill = {
  id: string;
  category_id: string;
  is_primary: boolean;
};

export type AvailableProvider = {
  id: string;
  user_id: string;
  bio: string | null;
  experience_years: number;
  hourly_rate: number | string | null;
  is_available: boolean;
  rating_avg: string;
  total_reviews: number;
  skills: ProviderSkill[];
  user?: {
    id: string;
    full_name: string;
    photo_url?: string | null;
  };
};

type ApiResponse<T> = { status: string; body: T };

export const providerService = {
  listAvailable: async (): Promise<AvailableProvider[]> => {
    const res = await apiClient.get<ApiResponse<AvailableProvider[]>>('/v2/providers/available');
    return res.data.body;
  },

  getProfile: async (userId: string): Promise<AvailableProvider> => {
    const res = await apiClient.get<ApiResponse<AvailableProvider>>(`/v2/providers/${userId}`);
    return res.data.body;
  },

  getMyProfile: async (): Promise<AvailableProvider> => {
    const res = await apiClient.get<ApiResponse<AvailableProvider>>('/v2/providers/me/profile');
    return res.data.body;
  },

  addSkill: async (categoryId: string): Promise<AvailableProvider> => {
    const res = await apiClient.post<ApiResponse<AvailableProvider>>('/v2/providers/me/skills', {
      category_id: categoryId,
      is_primary: false,
    });
    return res.data.body;
  },

  removeSkill: async (skillId: string): Promise<void> => {
    await apiClient.delete(`/v2/providers/me/skills/${skillId}`);
  },

  updateMyAvailability: async (isAvailable: boolean): Promise<AvailableProvider> => {
    const res = await apiClient.patch<ApiResponse<AvailableProvider>>('/v2/providers/me/profile', {
      is_available: isAvailable,
    });
    return res.data.body;
  },

  updateMyProfile: async (data: {
    bio?: string | null;
    hourly_rate?: number | null;
    experience_years?: number;
    photo_url?: string | null;
    latitude?: number;
    longitude?: number;
  }): Promise<AvailableProvider> => {
    const res = await apiClient.patch<ApiResponse<AvailableProvider>>('/v2/providers/me/profile', data);
    return res.data.body;
  },

  uploadPhoto: async (uri: string): Promise<string> => {
    const filename = uri.split('/').pop() ?? `photo_${Date.now()}.jpg`;
    const form = new FormData();
    form.append('file', { uri, name: filename, type: 'image/jpeg' } as unknown as Blob);
    const res = await apiClient.post<ApiResponse<{ url: string }>>('/v2/storage/upload', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data.body.url;
  },
};
