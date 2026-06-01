import { DevicePlatform } from './notification.types';

export interface RegisterDeviceTokenDTO {
  token: string;
  platform: DevicePlatform;
}
