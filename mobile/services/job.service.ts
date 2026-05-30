import { ImagePickerAsset } from 'expo-image-picker';
import { apiClient } from '@/api/client';
import { JobStatus } from '@homefix/shared';

export type ServiceAddress = {
  house: string;
  flat?: string;
  road: string;
  area: string;
};

export type Job = {
  id: string;
  resident_id: string;
  provider_id: string | null;
  category_id: string;
  status: JobStatus;
  title: string | null;
  description: string;
  voice_note_url: string | null;
  media_urls: string[];
  service_address: ServiceAddress;
  service_lat: number | null;
  service_lon: number | null;
  estimated_budget: number | string | null;
  square_footage: number | string | null;
  created_at: string;
  updated_at: string;
};

export type CreateJobPayload = {
  category_id: string;
  description: string;
  service_address: ServiceAddress;
  title?: string;
  service_lat?: number;
  service_lon?: number;
  estimated_budget?: number;
  square_footage?: number;
};

type ApiResponse<T> = { status: string; body: T };

export const jobService = {
  createJob: async (data: CreateJobPayload): Promise<Job> => {
    const res = await apiClient.post<ApiResponse<Job>>('/v2/jobs', data);
    return res.data.body;
  },

  uploadMedia: async (jobId: string, assets: ImagePickerAsset[]): Promise<Job> => {
    const form = new FormData();
    assets.forEach((asset) => {
      const filename = asset.fileName ?? `photo_${Date.now()}.jpg`;
      const type = asset.mimeType ?? 'image/jpeg';
      // React Native FormData accepts { uri, name, type } objects
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      form.append('files', { uri: asset.uri, name: filename, type } as any);
    });

    const res = await apiClient.post<ApiResponse<Job>>(`/v2/jobs/${jobId}/media`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data.body;
  },

  getMyJobs: async (): Promise<Job[]> => {
    const res = await apiClient.get<ApiResponse<Job[]>>('/v2/jobs');
    return res.data.body;
  },

  getJobById: async (id: string): Promise<Job> => {
    const res = await apiClient.get<ApiResponse<Job>>(`/v2/jobs/${id}`);
    return res.data.body;
  },

  getMyAssignedJobs: async (): Promise<Job[]> => {
    const res = await apiClient.get<ApiResponse<Job[]>>('/v2/jobs/assigned');
    return res.data.body;
  },

  getProviderFeed: async (params?: {
    lat?: number;
    lon?: number;
    limit?: number;
    cursor?: string;
  }): Promise<Job[]> => {
    const res = await apiClient.get<ApiResponse<Job[]>>('/v2/jobs/feed', { params });
    return res.data.body;
  },

  acceptJob: async (id: string): Promise<Job> => {
    const res = await apiClient.patch<ApiResponse<Job>>(`/v2/jobs/${id}/accept`);
    return res.data.body;
  },

  completeJob: async (id: string): Promise<Job> => {
    const res = await apiClient.patch<ApiResponse<Job>>(`/v2/jobs/${id}/complete`);
    return res.data.body;
  },

  uploadVoiceNote: async (jobId: string, fileUri: string): Promise<Job> => {
    const form = new FormData();
    const filename = `voice_${Date.now()}.m4a`;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    form.append('file', { uri: fileUri, name: filename, type: 'audio/m4a' } as any);
    const res = await apiClient.patch<ApiResponse<Job>>(`/v2/jobs/${jobId}/voice-note`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data.body;
  },
};
