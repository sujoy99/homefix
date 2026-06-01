export enum NotificationType {
  JOB_ACCEPTED = 'JOB_ACCEPTED',
  JOB_COMPLETED = 'JOB_COMPLETED',
  PAYMENT_RECEIVED = 'PAYMENT_RECEIVED',
  JOB_CANCELLED = 'JOB_CANCELLED',
  NEW_MESSAGE = 'NEW_MESSAGE',
}

export type DevicePlatform = 'android' | 'ios' | 'web';

export interface DeviceToken {
  id: string;
  user_id: string;
  token: string;
  platform: DevicePlatform;
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title_en: string;
  title_bn: string;
  body_en: string;
  body_bn: string;
  data: Record<string, unknown> | null;
  is_read: boolean;
  created_at: string;
}

export interface NotificationPayload {
  userId: string;
  type: NotificationType;
  title: { en: string; bn: string };
  body: { en: string; bn: string };
  data?: Record<string, unknown>;
}
