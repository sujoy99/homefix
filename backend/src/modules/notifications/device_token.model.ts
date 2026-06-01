import { Model } from 'objection';
import { DevicePlatform } from './notification.types';

export class DeviceTokenModel extends Model {
  static tableName = 'device_tokens';

  id!: string;
  user_id!: string;
  token!: string;
  platform!: DevicePlatform;
  created_at!: string;
}
