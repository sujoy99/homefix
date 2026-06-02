import { Model } from 'objection';
import { NotificationType } from './notification.types';

export class NotificationModel extends Model {
  static tableName = 'notifications';

  id!: string;
  user_id!: string;
  type!: NotificationType;
  title_en!: string;
  title_bn!: string;
  body_en!: string;
  body_bn!: string;
  data!: Record<string, unknown> | null;
  is_read!: boolean;
  created_at!: string;
}
