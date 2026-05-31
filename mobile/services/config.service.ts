import { apiClient } from '@/api/client';
import { NidPhotoSource } from '@homefix/shared';

type ApiResponse<T> = { status: string; body: T };

export interface PublicConfig {
  nid_photo_source: NidPhotoSource;
  platform_commission_pct: string;
  active_payment_gateway: string;
  bkash_merchant_number: string;
  nagad_merchant_number: string;
  [key: string]: string;
}

export const configService = {
  getPublic: async (): Promise<PublicConfig> => {
    const res = await apiClient.get<ApiResponse<PublicConfig>>('/v2/config/public');
    return res.data.body;
  },
};
