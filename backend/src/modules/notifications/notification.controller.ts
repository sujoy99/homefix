import { Response } from 'express';
import { notificationService } from './notification.service';
import { HttpResponse } from '@http/response';
import { AuthenticatedRequest } from '@modules/auth/auth.types';
import { RegisterDeviceTokenDTO } from './notification.dto';
import { param } from '@utils';

export class NotificationController {
  static async registerToken(req: AuthenticatedRequest, res: Response): Promise<Response> {
    const { token, platform } = req.body as RegisterDeviceTokenDTO;
    await notificationService.registerToken(req.user.sub, token, platform);
    return HttpResponse.success(res, null, 'Device token registered', 201);
  }

  static async unregisterToken(req: AuthenticatedRequest, res: Response): Promise<Response> {
    const { token } = req.body as { token: string };
    await notificationService.unregisterToken(req.user.sub, token);
    return HttpResponse.success(res, null, 'Device token removed');
  }

  static async listNotifications(req: AuthenticatedRequest, res: Response): Promise<Response> {
    const page = Number(req.query['page'] ?? 1);
    const limit = Number(req.query['limit'] ?? 20);
    const { items, total, unread_count } = await notificationService.list(req.user.sub, page, limit);
    return HttpResponse.success(res, {
      items,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      unread_count,
    }, 'Notifications');
  }

  static async markRead(req: AuthenticatedRequest, res: Response): Promise<Response> {
    const notification = await notificationService.markRead(param(req, 'id'), req.user.sub);
    return HttpResponse.success(res, notification, 'Notification marked as read');
  }
}
