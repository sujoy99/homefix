import apiClient from './api';
import { NidPhotoSource } from '@homefix/shared';

interface PublicConfig {
  nid_photo_source: NidPhotoSource;
  platform_commission_pct: string;
  [key: string]: string;
}

export const configService = {
  getPublic: (): Promise<PublicConfig> => apiClient.get('/v2/config/public'),
};
