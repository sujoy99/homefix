import { Response } from 'express';
import { AuthenticatedRequest } from '@modules/auth/auth.types';
import { CallService } from './call.service';
import { HttpResponse } from '@http/response';
import { param } from '@utils/param';

export class CallController {
  static async createRoom(req: AuthenticatedRequest, res: Response): Promise<Response> {
    const jobId = param(req, 'id');
    const { sub } = req.user;

    const roomConfig = await CallService.createRoom(jobId, sub);
    return HttpResponse.success(res, roomConfig, 'Call room created', 201);
  }
}
