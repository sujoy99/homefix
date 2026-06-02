import { Response } from 'express';
import { AuthenticatedRequest } from '@modules/auth/auth.types';
import { MessageService } from './message.service';
import { HttpResponse } from '@http/response';
import { param } from '@utils/param';

export class MessageController {
  static async send(req: AuthenticatedRequest, res: Response): Promise<Response> {
    const jobId = param(req, 'id');
    const { sub } = req.user;
    const { content, type } = req.body as { content: string; type?: 'text' | 'image' };

    const message = await MessageService.send(jobId, sub, content, type);
    return HttpResponse.success(res, message, 'Message sent', 201);
  }

  static async list(req: AuthenticatedRequest, res: Response): Promise<Response> {
    const jobId = param(req, 'id');
    const { sub } = req.user;
    const limit = Number(req.query['limit'] ?? 50);
    const before = req.query['before'] as string | undefined;

    const query = before !== undefined ? { limit, before } : { limit };
    const result = await MessageService.list(jobId, sub, query);
    return HttpResponse.success(res, result, 'Messages fetched');
  }
}
