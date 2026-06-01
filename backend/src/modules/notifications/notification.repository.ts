import { TransactionOrKnex, PartialModelObject } from 'objection';
import { NotificationModel } from './notification.model';
import { DeviceTokenModel } from './device_token.model';
import { Notification, DeviceToken, NotificationPayload, DevicePlatform } from './notification.types';

export class NotificationRepository {
  static async upsertDeviceToken(
    userId: string,
    token: string,
    platform: DevicePlatform,
  ): Promise<DeviceToken> {
    const existing = await DeviceTokenModel.query().findOne({ user_id: userId, token });
    if (existing) return existing as unknown as DeviceToken;
    return DeviceTokenModel.query().insertAndFetch({
      user_id: userId,
      token,
      platform,
    } as PartialModelObject<DeviceTokenModel>) as unknown as DeviceToken;
  }

  static async removeDeviceToken(userId: string, token: string): Promise<void> {
    await DeviceTokenModel.query().delete().where({ user_id: userId, token });
  }

  static async findTokensByUserId(userId: string): Promise<DeviceToken[]> {
    return DeviceTokenModel.query().where('user_id', userId) as unknown as DeviceToken[];
  }

  static async createNotification(
    payload: NotificationPayload,
    trx?: TransactionOrKnex,
  ): Promise<Notification> {
    return NotificationModel.query(trx).insertAndFetch({
      user_id: payload.userId,
      type: payload.type,
      title_en: payload.title.en,
      title_bn: payload.title.bn,
      body_en: payload.body.en,
      body_bn: payload.body.bn,
      data: payload.data ?? null,
    } as PartialModelObject<NotificationModel>) as unknown as Notification;
  }

  static async listByUser(
    userId: string,
    page: number,
    limit: number,
  ): Promise<Notification[]> {
    const offset = (page - 1) * limit;
    return NotificationModel.query()
      .where('user_id', userId)
      .orderBy('created_at', 'desc')
      .limit(limit)
      .offset(offset) as unknown as Notification[];
  }

  static async countByUser(userId: string): Promise<number> {
    const result = await NotificationModel.query()
      .where('user_id', userId)
      .count('id as count')
      .first();
    return Number((result as unknown as { count: string }).count);
  }

  static async countUnread(userId: string): Promise<number> {
    const result = await NotificationModel.query()
      .where({ user_id: userId, is_read: false })
      .count('id as count')
      .first();
    return Number((result as unknown as { count: string }).count);
  }

  static async markAsRead(id: string, userId: string): Promise<Notification | undefined> {
    return NotificationModel.query()
      .patchAndFetchById(id, { is_read: true } as PartialModelObject<NotificationModel>)
      .where('user_id', userId) as unknown as Notification | undefined;
  }
}
