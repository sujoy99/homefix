import { NotificationRepository } from './notification.repository';
import { IPushProvider } from './notification.interface';
import { FcmProvider } from './providers/fcm.provider';
import { StubPushProvider } from './providers/stub.provider';
import { NotificationPayload, Notification, DevicePlatform } from './notification.types';
import { NotFoundError } from '@errors/http-errors';
import { ErrorCode } from '@errors/error-code';
import { logger } from '@logger/logger';

function resolvePushProvider(): IPushProvider {
  if (process.env['FCM_SERVICE_ACCOUNT_JSON']) {
    return new FcmProvider();
  }
  return new StubPushProvider();
}

class NotificationService {
  private push: IPushProvider = resolvePushProvider();

  async send(payload: NotificationPayload): Promise<Notification> {
    const notification = await NotificationRepository.createNotification(payload);

    const tokens = await NotificationRepository.findTokensByUserId(payload.userId);
    if (tokens.length > 0) {
      // Fire-and-forget: push failure must not fail the caller
      const sends = tokens.map((dt) =>
        this.push
          .send(dt.token, payload.title.en, payload.body.en, {
            type: payload.type,
            ...(payload.data
              ? Object.fromEntries(
                  Object.entries(payload.data).map(([k, v]) => [k, String(v)]),
                )
              : {}),
          })
          .catch((err: unknown) => {
            logger.warn(`Push delivery failed for token ${dt.token}: ${String(err)}`);
          }),
      );
      await Promise.allSettled(sends);
    }

    return notification;
  }

  async registerToken(userId: string, token: string, platform: DevicePlatform): Promise<void> {
    await NotificationRepository.upsertDeviceToken(userId, token, platform);
  }

  async unregisterToken(userId: string, token: string): Promise<void> {
    await NotificationRepository.removeDeviceToken(userId, token);
  }

  async list(
    userId: string,
    page: number,
    limit: number,
  ): Promise<{ items: Notification[]; total: number; unread_count: number }> {
    const [items, total, unread_count] = await Promise.all([
      NotificationRepository.listByUser(userId, page, limit),
      NotificationRepository.countByUser(userId),
      NotificationRepository.countUnread(userId),
    ]);
    return { items, total, unread_count };
  }

  async markRead(id: string, userId: string): Promise<Notification> {
    const notification = await NotificationRepository.markAsRead(id, userId);
    if (!notification) {
      throw new NotFoundError(ErrorCode.RESOURCE_NOT_FOUND, 'Notification not found');
    }
    return notification;
  }
}

export const notificationService = new NotificationService();
