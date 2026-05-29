import { Model } from 'objection';

export class PlatformSetting extends Model {
  static tableName = 'platform_settings';
  static idColumn = 'key';

  key!: string;
  value!: string;
  description?: string | null;
  created_at!: string;
  updated_at!: string;
}
