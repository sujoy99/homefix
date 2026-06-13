import { apiClient } from '@/api/client';
import * as ImagePicker from 'expo-image-picker';

type ApiResponse<T> = { status: string; body: T };

export type MessageType = 'text' | 'image' | 'audio';

export interface Message {
  id: string;
  job_id: string;
  sender_id: string;
  content: string;
  type: MessageType;
  created_at: string;
}

export interface MessageListResult {
  items: Message[];
  next_cursor: string | null;
}

export const messageService = {
  list: async (jobId: string, before?: string): Promise<MessageListResult> => {
    const params = new URLSearchParams({ limit: '50' });
    if (before) params.set('before', before);
    const res = await apiClient.get<ApiResponse<MessageListResult>>(
      `/v2/jobs/${jobId}/messages?${params}`,
    );
    return res.data.body;
  },

  send: async (jobId: string, content: string, type: MessageType = 'text'): Promise<Message> => {
    const res = await apiClient.post<ApiResponse<Message>>(
      `/v2/jobs/${jobId}/messages`,
      { content, type },
    );
    return res.data.body;
  },

  uploadImage: async (asset: ImagePicker.ImagePickerAsset): Promise<string> => {
    const formData = new FormData();
    formData.append('file', {
      uri: asset.uri,
      name: asset.fileName ?? `chat_image_${Date.now()}.jpg`,
      type: asset.mimeType ?? 'image/jpeg',
    } as unknown as Blob);

    const res = await apiClient.post<ApiResponse<{ url: string; key: string }>>(
      '/v2/storage/upload',
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } },
    );
    return res.data.body.url;
  },
};
